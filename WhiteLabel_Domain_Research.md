# White-Label Domain Mapping
### In-Depth Research & Implementation Guide for InsureIQ

---

## Table of Contents

1. [What is White-Label Domain Mapping?](#1-what-is-white-label-domain-mapping)
2. [Why InsureIQ Needs It](#2-why-insureiq-needs-it)
3. [The Full Technical Architecture](#3-the-full-technical-architecture)
4. [Layer 1 — DNS: How Traffic Finds Your Servers](#4-layer-1--dns)
5. [Layer 2 — The Load Balancer / Reverse Proxy](#5-layer-2--the-load-balancer--reverse-proxy)
6. [Layer 3 — Dynamic SSL Certificates](#6-layer-3--dynamic-ssl-certificates)
7. [Layer 4 — Tenant Resolution (Application Logic)](#7-layer-4--tenant-resolution)
8. [Layer 5 — Frontend Theming from Domain Context](#8-layer-5--frontend-theming)
9. [The Provisioning Flow (Super-Admin to Live Tenant)](#9-the-provisioning-flow)
10. [Database Schema for Domain Management](#10-database-schema)
11. [Security Considerations](#11-security-considerations)
12. [Edge Cases & Failure Modes](#12-edge-cases--failure-modes)
13. [Full InsureIQ Domain Architecture Summary](#13-full-architecture-summary)

---

## 1. What is White-Label Domain Mapping?

White-label domain mapping (also called **custom domain routing** or **vanity domain hosting**) is the practice of allowing a SaaS platform to serve multiple tenants under their own, fully branded domain names — while all traffic is ultimately handled by the same underlying infrastructure.

### The Three-Layer Illusion

From the outside, three separate things appear to exist:
- `app.abcinsurance.com` — looks like ABC Insurance's own portal
- `portal.xyzlife.in` — looks like XYZ Life's own portal
- `insureiq.com` — looks like InsureIQ's own consumer marketplace

In reality, all three are served by the same FastAPI backend and the same Vite/React frontend build, running on InsureIQ's servers. The difference is purely in **what data and branding is returned**, determined by inspecting the incoming domain name.

### Real-World Precedents

| Platform | What they white-label |
|---|---|
| **Shopify** | Every merchant store (`mystore.com`) served by Shopify's infrastructure |
| **Ghost** | Every newsletter publication has its own domain |
| **Webflow** | Client sites hosted on Webflow's infrastructure under the client's domain |
| **Vercel** | Customer deployments live on customer-owned domains |
| **Stripe** | Payment pages can appear on a merchant's own domain via Stripe Elements |

InsureIQ belongs in this company — the pattern is mature, well-understood, and solvable with established tooling.

---

## 2. Why InsureIQ Needs It

The InsureIQ Software Design document states explicitly:

> *"Tenant-facing portals show no InsureIQ branding."*

This is not an aesthetic preference — it is a **commercial and trust requirement**.

### 2.1 Regulatory & Licensing Concerns
Insurance is a heavily licensed industry. An insurer's license governs what entity name can appear in customer communications and interfaces. A customer seeing `insureiq.com` in their browser while accessing what they believe is their ABC Insurance account raises compliance questions about which entity they are legally contracting with.

### 2.2 Customer Trust & Churn Risk
Insurers have spent years building brand trust with their policyholders. If a customer discovers they are on "InsureIQ" instead of their insurer's own portal, they may feel deceived, reducing trust in both the insurer and the platform.

### 2.3 B2B Sales Requirement
No insurance company with an existing brand will sign a platform contract where their end-customers can see the SaaS vendor's name. White-labeling is a table-stakes requirement for enterprise B2B sales in this vertical.

### 2.4 The InsureIQ Specific Need
InsureIQ must serve **two completely separate user experiences** from the same codebase:
- `insureiq.com` — the B2C marketplace (InsureIQ branded)
- `{tenant-subdomain}.insure-portal.com` or `app.tenantdomain.com` — the B2B tenant portals (tenant branded)

The domain is the mechanism that separates these two entirely different application surfaces.

---

## 3. The Full Technical Architecture

Here is what happens when an end-customer types `app.abcinsurance.com` into their browser:

```
User types: app.abcinsurance.com
         |
         v
[1] DNS Lookup
    Browser asks: "Who is app.abcinsurance.com?"
    CNAME record says: "Go to abcinsurance.insure-portal.com"
    Wildcard A record says: "insure-portal.com is at IP 203.0.113.42"
         |
         v
[2] TCP connection to InsureIQ's server at 203.0.113.42
         |
         v
[3] TLS Handshake (SSL)
    Server must present a valid certificate for app.abcinsurance.com
    Certificate obtained dynamically via Let's Encrypt ACME protocol
         |
         v
[4] Caddy Reverse Proxy
    Receives the HTTPS request
    Reads the Host header: "app.abcinsurance.com"
    Passes request upstream to FastAPI with Host header preserved
         |
         v
[5] FastAPI Backend -- Tenant Resolution Middleware
    Reads Host header
    Looks up "app.abcinsurance.com" in TENANT_DOMAINS table
    Attaches tenant_id = "abc-insurance-001" to request state
    All downstream queries are scoped to this tenant
         |
         v
[6] FastAPI route handler executes with tenant context
    Fetches ABC Insurance's branding config
    Fetches only ABC Insurance's policies, users, claims (RLS enforced)
         |
         v
[7] Vite/React Frontend
    Receives tenant branding config (logo URL, colors, font)
    Renders the portal with ABC Insurance's visual identity
    Browser URL bar still shows: app.abcinsurance.com

End-customer sees ABC Insurance's branded portal. InsureIQ is invisible.
```

---

## 4. Layer 1 — DNS

DNS (Domain Name System) is the internet's phone book. Every domain lookup goes through it.

### 4.1 InsureIQ's Wildcard Record (The Fallback Domain)

InsureIQ owns `insure-portal.com`. On this domain, configure:

```
# DNS Records on insure-portal.com
# (configured in your DNS provider: Cloudflare, Route 53, etc.)

Type  | Name  | Value
------|-------|-------------------------
A     | *     | 203.0.113.42   (your server IP)
A     | @     | 203.0.113.42
```

The `*` (wildcard) means: **any subdomain** maps to your server. The moment a tenant "globallife" is provisioned, `globallife.insure-portal.com` works instantly — no manual DNS configuration needed per tenant.

### 4.2 What the Tenant Configures (CNAME)

When ABC Insurance wants their portal at `app.abcinsurance.com`, their IT team logs into their domain registrar and adds one record:

```
# DNS Records on abcinsurance.com
# (configured by the TENANT, not by InsureIQ)

Type  | Name  | Value                            | TTL
------|-------|----------------------------------|------
CNAME | app   | abcinsurance.insure-portal.com.  | 3600
```

**Resolution chain:**
1. Browser asks: "What is `app.abcinsurance.com`?"
2. CNAME says: "It's an alias for `abcinsurance.insure-portal.com`"
3. Resolver asks: "What is `abcinsurance.insure-portal.com`?"
4. Wildcard A record says: "IP `203.0.113.42`"
5. Traffic lands on your server

### 4.3 DNS Verification (Security Critical)

Before marking a custom domain as active, you **must verify the CNAME actually points to you**. This prevents an attacker from claiming `app.realbank.com` in your admin panel.

```python
# InsureIQ backend verification check
import socket

def verify_cname_points_to_us(custom_domain: str, our_fallback_domain: str) -> bool:
    """
    Checks that the custom domain resolves to our infrastructure.
    e.g. verify_cname_points_to_us(
        "app.abcinsurance.com",
        "abcinsurance.insure-portal.com"
    )
    """
    try:
        resolved = socket.getfqdn(custom_domain)
        return (
            our_fallback_domain in resolved
            or "203.0.113.42" in socket.gethostbyname(custom_domain)
        )
    except socket.gaierror:
        return False
```

---

## 5. Layer 2 — The Load Balancer / Reverse Proxy

The reverse proxy sits in front of FastAPI. It handles SSL termination, forwards requests, and preserves the original `Host` header so the application knows which domain was requested.

### 5.1 Recommended Options

| Tool | Best For | Automatic SSL? |
|---|---|---|
| **Caddy** | Simplicity — automatic SSL built-in. Recommended for InsureIQ. | Yes, native |
| **Nginx + Certbot** | Maximum control, well-documented | Yes, via plugin |
| **Traefik** | Docker / Kubernetes environments | Yes, native |
| **AWS ALB + ACM** | AWS-native deployments | Yes, via ACM |
| **Cloudflare SSL for SaaS** | Global CDN + SSL offloading, no server config | Yes, managed |

### 5.2 Caddy Configuration (Recommended)

Caddy handles wildcard SSL and on-demand custom-domain SSL automatically — no Certbot scripts to manage.

```caddyfile
# Caddyfile — InsureIQ Reverse Proxy Configuration

# B2C Marketplace
insureiq.com {
    reverse_proxy localhost:8000 {
        header_up Host {host}
        header_up X-Forwarded-For {remote_host}
    }
}

# Super-Admin Console
console.insureiq.com {
    reverse_proxy localhost:8000 {
        header_up Host {host}
    }
}

# Fallback wildcard (default tenant portals)
*.insure-portal.com {
    tls {
        # Wildcard cert via DNS-01 challenge (requires DNS provider API access)
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
    reverse_proxy localhost:8000 {
        header_up Host {host}
    }
}

# Custom tenant domains — catch-all with on-demand TLS
# Handles: app.abcinsurance.com, portal.xyzlife.in, etc.
:443 {
    tls {
        on_demand
        # Ask our API before issuing any certificate — this is the security gate
        ask http://localhost:8000/internal/verify-domain
    }
    reverse_proxy localhost:8000 {
        header_up Host {host}
    }
}
```

### 5.3 The Domain Verification Endpoint

The `ask` directive calls an internal FastAPI endpoint before Caddy issues any SSL certificate for an unknown domain. This is the security guard:

```python
# app/routes/internal.py

from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db

router = APIRouter(prefix="/internal")

@router.get("/verify-domain")
async def verify_domain_for_ssl(domain: str, db=Depends(get_db)):
    """
    Called by Caddy before issuing an SSL certificate for any unknown domain.
    Returns 200 OK  -> Caddy proceeds with certificate issuance.
    Returns 403     -> Caddy refuses to issue the certificate.

    This prevents certificate issuance for domains not registered with us,
    including domains pointed at our servers by accident or maliciously.
    """
    result = await db.fetchrow(
        """
        SELECT tenant_id FROM tenant_domains
        WHERE domain = $1 AND status = 'active'
        """,
        domain
    )
    if not result:
        raise HTTPException(status_code=403, detail="Domain not registered")
    return {"status": "ok", "tenant_id": str(result["tenant_id"])}
```

---

## 6. Layer 3 — Dynamic SSL Certificates

SSL (the padlock in the browser) is non-negotiable. Every custom domain requires its own certificate because a certificate is issued for a specific domain name, and you don't know those domain names in advance.

### 6.1 The Solution: ACME Protocol + Let's Encrypt

Let's Encrypt provides free SSL certificates via the **ACME (Automatic Certificate Management Environment)** protocol. Caddy automates this entirely:

```
1. New request arrives for app.abcinsurance.com
2. Caddy has no certificate for this domain yet
3. Caddy calls /internal/verify-domain -> 200 OK (it is a registered tenant)
4. Caddy contacts Let's Encrypt: "I need a cert for app.abcinsurance.com"
5. Let's Encrypt: "Prove you control that domain"
6. ACME HTTP-01 challenge:
   Let's Encrypt requests:
     http://app.abcinsurance.com/.well-known/acme-challenge/{token}
   Caddy serves the correct token response
   This proves traffic for app.abcinsurance.com reaches our server
7. Let's Encrypt issues the certificate
8. Caddy stores it and serves the original request over HTTPS
9. Certificate auto-renews 30 days before expiry
Total time: under 2 seconds. Invisible to the end-user.
```

### 6.2 On-Demand TLS vs. Wildcard Certificate

| Approach | Used For | Trade-off |
|---|---|---|
| **On-Demand TLS** | Custom domains (`app.abcinsurance.com`) | Tiny first-request delay; all subsequent requests instant |
| **Wildcard Certificate** | Fallback domain (`*.insure-portal.com`) | Requires DNS API access; no per-subdomain delay at all |

InsureIQ uses **both**: wildcard for the fallback domain (all tenant subdomains covered by one cert), on-demand for each unique custom domain.

### 6.3 Certificate Storage

Certificates must be stored on persistent disk — not in-memory — since servers restart:

```yaml
# docker-compose.yml
volumes:
  caddy_data:    # SSL certificates — MUST be a persistent volume
    driver: local
  caddy_config:  # Caddy state
    driver: local
```

---

## 7. Layer 4 — Tenant Resolution

Every HTTP request passes through a **Tenant Resolution Middleware** before any route handler sees it. It maps the incoming domain to a `tenant_id` and attaches the tenant's context to the request.

### 7.1 The Middleware Concept

```
Incoming Request
      |
      v
+----------------------------------+
|  TenantResolutionMiddleware       |  <- Runs FIRST on every request
|                                   |
|  1. Read Host header              |
|  2. Look up in TENANT_DOMAINS     |
|  3. Attach tenant_id to request   |
|  4. If not found -> 404           |
+---------------+------------------+
                |
                v
+----------------------------------+
|  Route Handler                    |  <- Now has full tenant context
|  (e.g., GET /api/policies)        |
|                                   |
|  Uses request.state.tenant_id     |
|  DB queries auto-scoped           |
+----------------------------------+
```

### 7.2 FastAPI Middleware Implementation

```python
# app/middleware/tenant.py

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import asyncpg

SUPERADMIN_DOMAIN  = "console.insureiq.com"
MARKETPLACE_DOMAIN = "insureiq.com"
FALLBACK_SUFFIX    = ".insure-portal.com"
INTERNAL_PREFIX    = "/internal/"   # Skip tenant check for Caddy's verify endpoint


class TenantResolutionMiddleware(BaseHTTPMiddleware):
    """
    Resolves the incoming request's Host header to a tenant_id.
    Attaches tenant context to request.state for all downstream handlers.

    portal_type values:
      "superadmin"  -> console.insureiq.com
      "marketplace" -> insureiq.com
      "tenant"      -> any tenant portal (fallback subdomain or custom domain)
    """

    def __init__(self, app, db_pool: asyncpg.Pool, redis_client):
        super().__init__(app)
        self.db_pool    = db_pool
        self.redis      = redis_client

    async def dispatch(self, request: Request, call_next) -> Response:
        host = request.headers.get("host", "").split(":")[0].lower().strip()

        # Skip middleware for internal Caddy verification endpoint
        if request.url.path.startswith(INTERNAL_PREFIX):
            return await call_next(request)

        # Super-Admin Console
        if host == SUPERADMIN_DOMAIN:
            request.state.portal_type = "superadmin"
            request.state.tenant_id   = None
            return await call_next(request)

        # B2C Marketplace
        if host in (MARKETPLACE_DOMAIN, f"www.{MARKETPLACE_DOMAIN}"):
            request.state.portal_type = "marketplace"
            request.state.tenant_id   = None
            return await call_next(request)

        # Tenant Portal (fallback subdomain OR custom domain)
        tenant_id = await self._resolve_tenant(host)
        if tenant_id is None:
            return JSONResponse(
                status_code=404,
                content={"detail": f"No tenant registered for domain: {host}"}
            )

        tenant_config = await self._load_tenant_config(tenant_id)

        request.state.portal_type    = "tenant"
        request.state.tenant_id      = tenant_id
        request.state.tenant_config  = tenant_config

        return await call_next(request)

    async def _resolve_tenant(self, host: str) -> str | None:
        cache_key = f"tenant:domain:{host}"

        # Cache hit
        cached = await self.redis.get(cache_key)
        if cached is not None:
            return cached.decode() if cached != b"__NOT_FOUND__" else None

        # Cache miss -- query DB
        tenant_id = await self._resolve_from_db(host)

        if tenant_id:
            await self.redis.setex(cache_key, 300, tenant_id)         # 5-min TTL
        else:
            await self.redis.setex(cache_key, 60,  "__NOT_FOUND__")   # 1-min negative cache

        return tenant_id

    async def _resolve_from_db(self, host: str) -> str | None:
        async with self.db_pool.acquire() as conn:

            # Check 1: Registered custom domain?
            row = await conn.fetchrow(
                "SELECT tenant_id FROM tenant_domains WHERE domain = $1 AND status = 'active'",
                host
            )
            if row:
                return str(row["tenant_id"])

            # Check 2: Fallback subdomain? (e.g. abcinsurance.insure-portal.com)
            if host.endswith(FALLBACK_SUFFIX):
                subdomain = host[: -len(FALLBACK_SUFFIX)]
                row = await conn.fetchrow(
                    "SELECT id FROM tenants WHERE subdomain = $1 AND status = 'active'",
                    subdomain
                )
                if row:
                    return str(row["id"])

        return None

    async def _load_tenant_config(self, tenant_id: str) -> dict:
        cache_key = f"tenant:config:{tenant_id}"

        import json
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    t.name,
                    t.plan_tier,
                    t.isolation_mode,
                    b.logo_url,
                    b.primary_color,
                    b.secondary_color,
                    b.favicon_url,
                    b.support_email
                FROM tenants t
                LEFT JOIN tenant_branding b ON b.tenant_id = t.id
                WHERE t.id = $1
                """,
                tenant_id
            )
            config = dict(row) if row else {}

        await self.redis.setex(cache_key, 300, json.dumps(config))
        return config
```

### 7.3 Registering the Middleware

```python
# app/main.py

from fastapi import FastAPI
from app.middleware.tenant import TenantResolutionMiddleware
from app.db import create_db_pool
from app.cache import create_redis_client

app = FastAPI()

@app.on_event("startup")
async def startup():
    db_pool      = await create_db_pool()
    redis_client = await create_redis_client()
    app.add_middleware(
        TenantResolutionMiddleware,
        db_pool      = db_pool,
        redis_client = redis_client
    )
```

### 7.4 Using Tenant Context in Route Handlers

```python
# app/routes/policies.py

from fastapi import APIRouter, Request, Depends, HTTPException

router = APIRouter()

@router.get("/api/policies")
async def get_policies(request: Request, db=Depends(get_db)):
    if request.state.portal_type != "tenant":
        raise HTTPException(status_code=403, detail="Tenant portal required")

    tenant_id = request.state.tenant_id

    # PostgreSQL RLS provides a second layer of enforcement,
    # but we also pass tenant_id explicitly for clarity and query optimization.
    policies = await db.fetch(
        "SELECT * FROM policies WHERE tenant_id = $1 AND customer_id = $2",
        tenant_id,
        request.state.current_user_id
    )
    return policies


@router.get("/api/tenant/branding")
async def get_branding(request: Request):
    """
    Returns branding config for the current portal.
    Called by the frontend on first boot to apply the theme.
    """
    if request.state.portal_type == "marketplace":
        return {
            "logo_url":      "/static/insureiq-logo.svg",
            "primary_color": "#4F46E5",
            "tenant_name":   "InsureIQ"
        }

    config = request.state.tenant_config
    return {
        "logo_url":      config.get("logo_url"),
        "primary_color": config.get("primary_color", "#4F46E5"),
        "secondary_color": config.get("secondary_color", "#818CF8"),
        "favicon_url":   config.get("favicon_url"),
        "tenant_name":   config.get("name"),
        "support_email": config.get("support_email")
    }
```

> **Cache Invalidation Rule:** When a Tenant Admin updates branding (logo, colors), the API endpoint saving that change must run:
> `await redis.delete(f"tenant:config:{tenant_id}")`
> to ensure updates propagate within seconds, not 5 minutes.

---

## 8. Layer 5 — Frontend Theming

The Vite/React frontend must be "tenant-aware" — applying the correct logo, colors, and name based on which tenant's portal is being rendered. The solution is a **single frontend build** that fetches its theme from the API on boot.

### 8.1 React Theme Context

```tsx
// src/contexts/TenantContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';

interface TenantBranding {
  logoUrl:        string | null;
  primaryColor:   string;
  secondaryColor: string;
  faviconUrl:     string | null;
  tenantName:     string;
  supportEmail:   string | null;
}

const TenantContext = createContext<{ branding: TenantBranding | null; isLoading: boolean }>({
  branding:  null,
  isLoading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [branding,  setBranding]  = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tenant/branding')
      .then(r => r.json())
      .then((data: TenantBranding) => {
        setBranding(data);

        // Apply to CSS custom properties -- drives the entire design system
        const root = document.documentElement;
        root.style.setProperty('--color-primary',   data.primaryColor);
        root.style.setProperty('--color-secondary', data.secondaryColor);

        // Update browser tab title and favicon
        document.title = data.tenantName;
        if (data.faviconUrl) {
          const link: HTMLLinkElement =
            document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.rel  = 'icon';
          link.href = data.faviconUrl;
          document.head.appendChild(link);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <TenantContext.Provider value={{ branding, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
```

### 8.2 Using the Theme in Components

```tsx
// src/components/Header.tsx

import { useTenant } from '../contexts/TenantContext';

export function Header() {
  const { branding, isLoading } = useTenant();

  if (isLoading) return <div className="header-skeleton" />;

  return (
    <header className="header">
      {branding?.logoUrl ? (
        <img
          src={branding.logoUrl}
          alt={`${branding.tenantName} logo`}
          className="header-logo"
        />
      ) : (
        <span className="header-name">{branding?.tenantName}</span>
      )}
    </header>
  );
}
```

### 8.3 CSS Variables (Design System Integration)

All design tokens should reference CSS custom properties so a single API response cascades through the entire UI:

```css
/* src/index.css */

:root {
  /* Defaults -- overridden at runtime by TenantContext */
  --color-primary:        #4F46E5;
  --color-secondary:      #818CF8;
  --color-primary-hover:  color-mix(in srgb, var(--color-primary) 85%, black);
}

/* All components reference variables, never hardcoded colors */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}
```

---

## 9. The Provisioning Flow

### Phase 1 — Default Fallback Portal (Instant, no tenant action required)

```
Super-Admin completes provisioning wizard
        |
        v
System creates:
  tenants.subdomain  = "abcinsurance"
  tenants.status     = "active"
        |
        v
System auto-inserts fallback domain:
  tenant_domains.domain      = "abcinsurance.insure-portal.com"
  tenant_domains.domain_type = "fallback"
  tenant_domains.status      = "active"
        |
        v
Tenant Admin receives email:
  "Your portal is live at https://abcinsurance.insure-portal.com"

Portal is immediately accessible. No DNS work needed.
Wildcard A record covers it automatically.
```

### Phase 2 — Custom Domain Setup (Tenant-driven, when they are ready)

```
Tenant Admin: Settings -> Custom Domain -> Enter "app.abcinsurance.com"
        |
        v
System displays:
  "Add this CNAME record to your DNS provider:
   Name:  app
   Value: abcinsurance.insure-portal.com"
        |
        v
Tenant Admin configures DNS at their registrar
        |
        v
Tenant Admin clicks "Verify"
        |
        v
Backend: socket.getfqdn("app.abcinsurance.com")
         == "abcinsurance.insure-portal.com"  -> PASS
        |
        v
System inserts:
  tenant_domains.domain      = "app.abcinsurance.com"
  tenant_domains.domain_type = "custom"
  tenant_domains.status      = "active"
        |
        v
First request to app.abcinsurance.com:
  Caddy on-demand TLS -> Let's Encrypt issues cert in ~2s
  Portal serves over HTTPS under ABC Insurance's own domain
        |
        v
Tenant Admin optionally enables redirect:
  abcinsurance.insure-portal.com -> 301 -> app.abcinsurance.com
```

---

## 10. Database Schema

```sql
-- Core Tenants Table
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    subdomain       TEXT NOT NULL UNIQUE,
    plan_tier       TEXT NOT NULL DEFAULT 'starter',
    isolation_mode  TEXT NOT NULL DEFAULT 'shared',
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Domain Registry
CREATE TABLE tenant_domains (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain          TEXT NOT NULL UNIQUE,
    domain_type     TEXT NOT NULL,           -- 'fallback' | 'custom'
    status          TEXT NOT NULL DEFAULT 'pending',
                                             -- 'pending' | 'active' | 'disabled' | 'failed'
    verified_at     TIMESTAMPTZ,             -- When CNAME check passed
    ssl_issued_at   TIMESTAMPTZ,             -- When first cert was obtained
    redirect_to     UUID REFERENCES tenant_domains(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on domain for fast middleware lookups
CREATE INDEX idx_tenant_domains_domain
    ON tenant_domains(domain)
    WHERE status = 'active';

CREATE INDEX idx_tenant_domains_tenant
    ON tenant_domains(tenant_id);

-- Tenant Branding
CREATE TABLE tenant_branding (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    logo_url        TEXT,
    favicon_url     TEXT,
    primary_color   TEXT NOT NULL DEFAULT '#4F46E5',
    secondary_color TEXT NOT NULL DEFAULT '#818CF8',
    support_email   TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID
);

-- Domain Verification Audit Events
CREATE TABLE domain_verification_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id   UUID NOT NULL REFERENCES tenant_domains(id),
    event_type  TEXT NOT NULL,
                -- 'verification_attempted' | 'verification_success'
                -- | 'verification_failed'  | 'ssl_issued'
    result      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 11. Security Considerations

### 11.1 Domain Squatting Prevention

**Risk:** An attacker registers as a tenant and claims `app.realbank.com` in their settings.

**Mitigation:** CNAME verification (Section 4.3) makes this impossible. A domain is only marked `active` after proving traffic for it physically arrives at your servers. Without a real CNAME from `realbank.com`, the check fails.

### 11.2 Certificate Authority Authorization (CAA Records)

**Risk:** A rogue Certificate Authority issues a certificate for a tenant's custom domain.

**Mitigation:** Advise tenants to add a CAA record:
```
Type  | Name | Value
------|------|---------------------------
CAA   | @    | 0 issue "letsencrypt.org"
```
This instructs browsers to only trust Let's Encrypt-issued certificates for that domain.

### 11.3 Cookie Isolation

Different tenant domains provide natural cookie isolation via the browser's Same-Origin Policy:
- JWT tokens on `app.abcinsurance.com` cannot be read by `app.xyzlife.com`
- B2C marketplace (`insureiq.com`) sessions are always on a different root domain from tenant portals
- Always set cookies with `Secure; HttpOnly; SameSite=Strict`

### 11.4 Wildcard Domain Security

The wildcard `*.insure-portal.com` resolves any subdomain. To prevent abuse:
- Any subdomain not registered in the `tenants` table returns a **404 from the application** even though DNS resolves it
- Caddy's `/internal/verify-domain` check also prevents SSL issuance for unregistered subdomains

### 11.5 HTTP to HTTPS

Caddy redirects all HTTP traffic to HTTPS automatically. No plain-text traffic ever reaches the application.

### 11.6 Super-Admin Console Isolation

The middleware ensures `console.insureiq.com` is structurally separate. Any attempt to reach the Super-Admin console via a tenant domain returns a 403. The reverse is also true.

---

## 12. Edge Cases & Failure Modes

### 12.1 DNS Propagation Delay

CNAME changes can take 1–48 hours to propagate globally (based on TTL).

| Problem | Solution |
|---|---|
| Tenant clicks "Verify" too early | Show "DNS still propagating" state with a retry link. Run background re-verification every hour for 48 hours. |
| Tenant IT team set wrong TTL | Provide a live DNS check link (e.g., dnschecker.org) in the UI |

### 12.2 Certificate Renewal Failure

Let's Encrypt certificates expire every 90 days. Caddy auto-renews at 30 days. If the CNAME is removed, renewal fails.

**Mitigation — background monitor job:**

```python
# app/jobs/certificate_monitor.py

import ssl, socket
from datetime import datetime, timezone

async def check_certificate_expiry(db, notify_service):
    """Run daily. Alert tenant admin if cert is expiring soon or already failed."""
    domains = await db.fetch(
        "SELECT domain, tenant_id FROM tenant_domains "
        "WHERE status = 'active' AND domain_type = 'custom'"
    )

    for row in domains:
        domain = row["domain"]
        try:
            ctx = ssl.create_default_context()
            with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
                s.connect((domain, 443))
                cert        = s.getpeercert()
                expiry      = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                expiry      = expiry.replace(tzinfo=timezone.utc)
                days_left   = (expiry - datetime.now(timezone.utc)).days

                if days_left < 14:
                    await notify_service.alert_tenant_admin(
                        tenant_id=row["tenant_id"],
                        message=f"SSL certificate for {domain} expires in {days_left} days."
                    )
        except Exception as e:
            await notify_service.alert_tenant_admin(
                tenant_id=row["tenant_id"],
                message=f"SSL certificate check failed for {domain}: {e}"
            )
```

### 12.3 Tenant Suspension or Deletion

| State | Domain Status | User Experience |
|---|---|---|
| Suspended | `suspended` | User-friendly "Account Suspended" page (not a 404) |
| Deleted | `deprovisioned` | HTTP 410 Gone |
| Reactivated | Restored to `active` | Portal live again within seconds (cache TTL) |

### 12.4 Let's Encrypt Rate Limits

Let's Encrypt allows **50 certificates per registered domain per week**. This applies per unique root domain:
- `*.insure-portal.com` → **1 wildcard cert** covers all fallback subdomains (no limit concern)
- `app.abcinsurance.com` → 1 cert for `abcinsurance.com`; auto-renews; rate limit is not a concern

### 12.5 Fallback to Custom Domain Redirect

Once a tenant activates their custom domain, redirect the fallback:

```python
# In middleware, after resolving tenant from a fallback subdomain:
if domain_record["domain_type"] == "fallback":
    custom = await get_active_custom_domain(tenant_id)
    if custom:
        return RedirectResponse(
            url=f"https://{custom['domain']}{request.url.path}",
            status_code=301   # Permanent -- cached by browser
        )
```

---

## 13. Full Architecture Summary

```
DNS LAYER
---------
insure-portal.com          *.insure-portal.com --------> (all subdomains)
insureiq.com               --------------------------------> 203.0.113.42
console.insureiq.com       ------------------------------>
app.abcinsurance.com       --- CNAME --> abcinsurance.insure-portal.com -> 203.0.113.42
portal.xyzlife.in          --- CNAME --> xyzlife.insure-portal.com      -> 203.0.113.42


REVERSE PROXY LAYER (Caddy)
----------------------------
- Wildcard TLS cert for *.insure-portal.com  (DNS-01 challenge via Cloudflare API)
- On-Demand TLS for custom domains           (HTTP-01 challenge, ~2s on first request)
- Calls /internal/verify-domain before issuing cert for any unknown domain
- Preserves Host header on all upstream forwarding to FastAPI


FASTAPI APPLICATION LAYER
--------------------------
TenantResolutionMiddleware (runs first on every request)
  console.insureiq.com  -> portal_type="superadmin",   tenant_id=None
  insureiq.com          -> portal_type="marketplace",  tenant_id=None
  *.insure-portal.com   -> portal_type="tenant",       tenant_id from DB
  custom domains        -> portal_type="tenant",       tenant_id from DB
  unknown domains       -> HTTP 404

Redis cache:
  tenant:domain:{host}      -> tenant_id     (5-min TTL)
  tenant:config:{tenant_id} -> branding JSON (5-min TTL)

PostgreSQL RLS:
  All queries automatically scoped to tenant_id


VITE / REACT FRONTEND LAYER
----------------------------
- Single frontend build served for ALL portals
- On boot: GET /api/tenant/branding
- CSS custom properties updated (--color-primary, --color-secondary)
- <title> and <link rel="icon"> updated dynamically
- TenantContext provides logo, colors, name throughout the component tree


DOMAIN ROUTING TABLE
--------------------
Domain                           Experience
-------------------------------  --------------------------------
insureiq.com                     B2C Marketplace
console.insureiq.com             Super-Admin Console
abcinsurance.insure-portal.com   ABC Insurance Portal (fallback)
app.abcinsurance.com             ABC Insurance Portal (custom domain)
globallife.insure-portal.com     Global Life Portal (fallback)
portal.globallife.com            Global Life Portal (custom domain)
any unregistered domain          HTTP 404
```

---

## 14. Local Development

During local development, instead of using `.insure-portal.com` or custom top-level domains, you will map tenants and system portals to `*.localhost:<port>` (e.g., `*.localhost:5173` for the Vite frontend). 

The `TenantResolutionMiddleware` must support detecting `localhost` hostnames and resolving them appropriately in local environments.

**Local Routing Table:**
| Local Hostname | Portal Experience |
|----------------|-------------------|
| `insureiq.localhost:5173` | B2C Marketplace |
| `console.localhost:5173` | Super-Admin Console |
| `abc.localhost:5173` | Tenant Portal: ABC Insurance |
| `globallife.localhost:5173` | Tenant Portal: Global Life |

*(Note: Most modern browsers automatically resolve `*.localhost` to `127.0.0.1`. If working on a system that doesn't, you may need to update your `/etc/hosts` file.)*

---

*Authored as part of the InsureIQ technical knowledge base.
Consult alongside `InsureIQ_Software_Design.md` and `InsureIQ_Knowledge_Base.md`.*
