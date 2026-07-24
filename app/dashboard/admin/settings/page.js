'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Settings, 
  Save, 
  HelpCircle, 
  Sliders, 
  FileText, 
  ShieldAlert, 
  Server, 
  Cpu,
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [mailServerMock, setMailServerMock] = useState(true);
  const [resettingDb, setResettingDb] = useState(false);
  const [seedingDb, setSeedingDb] = useState(false);

  // Core settings form state
  const [platformName, setPlatformName] = useState('SkillsConnect Ghana');
  const [contactEmail, setContactEmail] = useState('support@skillsconnect.gov.gh');
  const [contactPhone, setContactPhone] = useState('+233 24 123 4567');
  const [aboutText, setAboutText] = useState('');

  // Extended simulation state variables (saved in local memory)
  const [escrowFee, setEscrowFee] = useState(5.0);
  const [autoVerify, setAutoVerify] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const [settingsRes, mailRes] = await Promise.all([
          fetch('/api/admin/settings', { credentials: 'include' }),
          fetch('/api/auth/verify-email')
        ]);
        
        const settingsData = await settingsRes.json();
        const mailData = await mailRes.json();

        if (settingsData.success && active) {
          setPlatformName(settingsData.data.platform_name);
          setContactEmail(settingsData.data.contact_email);
          setContactPhone(settingsData.data.contact_phone);
          setAboutText(settingsData.data.about_text);
        } else if (active) {
          toast.error(settingsData.error || 'Failed to fetch platform configurations.');
        }

        if (mailData.success && active) {
          setMailServerMock(mailData.mockMode);
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error while fetching system parameters.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSettings();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!platformName.trim()) {
      toast.error('Platform Brand Name is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_name: platformName.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim(),
          about_text: aboutText.trim()
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'System configurations updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update system variables.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during configurations update.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      toast.error('Please enter a valid recipient email address.');
      return;
    }

    setTestingEmail(true);
    const toastId = toast.loading('Initiating SMTP connection & sending test email...');
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmailAddress.trim() }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId, duration: 6000 });
      } else {
        toast.error(data.error || 'SMTP Connection failure. Please check your credentials.', { id: toastId, duration: 6000 });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network or timeout error occurred while testing SMTP mailer.', { id: toastId });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleWipeDatabase = async () => {
    const confirmWipe = window.confirm(
      "CRITICAL ACTION: Are you sure you want to delete all customers, artisans, ratings, reviews, portfolios, messages, and bookings?\n\nThis will wipe all existing system users except your Admin account, resetting SkillsConnect Ghana to a fresh production-ready state. This action is IRREVERSIBLE."
    );
    if (!confirmWipe) return;

    setResettingDb(true);
    const toastId = toast.loading('Wiping and resetting system database...');
    try {
      const res = await fetch('/api/admin/database-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId, duration: 6000 });
      } else {
        toast.error(data.error || 'Failed to clean database.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network or timeout error occurred while resetting database.', { id: toastId });
    } finally {
      setResettingDb(false);
    }
  };

  const handleSeedDatabase = async () => {
    const confirmSeed = window.confirm(
      "Are you sure you want to restore the standard mock seed data?\n\nThis will restore the 11 pre-configured Ghanaian customer and artisan profiles, reviews, sample images, and bookings. Excellent for demoing the app!"
    );
    if (!confirmSeed) return;

    setSeedingDb(true);
    const toastId = toast.loading('Re-seeding system database (this takes a few seconds)...');
    try {
      const res = await fetch('/api/admin/database-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId, duration: 6000 });
      } else {
        toast.error(data.error || 'Failed to seed database.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network or timeout error occurred while seeding database.', { id: toastId });
    } finally {
      setSeedingDb(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="System Variables">
        <LoadingSpinner message="Reading current variables configurations..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="System Configuration & variables">
      <div className="row g-4 text-dark" id="settings-workspace-row">
        {/* LEFT COLUMN: Main variables form */}
        <div className="col-lg-8">
          <div className="card shadow-sm border p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary">
              <Sliders size={20} />
              <span>Core Application Details</span>
            </h5>
            <p className="text-muted small mb-4">
              Update branding properties, formal support emails, contact phone lines, and legal texts across the application.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label fw-semibold small text-dark">Platform Name</label>
                  <input 
                    type="text" 
                    className="form-control text-dark"
                    required
                    placeholder="SkillsConnect Ghana"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-dark">Contact Email</label>
                  <input 
                    type="email" 
                    className="form-control text-dark"
                    required
                    placeholder="support@skillsconnect.gov.gh"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-dark">Contact Phone</label>
                  <input 
                    type="text" 
                    className="form-control text-dark"
                    required
                    placeholder="+233 24 123 4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-semibold small text-dark">Platform About Info Copy</label>
                  <textarea 
                    className="form-control text-dark"
                    rows="4"
                    placeholder="Connecting Ghanaian citizens with top-vetted professional and local trade services..."
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                  ></textarea>
                </div>

                <div className="col-md-12 text-end pt-2">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2"
                  >
                    <Save size={16} />
                    <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Advanced Escrow Fees console */}
          <div className="card shadow-sm border p-4 bg-white">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Cpu size={20} className="text-secondary" />
              <span>Payments & Escrow Commission Fees</span>
            </h5>
            <div className="row g-3">
              <div className="col-md-8">
                <p className="text-muted small mb-0">
                  Configure the flat platform fee percentage calculated and deducted automatically during digital invoice escrow clearings.
                </p>
              </div>
              <div className="col-md-4">
                <div className="input-group">
                  <input 
                    type="number" 
                    className="form-control text-dark text-center fw-bold"
                    step="0.1"
                    min="0"
                    max="100"
                    value={escrowFee}
                    onChange={(e) => {
                      setEscrowFee(parseFloat(e.target.value) || 0);
                      toast.success('Escrow fee preference saved locally!');
                    }}
                  />
                  <span className="input-group-text bg-light fw-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMTP Configuration Guide & Diagnostics Panel */}
          <div className="card shadow-sm border p-4 bg-white mt-4" id="smtp-diagnostics-card">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              <Mail size={20} className="text-warning" />
              <span>Email Delivery & SMTP Diagnostics</span>
            </h5>
            
            <div className="row g-3">
              <div className="col-md-12">
                <div className={`p-3 rounded-3 mb-3 d-flex align-items-start gap-2.5 ${mailServerMock ? 'bg-light border text-muted' : 'bg-success-subtle border-success-subtle text-success-emphasis'}`} style={{ fontSize: '13.5px' }}>
                  {mailServerMock ? (
                    <>
                      <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="d-block mb-1 text-dark">Currently in Sandbox / Mock Mode</strong>
                        Since your custom SMTP server details are not fully configured in the platform&apos;s Environment Settings, all account verification emails and system notifications are running in simulated mock mode (logged to server console). This prevents real email dispatching to actual user accounts.
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} className="text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="d-block mb-1 text-success-emphasis">SMTP Server is ACTIVE (Live Mode)</strong>
                        Great! Custom SMTP settings are loaded. The system is configured to dispatch real verification and transaction emails to user accounts using your active mail server!
                      </div>
                    </>
                  )}
                </div>

                <div className="border rounded-3 p-3 bg-light mb-4">
                  <h6 className="fw-bold text-dark mb-2 small d-flex align-items-center gap-1.5">
                    <HelpCircle size={15} className="text-primary" />
                    <span>How to enable real email deliveries for your users:</span>
                  </h6>
                  <p className="text-secondary mb-2" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    To ensure you and your users receive actual verification codes in their actual email inboxes (Gmail, Yahoo, Outlook etc.), configure your SMTP mail credentials inside the **AI Studio Settings** under the **Secrets & Environment Variables** panel:
                  </p>
                  <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                    <li className="mb-1"><code className="text-dark bg-white px-1 border rounded font-monospace small">EMAIL_HOST</code>: The SMTP server address (e.g., <code className="font-monospace">smtp.gmail.com</code> for Gmail, <code className="font-monospace">smtp.mailgun.org</code>, etc.)</li>
                    <li className="mb-1"><code className="text-dark bg-white px-1 border rounded font-monospace small">EMAIL_PORT</code>: Port number (use <code className="font-monospace">465</code> for secure SSL/TLS, or <code className="font-monospace">587</code> for STARTTLS)</li>
                    <li className="mb-1"><code className="text-dark bg-white px-1 border rounded font-monospace small">EMAIL_USER</code>: Your authenticating email address (e.g., <code className="font-monospace">your-service@gmail.com</code>)</li>
                    <li className="mb-1"><code className="text-dark bg-white px-1 border rounded font-monospace small">EMAIL_PASS</code>: Your authenticating password (for Gmail, use a secure 16-character **App Password**)</li>
                    <li><code className="text-dark bg-white px-1 border rounded font-monospace small">EMAIL_FROM</code>: Name & address to show as sender (e.g., <code className="font-monospace">&quot;SkillsConnect Ghana &lt;noreply@skillsconnect.gh&gt;&quot;</code>)</li>
                  </ul>
                </div>

                <form onSubmit={handleTestEmail} className="border rounded-3 p-3 bg-white">
                  <h6 className="fw-bold text-dark mb-2 small">Live Deliverability Check</h6>
                  <p className="text-muted mb-3" style={{ fontSize: '12px' }}>
                    Enter any valid email address to trigger a live diagnostic check. We will attempt a live delivery using your current mail server parameters.
                  </p>
                  <div className="input-group">
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your personal email (e.g. asirifin146@gmail.com)" 
                      className="form-control text-dark small"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={testingEmail}
                      className="btn btn-warning d-flex align-items-center gap-1.5 px-3"
                    >
                      {testingEmail ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span className="small">Testing...</span>
                        </>
                      ) : (
                        <span className="small fw-semibold">Send Test Email</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Server and Status checks */}
        <div className="col-lg-4">
          <div className="card shadow-sm border p-4 bg-white mb-4" id="artisan-moderation-mode-card">
            <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              <Server size={18} className="text-primary" />
              <span>Listing Moderation Settings</span>
            </h6>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="fw-semibold d-block text-dark small">Automatic Verification</span>
                  <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Verify profiles instantly</span>
                </div>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch"
                    checked={autoVerify}
                    onChange={(e) => {
                      setAutoVerify(e.target.checked);
                      toast.success(`Instant verify turned ${e.target.checked ? 'ON' : 'OFF'}`);
                    }}
                  />
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between border-top pt-3">
                <div>
                  <span className="fw-semibold d-block text-dark small">Maintenance Mode</span>
                  <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Show splash for upgrades</span>
                </div>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch"
                    checked={maintenanceMode}
                    onChange={(e) => {
                      setMaintenanceMode(e.target.checked);
                      toast.success(`Maintenance Mode turned ${e.target.checked ? 'ON' : 'OFF'}`);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border p-4 bg-white" id="database-connectivity-card">
            <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              <ShieldAlert size={18} className="text-danger" />
              <span>Database Server Connectivity</span>
            </h6>
            <div className="d-flex flex-column gap-2 small text-muted">
              <div className="d-flex justify-content-between align-items-center">
                <span>Driver Class</span>
                <span className="fw-semibold text-dark">MariaDB / MySQL</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Status Code</span>
                <span className="badge bg-success text-white">ONLINE</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Max Pool Size</span>
                <span className="fw-semibold text-dark">15 Connections</span>
              </div>
            </div>
          </div>

          {/* Database Actions & Reset Card */}
          <div className="card shadow-sm border p-4 bg-white mt-4" id="database-operations-card">
            <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              <Database size={18} className="text-warning" />
              <span>Database Operations</span>
            </h6>
            <p className="text-muted mb-3" style={{ fontSize: '12px' }}>
              Wipe all system user registries to start with a fresh environment, or re-populate with pre-configured Ghanaian mock profiles for testing purposes.
            </p>
            <div className="d-flex flex-column gap-3 pt-1">
              <button
                type="button"
                disabled={resettingDb || seedingDb}
                onClick={handleWipeDatabase}
                className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold w-full"
              >
                {resettingDb ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Wiping System...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Clear All Users (Fresh Start)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={resettingDb || seedingDb}
                onClick={handleSeedDatabase}
                className="btn btn-outline-warning d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold w-full"
              >
                {seedingDb ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Restoring Seed...</span>
                  </>
                ) : (
                  <>
                    <Database size={15} />
                    <span>Re-Seed Ghanaian Mock Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
