import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Home,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  Info,
  UploadCloud,
  FileText,
  Paperclip
} from 'lucide-react';

interface AgentNewApplicationProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
    plan_tier?: string;
    status: string;
  };
  currentUser: {
    id: number;
    email: string;
    name?: string;
    role: string;
    tenant_id: number;
    profile_photo?: string;
  };
}

interface CustomerOption {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  churn_risk_flag?: boolean;
}

interface ApplicationDocItem {
  id: string;
  doc_type: string;
  name: string;
  url?: string;
  size_bytes: number;
  description?: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface SubmittedApplication {
  id: number;
  application_number: string;
  applicant_name: string;
  applicant_email: string;
  product_type: string;
  coverage_amount: number;
  proposed_premium: number;
  risk_score: number;
  risk_tier: string;
  status: string;
  created_at: string;
}

export default function AgentNewApplication({ tenantContext, currentUser }: AgentNewApplicationProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCustomerId = searchParams.get('customer_id');

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Customer state
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Step 1: Product selection
  const [selectedProduct, setSelectedProduct] = useState<string>('auto');

  // Step 2: Policy parameters & details
  const [coverageAmount, setCoverageAmount] = useState<number>(100000);
  const [proposedPremium, setProposedPremium] = useState<number>(1200);
  const [effectiveDate, setEffectiveDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Dynamic product fields
  const [vehicleDetails, setVehicleDetails] = useState({
    make: 'Toyota',
    model: 'Camry',
    year: '2023',
    annualMileage: '12000'
  });
  const [propertyDetails, setPropertyDetails] = useState({
    propertyType: 'Single Family',
    squareFeet: '2200',
    yearBuilt: '2015',
    securitySystem: 'yes'
  });
  const [healthLifeDetails, setHealthLifeDetails] = useState({
    tobaccoUse: 'no',
    occupation: 'Professional / Office',
    termYears: '20'
  });

  // Step 3: Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<SubmittedApplication | null>(null);

  // Sub-Slice A6.2: Document Upload state
  const [uploadedDocs, setUploadedDocs] = useState<ApplicationDocItem[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('drivers_license');
  const [docDescription, setDocDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState<string | null>(null);
  const [uploadDocSuccess, setUploadDocSuccess] = useState(false);

  // Fetch agent's customers list or preselected customer
  const fetchCustomerPortfolio = useCallback(async () => {
    setLoadingCustomer(true);
    setCustomerError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/agents/me/customers?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to load your assigned customer portfolio.');
      }
      const data = await res.json();
      const list: CustomerOption[] = data.customers || [];
      setCustomers(list);

      if (preselectedCustomerId) {
        const found = list.find((c) => c.id === parseInt(preselectedCustomerId, 10));
        if (found) {
          setSelectedCustomer(found);
        } else {
          // Attempt direct fetch if not in the first 100
          const directRes = await fetch(`/api/agents/me/customers/${preselectedCustomerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (directRes.ok) {
            const directCust = await directRes.json();
            setSelectedCustomer(directCust);
          } else {
            setCustomerError(`Customer #${preselectedCustomerId} not found in your assigned portfolio.`);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCustomerError(err.message);
      } else {
        setCustomerError('An unexpected error occurred while loading customers.');
      }
    } finally {
      setLoadingCustomer(false);
    }
  }, [preselectedCustomerId]);

  useEffect(() => {
    fetchCustomerPortfolio();
  }, [fetchCustomerPortfolio]);

  const handleProductSelect = (productKey: string) => {
    setSelectedProduct(productKey);
    // Adjust suggested coverage and premium defaults per product
    switch (productKey) {
      case 'auto':
        setCoverageAmount(100000);
        setProposedPremium(1200);
        break;
      case 'property':
      case 'home':
        setCoverageAmount(350000);
        setProposedPremium(1850);
        break;
      case 'life':
        setCoverageAmount(500000);
        setProposedPremium(900);
        break;
      case 'health':
        setCoverageAmount(250000);
        setProposedPremium(3600);
        break;
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedCustomer) {
      setSubmitError('Please select a customer for this application.');
      return;
    }
    if (coverageAmount <= 0) {
      setSubmitError('Coverage amount must be greater than $0.');
      return;
    }
    if (proposedPremium <= 0) {
      setSubmitError('Proposed premium must be greater than $0.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    let specificData = {};
    if (selectedProduct === 'auto') {
      specificData = { ...vehicleDetails };
    } else if (selectedProduct === 'property' || selectedProduct === 'home') {
      specificData = { ...propertyDetails };
    } else {
      specificData = { ...healthLifeDetails };
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        customer_id: selectedCustomer.id,
        product_type: selectedProduct,
        coverage_amount: coverageAmount,
        proposed_premium: proposedPremium,
        effective_date: effectiveDate,
        applicant_data: {
          ...specificData,
          customer_phone: selectedCustomer.phone,
          customer_address: selectedCustomer.address,
          intake_notes: `Agent assisted intake via InsureIQ workspace for ${tenantContext.name}`
        }
      };

      const res = await fetch('/api/agents/me/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Application submission failed (HTTP ${res.status})`);
      }

      const created: SubmittedApplication = await res.json();
      setSubmittedApp(created);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unexpected error occurred during submission.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAppDocuments = useCallback(async (appId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/me/applications/${appId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedDocs(data.documents || []);
      }
    } catch (err) {
      // silent
    }
  }, []);

  useEffect(() => {
    if (submittedApp) {
      fetchAppDocuments(submittedApp.id);
    }
  }, [submittedApp, fetchAppDocuments]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedApp) return;
    if (!selectedFile) {
      setUploadDocError('Please select a file to upload (.pdf, .jpg, .jpeg, .png).');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadDocError('File size exceeds the 10MB limit.');
      return;
    }

    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileName = selectedFile.name.toLowerCase();
    if (!allowed.some((ext) => fileName.endsWith(ext))) {
      setUploadDocError('Invalid format. Only .pdf, .jpg, .jpeg, and .png files are accepted.');
      return;
    }

    setUploadingDoc(true);
    setUploadDocError(null);
    setUploadDocSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/me/applications/${submittedApp.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doc_type: selectedDocType,
          file_name: selectedFile.name,
          file_size_bytes: selectedFile.size,
          description: docDescription.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Document upload failed (HTTP ${res.status})`);
      }

      const newDoc: ApplicationDocItem = await res.json();
      setUploadedDocs((prev) => [...prev, newDoc]);
      setSelectedFile(null);
      setDocDescription('');
      setUploadDocSuccess(true);
      setTimeout(() => setUploadDocSuccess(false), 3500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadDocError(err.message);
      } else {
        setUploadDocError('Failed to upload document.');
      }
    } finally {
      setUploadingDoc(false);
    }
  };

  const products = [
    {
      id: 'auto',
      title: 'Auto Insurance',
      icon: Car,
      color: '#38bdf8',
      desc: 'Personal vehicle liability, comprehensive damage, and collision coverage.'
    },
    {
      id: 'property',
      title: 'Property & Home',
      icon: Home,
      color: '#fb923c',
      desc: 'Residential dwelling, hazard protection, personal property, and liability.'
    },
    {
      id: 'life',
      title: 'Term Life',
      icon: Activity,
      color: '#a855f7',
      desc: 'Guaranteed level death benefit with flexible policy term horizons.'
    },
    {
      id: 'health',
      title: 'Health & Medical',
      icon: HeartPulse,
      color: '#ec4899',
      desc: 'Comprehensive hospital, surgical, prescription and critical illness coverage.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '32px 40px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* Back Link */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => {
              if (selectedCustomer) {
                navigate(`/agent/customers/${selectedCustomer.id}`);
              } else {
                navigate('/agent/customers');
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: 0
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <ArrowLeft size={14} />
            <span>{selectedCustomer ? `Back to ${selectedCustomer.full_name || 'Customer'}` : 'Back to Customers'}</span>
          </button>
        </div>

        {/* Header Hero */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px', color: '#f8fafc' }}>
            Assisted Policy Application Intake
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Submit a compliant policy application on behalf of a policyholder directly into the {tenantContext.name} underwriting queue.
          </p>
        </div>

        {/* Success Confirmation Screen */}
        {submittedApp ? (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 16,
              padding: '48px 36px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#34d399'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
              Application Successfully Submitted!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 540, margin: '0 auto 24px' }}>
              Your application has been registered in the system and automatically routed to the Underwriting Review Queue with status <strong style={{ color: '#fb923c' }}>pending_review</strong>.
            </p>

            {/* Application Reference Bento */}
            <div
              style={{
                maxWidth: 480,
                margin: '0 auto 32px',
                background: '#090e1a',
                border: '1px solid #1e293b',
                borderRadius: 12,
                padding: '20px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Application Ref:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  {submittedApp.application_number}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Applicant Name:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  {submittedApp.applicant_name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Product Line:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', textTransform: 'capitalize' }}>
                  {submittedApp.product_type}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Coverage Limit:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  ${submittedApp.coverage_amount.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Initial Risk Tier:</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(2, 132, 199, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    textTransform: 'capitalize'
                  }}
                >
                  {submittedApp.risk_tier} (Score: {submittedApp.risk_score})
                </span>
              </div>
            </div>

            {/* Sub-Slice A6.2: Supporting Document Upload Panel */}
            <div
              style={{
                maxWidth: 680,
                margin: '0 auto 32px',
                background: '#090e1a',
                border: '1px solid #1e293b',
                borderRadius: 12,
                padding: '24px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <UploadCloud size={20} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
                  Attach Supporting Documents & KYC (Sub-Slice A6.2)
                </h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 16px' }}>
                Upload customer verification documents (Driver's License, Property Deed, Vehicle Title, Inspection Report, Income Proof) to expedite Underwriter review. Max file size: 10MB (.pdf, .jpg, .jpeg, .png).
              </p>

              <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
                      Document Type *
                    </label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: 6,
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="drivers_license">Driver's License / State ID</option>
                      <option value="property_deed">Property Deed / Title</option>
                      <option value="inspection_report">Inspection / Appraisal Report</option>
                      <option value="medical_records">Medical Questionnaire / Records</option>
                      <option value="id_proof">Passport / Government ID</option>
                      <option value="income_proof">Proof of Income / Tax Return</option>
                      <option value="vehicle_title">Vehicle Title / Registration</option>
                      <option value="other">Other Supporting Evidence</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
                      Select File (.pdf, .jpg, .png) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                          setUploadDocError(null);
                        }
                      }}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: 6,
                        padding: '6px 10px',
                        color: '#94a3b8',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>
                    Optional Description / Notes for Underwriter
                  </label>
                  <input
                    type="text"
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="e.g., Validated state driver's license, no prior violations"
                    maxLength={200}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: 6,
                      padding: '8px 12px',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {uploadDocError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      fontSize: '0.82rem'
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{uploadDocError}</span>
                  </div>
                )}

                {uploadDocSuccess && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#34d399',
                      fontSize: '0.82rem'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Document attached successfully to application dossier!</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={uploadingDoc || !selectedFile}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 16px',
                      background: selectedFile && !uploadingDoc ? '#0284c7' : '#1e293b',
                      color: selectedFile && !uploadingDoc ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: selectedFile && !uploadingDoc ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {uploadingDoc ? (
                      <>
                        <RefreshCw size={13} className="spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Paperclip size={13} />
                        <span>Upload & Attach Document</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Uploaded Documents List */}
              <div style={{ marginTop: 20, borderTop: '1px solid #1e293b', paddingTop: 16 }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 10px' }}>
                  Attached Documents ({uploadedDocs.length})
                </h4>

                {uploadedDocs.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.82rem', fontStyle: 'italic', margin: 0 }}>
                    No documents attached yet. Documents attached will be immediately accessible by the tenant Underwriting staff.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {uploadedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: 8,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileText size={18} style={{ color: '#38bdf8' }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                                {doc.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  color: '#38bdf8',
                                  border: '1px solid rgba(56, 189, 248, 0.25)',
                                  textTransform: 'capitalize'
                                }}
                              >
                                {doc.doc_type.replace('_', ' ')}
                              </span>
                            </div>
                            {doc.description && (
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                                {doc.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {(doc.size_bytes / 1024).toFixed(1)} KB
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#34d399',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Uploaded
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setSubmittedApp(null);
                  setCurrentStep(1);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: '#1e293b',
                  color: '#cbd5e1',
                  border: '1px solid #334155',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Submit Another Application
              </button>

              <button
                onClick={() => {
                  if (selectedCustomer) {
                    navigate(`/agent/customers/${selectedCustomer.id}`);
                  } else {
                    navigate('/agent/customers');
                  }
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View Customer Dossier
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Step Navigation Progress Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 12,
                padding: '14px 24px',
                marginBottom: 24
              }}
            >
              {[
                { step: 1, label: '1. Select Product' },
                { step: 2, label: '2. Policy & Risk Details' },
                { step: 3, label: '3. Review & Submit' }
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                return (
                  <div
                    key={s.step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: isActive ? '#38bdf8' : isPassed ? '#34d399' : '#64748b',
                      fontWeight: isActive || isPassed ? 600 : 400,
                      fontSize: '0.85rem'
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: isActive ? '#0284c7' : isPassed ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                        border: `1px solid ${isActive ? '#38bdf8' : isPassed ? '#10b981' : '#334155'}`,
                        color: isActive || isPassed ? '#ffffff' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {isPassed ? '✓' : s.step}
                    </div>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Selected Customer Banner */}
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 12,
                padding: '18px 24px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}
                >
                  <User size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Applicant / Customer Lead
                  </span>
                  {selectedCustomer ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                        {selectedCustomer.full_name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        ({selectedCustomer.email})
                      </span>
                      {selectedCustomer.churn_risk_flag && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          Lapse Risk
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: 4 }}>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = customers.find((c) => c.id === parseInt(val, 10));
                          setSelectedCustomer(found || null);
                        }}
                        style={{
                          background: '#090e1a',
                          border: '1px solid #334155',
                          borderRadius: 6,
                          padding: '6px 12px',
                          color: '#f8fafc',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      >
                        <option value="">{loadingCustomer ? 'Loading customers...' : 'Select a customer from your portfolio...'}</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {selectedCustomer && !preselectedCustomerId && (
                <button
                  onClick={() => setSelectedCustomer(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Change Customer
                </button>
              )}
            </div>

            {customerError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 18px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: 20
                }}
              >
                <AlertCircle size={18} />
                <span>{customerError}</span>
              </div>
            )}

            {/* STEP 1: Product Line Selection */}
            {currentStep === 1 && (
              <div>
                <div style={{ marginBottom: 18 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px' }}>
                    Step 1: Choose Insurance Product Line
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                    Select the insurance line to initiate risk analysis and required coverage schedules.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginBottom: 32
                  }}
                >
                  {products.map((p) => {
                    const isSelected = selectedProduct === p.id;
                    const IconComponent = p.icon;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleProductSelect(p.id)}
                        style={{
                          background: isSelected ? 'rgba(2, 132, 199, 0.15)' : '#0f172a',
                          border: `2px solid ${isSelected ? '#0284c7' : '#1e293b'}`,
                          borderRadius: 12,
                          padding: '24px 20px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: isSelected ? 'rgba(2, 132, 199, 0.25)' : '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: p.color
                          }}
                        >
                          <IconComponent size={22} />
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>
                            {p.title}
                          </h4>
                          <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>
                            {p.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    disabled={!selectedCustomer}
                    onClick={() => setCurrentStep(2)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 24px',
                      borderRadius: 8,
                      background: selectedCustomer ? '#0284c7' : '#1e293b',
                      color: selectedCustomer ? '#ffffff' : '#64748b',
                      border: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: selectedCustomer ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <span>Proceed to Policy Parameters</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Policy & Risk Details */}
            {currentStep === 2 && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px' }}>
                    Step 2: Enter Policy Limits & Risk Details
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                    Configure the requested coverage limit, proposed annual premium, and product-specific attributes.
                  </p>
                </div>

                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 12,
                    padding: '24px',
                    marginBottom: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: 6 }}>
                        Policy Effective Date *
                      </label>
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#090e1a',
                          border: '1px solid #1e293b',
                          borderRadius: 8,
                          padding: '10px 14px',
                          color: '#f8fafc',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: 6 }}>
                        Coverage Limit ($) *
                      </label>
                      <input
                        type="number"
                        min={1000}
                        step={5000}
                        value={coverageAmount}
                        onChange={(e) => setCoverageAmount(parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          background: '#090e1a',
                          border: '1px solid #1e293b',
                          borderRadius: 8,
                          padding: '10px 14px',
                          color: '#f8fafc',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: 6 }}>
                        Proposed Annual Premium ($) *
                      </label>
                      <input
                        type="number"
                        min={100}
                        step={50}
                        value={proposedPremium}
                        onChange={(e) => setProposedPremium(parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          background: '#090e1a',
                          border: '1px solid #1e293b',
                          borderRadius: 8,
                          padding: '10px 14px',
                          color: '#f8fafc',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Product Specific Risk Inputs */}
                  {selectedProduct === 'auto' && (
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: 16 }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Car size={16} /> Vehicle & Driving Profile
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Vehicle Year</label>
                          <input
                            type="text"
                            value={vehicleDetails.year}
                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, year: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Make / Manufacturer</label>
                          <input
                            type="text"
                            value={vehicleDetails.make}
                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, make: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Model</label>
                          <input
                            type="text"
                            value={vehicleDetails.model}
                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, model: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Est. Annual Mileage</label>
                          <input
                            type="text"
                            value={vehicleDetails.annualMileage}
                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, annualMileage: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedProduct === 'property' || selectedProduct === 'home') && (
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: 16 }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#fb923c', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Home size={16} /> Property Characteristics
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dwelling Structure</label>
                          <input
                            type="text"
                            value={propertyDetails.propertyType}
                            onChange={(e) => setPropertyDetails({ ...propertyDetails, propertyType: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Square Footage</label>
                          <input
                            type="text"
                            value={propertyDetails.squareFeet}
                            onChange={(e) => setPropertyDetails({ ...propertyDetails, squareFeet: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Year Built</label>
                          <input
                            type="text"
                            value={propertyDetails.yearBuilt}
                            onChange={(e) => setPropertyDetails({ ...propertyDetails, yearBuilt: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedProduct === 'life' || selectedProduct === 'health') && (
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: 16 }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#a855f7', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <HeartPulse size={16} /> Underwriting Risk Questionnaire
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tobacco / Nicotine Use</label>
                          <select
                            value={healthLifeDetails.tobaccoUse}
                            onChange={(e) => setHealthLifeDetails({ ...healthLifeDetails, tobaccoUse: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          >
                            <option value="no">Non-Smoker (None in 3+ years)</option>
                            <option value="yes">Current Smoker / Nicotine</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Occupation Hazard Class</label>
                          <input
                            type="text"
                            value={healthLifeDetails.occupation}
                            onChange={(e) => setHealthLifeDetails({ ...healthLifeDetails, occupation: e.target.value })}
                            style={{
                              width: '100%',
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '8px 12px',
                              color: '#f8fafc',
                              boxSizing: 'border-box',
                              marginTop: 4
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setCurrentStep(1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 18px',
                      borderRadius: 8,
                      background: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Products</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep(3)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 24px',
                      borderRadius: 8,
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>Review Application</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Submit */}
            {currentStep === 3 && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px' }}>
                    Step 3: Review Dossier & Dispatch to Underwriting
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                    Please verify the details below before submitting the application to the tenant underwriting queue.
                  </p>
                </div>

                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 12,
                    padding: '24px',
                    marginBottom: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <div style={{ background: '#090e1a', padding: 16, borderRadius: 8, border: '1px solid #1e293b' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Customer</span>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginTop: 4 }}>
                        {selectedCustomer?.full_name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
                        {selectedCustomer?.email} · {selectedCustomer?.phone || 'No phone'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                        {selectedCustomer?.address || 'No physical address on file'}
                      </div>
                    </div>

                    <div style={{ background: '#090e1a', padding: 16, borderRadius: 8, border: '1px solid #1e293b' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Product & Coverage</span>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#38bdf8', marginTop: 4, textTransform: 'capitalize' }}>
                        {selectedProduct} Insurance
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: 4 }}>
                        Limit: <strong>${coverageAmount.toLocaleString()}</strong> · Premium: <strong>${proposedPremium.toLocaleString()}/yr</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>
                        Effective Date: {effectiveDate}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.25)',
                      borderRadius: 8,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12
                    }}
                  >
                    <Info size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      Upon submission, this application will receive an automated baseline risk evaluation and transition immediately to <strong style={{ color: '#fb923c' }}>pending_review</strong> in the {tenantContext.name} Underwriting queue.
                      An immutable audit record will be logged with your Agent ID #{currentUser.id}.
                    </div>
                  </div>

                  {submitError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 16px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: '0.85rem'
                      }}
                    >
                      <AlertCircle size={18} />
                      <span>{submitError}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={submitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 18px',
                      borderRadius: 8,
                      background: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Parameters</span>
                  </button>

                  <button
                    onClick={handleSubmitApplication}
                    disabled={submitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 28px',
                      borderRadius: 8,
                      background: submitting ? '#0369a1' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Submitting to Underwriting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Confirm & Dispatch Application</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
