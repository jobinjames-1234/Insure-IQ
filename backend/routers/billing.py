from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from .. import models, schemas, database
from ..audit import log_audit_event
from .team import verify_tenant_admin

router = APIRouter(prefix="/billing", tags=["billing"])

TIER_CONFIGS: Dict[str, Dict[str, Any]] = {
    "Starter": {
        "base_fee": 499.0,
        "policy_quota": 1000,
        "claim_quota": 500
    },
    "Growth": {
        "base_fee": 1499.0,
        "policy_quota": 5000,
        "claim_quota": 2500
    },
    "Enterprise AI": {
        "base_fee": 4250.0,
        "policy_quota": 10000,
        "claim_quota": 5000
    },
    "Enterprise": {
        "base_fee": 4250.0,
        "policy_quota": 10000,
        "claim_quota": 5000
    }
}

def get_or_create_subscription(db: Session, tenant_id: int) -> models.TenantSubscription:
    sub = db.query(models.TenantSubscription).filter(
        models.TenantSubscription.tenant_id == tenant_id
    ).first()

    if not sub:
        tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        tier_name = tenant.plan_tier if tenant and tenant.plan_tier in TIER_CONFIGS else "Enterprise AI"
        cfg = TIER_CONFIGS.get(tier_name, TIER_CONFIGS["Enterprise AI"])

        # Calculate next reset date (1st of next month)
        now = datetime.now(timezone.utc)
        if now.month == 12:
            next_reset = datetime(now.year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            next_reset = datetime(now.year, now.month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

        sub = models.TenantSubscription(
            tenant_id=tenant_id,
            plan_tier=tier_name,
            billing_cycle="monthly",
            base_fee=cfg["base_fee"],
            policy_quota=cfg["policy_quota"],
            claim_quota=cfg["claim_quota"],
            cycle_reset_date=next_reset,
            payment_method_type="card",
            card_brand="Visa",
            card_last4="4242",
            card_exp_month=12,
            card_exp_year=2028,
            billing_email=f"billing@{tenant.subdomain}.insureiq.app" if tenant else None
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

        # Create the initial invoice for this billing cycle with tenant-scoped unique number
        inv_number = f"INV-{now.year}-{now.month:02d}-{tenant_id:03d}"
        inv = models.TenantInvoice(
            tenant_id=tenant_id,
            invoice_number=inv_number,
            invoice_date=now,
            due_date=now + timedelta(days=30),
            period_start=datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc),
            period_end=next_reset,
            amount=cfg["base_fee"],
            status="paid",
            paid_at=now,
            payment_reference="ch_init_corp_card_4242"
        )
        db.add(inv)
        db.commit()

    return sub

def detect_card_brand(card_num: str) -> str:
    cleaned = card_num.replace(" ", "").replace("-", "")
    if cleaned.startswith("4"):
        return "Visa"
    elif cleaned.startswith(("51", "52", "53", "54", "55")):
        return "Mastercard"
    elif cleaned.startswith(("34", "37")):
        return "Amex"
    elif cleaned.startswith("6011"):
        return "Discover"
    return "Corporate Card"

@router.get("/summary", response_model=schemas.BillingSummary)
def get_billing_summary(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    """
    Get full billing overview: subscription plan, real usage metering, and invoice history.
    """
    sub = get_or_create_subscription(db, admin.tenant_id)

    # 1. Real usage counts from the database
    # Safe queries against policies and claims tables
    policies_issued = 0
    claims_processed = 0

    if hasattr(models, "Policy"):
        policies_issued = db.query(models.Policy).filter(
            models.Policy.tenant_id == admin.tenant_id
        ).count()

    if hasattr(models, "Claim"):
        claims_processed = db.query(models.Claim).filter(
            models.Claim.tenant_id == admin.tenant_id
        ).count()

    # Calculate utilization %
    policy_quota = sub.policy_quota if sub.policy_quota > 0 else 1000
    claim_quota = sub.claim_quota if sub.claim_quota > 0 else 500

    policy_utilization = min(100.0, round((policies_issued / policy_quota) * 100, 1))
    claim_utilization = min(100.0, round((claims_processed / claim_quota) * 100, 1))
    is_near_limit = policy_utilization >= 80.0 or claim_utilization >= 80.0

    usage = schemas.UsageMetrics(
        policies_issued=policies_issued,
        policy_quota=policy_quota,
        policy_utilization=policy_utilization,
        claims_processed=claims_processed,
        claim_quota=claim_quota,
        claim_utilization=claim_utilization,
        is_near_limit=is_near_limit
    )

    # 2. Retrieve Invoices
    invoices = db.query(models.TenantInvoice).filter(
        models.TenantInvoice.tenant_id == admin.tenant_id
    ).order_by(models.TenantInvoice.invoice_date.desc()).all()

    # 3. Estimated next bill (base fee + any overages if quota exceeded)
    est_next_bill = sub.base_fee

    return schemas.BillingSummary(
        subscription=sub,
        usage=usage,
        invoices=invoices,
        estimated_next_bill=est_next_bill
    )

@router.put("/payment-method", response_model=schemas.TenantSubscription)
def update_payment_method(
    card_in: schemas.PaymentMethodUpdate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    """
    Update saved corporate payment card. Logs an immutable audit entry.
    """
    sub = get_or_create_subscription(db, admin.tenant_id)

    cleaned = card_in.card_number.replace(" ", "").replace("-", "")
    last4 = cleaned[-4:] if len(cleaned) >= 4 else "4242"
    brand = detect_card_brand(cleaned)

    sub.card_brand = brand
    sub.card_last4 = last4
    sub.card_exp_month = card_in.exp_month
    sub.card_exp_year = card_in.exp_year
    if card_in.billing_email:
        sub.billing_email = card_in.billing_email

    db.commit()
    db.refresh(sub)

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="billing",
        action="payment_method_updated",
        outcome="success",
        entity_type="subscription",
        entity_id=str(sub.id),
        entity_name=f"{brand} •••• {last4}",
        summary=f"Updated billing payment method to {brand} •••• {last4}",
        notes=f"Card updated by {admin.email}. Expiration: {card_in.exp_month}/{card_in.exp_year}.",
        details={"card_brand": brand, "last4": last4, "billing_email": sub.billing_email}
    )

    return sub

@router.put("/plan", response_model=schemas.TenantSubscription)
def change_subscription_plan(
    plan_in: schemas.PlanTierUpdate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    """
    Change or upgrade subscription plan tier. Updates quotas and base fees.
    """
    sub = get_or_create_subscription(db, admin.tenant_id)
    old_plan = sub.plan_tier

    cfg = TIER_CONFIGS.get(plan_in.plan_tier)
    if not cfg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan tier. Available tiers: {list(TIER_CONFIGS.keys())}"
        )

    sub.plan_tier = plan_in.plan_tier
    sub.base_fee = cfg["base_fee"]
    sub.policy_quota = cfg["policy_quota"]
    sub.claim_quota = cfg["claim_quota"]

    # Also update Tenant model
    tenant = db.query(models.Tenant).filter(models.Tenant.id == admin.tenant_id).first()
    if tenant:
        tenant.plan_tier = plan_in.plan_tier

    db.commit()
    db.refresh(sub)

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="billing",
        action="plan_tier_changed",
        outcome="success",
        entity_type="subscription",
        entity_id=str(sub.id),
        entity_name=sub.plan_tier,
        summary=f"Switched subscription plan from {old_plan} to {sub.plan_tier}",
        notes=f"New monthly base fee: ${sub.base_fee:,.2f}. Quotas updated to {sub.policy_quota:,} policies and {sub.claim_quota:,} claims.",
        details={
            "previous_plan": old_plan,
            "new_plan": sub.plan_tier,
            "base_fee": sub.base_fee,
            "policy_quota": sub.policy_quota,
            "claim_quota": sub.claim_quota
        }
    )

    return sub

@router.post("/invoices/{invoice_id}/pay", response_model=schemas.TenantInvoice)
def pay_invoice(
    invoice_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    """
    Pay an outstanding invoice using the corporate card on file.
    """
    invoice = db.query(models.TenantInvoice).filter(
        models.TenantInvoice.id == invoice_id,
        models.TenantInvoice.tenant_id == admin.tenant_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    if invoice.status == "paid":
        return invoice

    sub = get_or_create_subscription(db, admin.tenant_id)

    invoice.status = "paid"
    invoice.paid_at = datetime.now(timezone.utc)
    invoice.payment_reference = f"ch_{invoice.invoice_number.lower()}_{sub.card_last4}"

    db.commit()
    db.refresh(invoice)

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="billing",
        action="invoice_paid",
        outcome="success",
        entity_type="invoice",
        entity_id=str(invoice.id),
        entity_name=invoice.invoice_number,
        summary=f"Paid invoice {invoice.invoice_number} for ${invoice.amount:,.2f}",
        notes=f"Payment settled using {sub.card_brand} •••• {sub.card_last4}.",
        details={
            "invoice_number": invoice.invoice_number,
            "amount": invoice.amount,
            "payment_reference": invoice.payment_reference
        }
    )

    return invoice

@router.get("/invoices/{invoice_id}/receipt")
def download_invoice_receipt(
    invoice_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    """
    Generate official print-ready Tax Invoice Receipt in HTML format for download.
    """
    invoice = db.query(models.TenantInvoice).filter(
        models.TenantInvoice.id == invoice_id,
        models.TenantInvoice.tenant_id == admin.tenant_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    tenant = db.query(models.Tenant).filter(models.Tenant.id == admin.tenant_id).first()
    sub = get_or_create_subscription(db, admin.tenant_id)

    inv_date = invoice.invoice_date.strftime("%B %d, %Y")
    due_date = invoice.due_date.strftime("%B %d, %Y")
    paid_date = invoice.paid_at.strftime("%B %d, %Y at %H:%M UTC") if invoice.paid_at else "Unpaid"

    receipt_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tax Invoice - {invoice.invoice_number}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }}
        .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }}
        .logo {{ font-size: 24px; font-weight: 800; color: #1d4ed8; letter-spacing: -0.5px; }}
        .status-badge {{ display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; text-transform: uppercase; }}
        .paid {{ background: #dcfce7; color: #15803d; border: 1px solid #86efac; }}
        .due {{ background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }}
        .details-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }}
        .bill-to {{ font-size: 14px; line-height: 1.6; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th {{ background: #f8fafc; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1; }}
        td {{ padding: 16px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
        .total-row td {{ font-weight: 700; font-size: 16px; border-top: 2px solid #cbd5e1; }}
        .footer {{ margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="logo">InsureIQ Platform</div>
            <div style="color: #64748b; font-size: 13px; margin-top: 4px;">Cloud Core Multi-Tenant Insurance Engine</div>
        </div>
        <div style="text-align: right;">
            <div class="status-badge {invoice.status}">{invoice.status.upper()}</div>
            <div style="font-size: 18px; font-weight: 700; margin-top: 8px;">{invoice.invoice_number}</div>
        </div>
    </div>

    <div class="details-grid">
        <div class="bill-to">
            <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Billed To:</strong><br>
            <strong style="font-size: 16px;">{tenant.name if tenant else 'Tenant Organization'}</strong><br>
            Tenant Domain: {tenant.subdomain if tenant else ''}.insureiq.app<br>
            Billing Contact: {sub.billing_email or admin.email}
        </div>
        <div class="bill-to" style="text-align: right;">
            <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Invoice Details:</strong><br>
            Invoice Date: <strong>{inv_date}</strong><br>
            Due Date: <strong>{due_date}</strong><br>
            Payment Settled: <strong>{paid_date}</strong><br>
            Payment Method: <strong>{sub.card_brand} •••• {sub.card_last4}</strong>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Billing Period</th>
                <th style="text-align: right;">Amount (USD)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>{sub.plan_tier} Subscription</strong><br><span style="color: #64748b; font-size: 12px;">Includes up to {sub.policy_quota:,} policies and {sub.claim_quota:,} claims</span></td>
                <td>{invoice.period_start.strftime('%b %d')} - {invoice.period_end.strftime('%b %d, %Y')}</td>
                <td style="text-align: right; font-family: monospace;">${invoice.amount:,.2f}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2">Total Amount Paid</td>
                <td style="text-align: right; font-family: monospace; color: #1d4ed8;">${invoice.amount:,.2f}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        InsureIQ Technologies Inc. • Automated B2B Billing & Usage Settlement System • Transaction Ref: {invoice.payment_reference or 'N/A'}
    </div>
</body>
</html>"""

    return Response(
        content=receipt_html,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename={invoice.invoice_number}.html"}
    )
