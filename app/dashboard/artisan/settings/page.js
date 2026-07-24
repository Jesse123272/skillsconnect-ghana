'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import { validatePassword } from '@/lib/validators';

export default function ArtisanSettings() {
  const { user, setUser, loading: authLoading } = useAuth();

  // Active Tab State
  const [activeTab, setActiveTab] = useState('account'); // 'account', 'password', 'notifications'

  // PASSWORD FORM STATES
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // NOTIFICATION PREFERENCES STATE
  const [prefs, setPrefs] = useState({
    email_on_enquiry: true,
    email_on_review: true,
    email_on_approval: true,
    in_app_notifications: true
  });

  // UI TRANSACTION STATES
  const [savingSettings, setSavingSettings] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Load existing preferences if available in user object
  useEffect(() => {
    if (user && user.preferences) {
      const timer = setTimeout(() => {
        try {
          const parsed = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
          setPrefs({
            email_on_enquiry: parsed.email_on_enquiry !== undefined ? parsed.email_on_enquiry : true,
            email_on_review: parsed.email_on_review !== undefined ? parsed.email_on_review : true,
            email_on_approval: parsed.email_on_approval !== undefined ? parsed.email_on_approval : true,
            in_app_notifications: parsed.in_app_notifications !== undefined ? parsed.in_app_notifications : true
          });
        } catch (err) {
          console.error('Error parsing notification preferences from user payload:', err);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // PASSWORD STRENGTH CALCULATION
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: 'Empty', score: 0, color: 'bg-secondary', textClass: 'text-muted' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) {
      return { label: 'Weak ⚠️', score, color: 'bg-danger', textClass: 'text-danger' };
    } else if (score <= 3) {
      return { label: 'Medium 👍', score, color: 'bg-warning text-dark', textClass: 'text-warning' };
    } else {
      return { label: 'Strong 💪', score, color: 'bg-success', textClass: 'text-success' };
    }
  };

  const pwdStrength = getPasswordStrength(newPassword);

  // PASSWORD CHANGE ACTION
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setFormError('The new password and confirmation password do not match.');
      return;
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      setFormError(passwordCheck.message);
      return;
    }

    try {
      setSavingSettings(true);

      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_new_password: confirmNewPassword
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormSuccess('Your account password has been updated successfully!');
        // Clear forms
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setFormError(result.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Password change submission error:', err);
      setFormError('A network interruption occurred. Please retry.');
    } finally {
      setSavingSettings(false);
    }
  };

  // NOTIFICATION PREFERENCES CHANGE ACTION
  const handlePrefToggle = (key) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      setSavingSettings(true);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prefs)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormSuccess('Notification preferences updated and saved securely!');
        
        // Update user context state instantly
        setUser((prev) => ({
          ...prev,
          preferences: JSON.stringify(prefs)
        }));
      } else {
        setFormError(result.error || 'Failed to update preferences.');
      }
    } catch (err) {
      console.error('Preferences submission error:', err);
      setFormError('Could not establish connection to save your settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can access account settings." />
      </div>
    );
  }

  return (
    <DashboardLayout role="artisan" pageTitle="Account Settings">
      <div className="container-fluid px-0" id="artisan-settings-view">
        
        {/* Title and Intro */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Account & Security Settings</h4>
          <p className="text-muted mb-0 fs-7">
            Configure your artisan platform configurations, security details, and communication preferences.
          </p>
        </div>

        {formError && <AlertMessage type="danger" message={formError} onClose={() => setFormError(null)} />}
        {formSuccess && <AlertMessage type="success" message={formSuccess} onClose={() => setFormSuccess(null)} />}

        {/* Dynamic Bootstrap Nav Tabs */}
        <div className="card border rounded-3 mb-4 bg-white shadow-xs">
          <div className="card-header bg-light border-bottom p-0">
            <ul className="nav nav-tabs border-0 px-3 pt-2" id="settings-tabs-list" role="tablist">
              <li className="nav-item">
                <button 
                  className={`nav-link fw-bold border-0 bg-transparent px-4 py-2.5 fs-7 ${activeTab === 'account' ? 'active border-bottom border-primary text-primary border-3 fw-semibold' : 'text-secondary'}`} 
                  onClick={() => {
                    setActiveTab('account');
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  id="tab-btn-account"
                >
                  <i className="fa-solid fa-user-gear me-1.5"></i> Account Settings
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link fw-bold border-0 bg-transparent px-4 py-2.5 fs-7 ${activeTab === 'password' ? 'active border-bottom border-primary text-primary border-3 fw-semibold' : 'text-secondary'}`} 
                  onClick={() => {
                    setActiveTab('password');
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  id="tab-btn-password"
                >
                  <i className="fa-solid fa-key me-1.5"></i> Change Password
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link fw-bold border-0 bg-transparent px-4 py-2.5 fs-7 ${activeTab === 'notifications' ? 'active border-bottom border-primary text-primary border-3 fw-semibold' : 'text-secondary'}`} 
                  onClick={() => {
                    setActiveTab('notifications');
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  id="tab-btn-notifications"
                >
                  <i className="fa-solid fa-bell me-1.5"></i> Notification Preferences
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body p-4">
            
            {/* TAB 1: ACCOUNT SETTINGS */}
            {activeTab === 'account' && (
              <div id="settings-tab-account" className="row g-4">
                <div className="col-12 col-md-8">
                  <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                    <i className="fa-solid fa-address-card text-primary"></i>
                    <span>Primary Account Overview</span>
                  </h5>
                  <p className="text-muted fs-8 mb-4">View core registered parameters. To protect trade profile integrity, email addresses are locked.</p>

                  <div className="d-flex flex-column gap-3.5" id="account-settings-list">
                    {/* Locked Email Block */}
                    <div className="p-3.5 bg-light rounded-3 border">
                      <div className="row align-items-center">
                        <div className="col-12 col-sm-8 mb-2 mb-sm-0">
                          <label className="text-muted fs-8 d-block mb-1 font-semibold uppercase tracking-wider">Registered Email Address</label>
                          <strong className="text-dark fs-7.5">{user.email}</strong>
                          <span className="text-muted fs-8 d-block mt-1">
                            <i className="fa-solid fa-circle-info me-1 text-primary-emphasis"></i>
                            Contact administration support to change your account email.
                          </span>
                        </div>
                        <div className="col-12 col-sm-4 text-sm-end">
                          <span className="badge bg-secondary text-white rounded-pill px-3 py-1.5 fs-8">Read-Only</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Status Badge */}
                    <div className="p-3.5 bg-light rounded-3 border">
                      <div className="row align-items-center">
                        <div className="col-12 col-sm-8 mb-2 mb-sm-0">
                          <label className="text-muted fs-8 d-block mb-1 font-semibold uppercase tracking-wider">Account Active Status</label>
                          <span className="text-dark fs-7.5 fw-bold">Your trade profile is operational and listing visible.</span>
                        </div>
                        <div className="col-12 col-sm-4 text-sm-end">
                          {user.is_active === 1 ? (
                            <span className="badge bg-success text-white rounded-pill px-3 py-1.5 fs-8 d-inline-flex align-items-center gap-1.5">
                              <span className="spinner-grow spinner-grow-sm text-white" role="status" aria-hidden="true" style={{ width: '8px', height: '8px' }}></span>
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="badge bg-danger text-white rounded-pill px-3 py-1.5 fs-8">Deactivated</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata block */}
                    <div className="row g-3">
                      <div className="col-12 col-sm-6">
                        <div className="p-3 bg-light rounded-3 border h-100">
                          <span className="text-muted fs-8 d-block mb-1 font-semibold uppercase tracking-wider">Account Created Date</span>
                          <strong className="text-dark fs-7.5">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                          </strong>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="p-3 bg-light rounded-3 border h-100">
                          <span className="text-muted fs-8 d-block mb-1 font-semibold uppercase tracking-wider">Last System Login</span>
                          <strong className="text-dark fs-7.5">
                            {user.last_login ? new Date(user.last_login).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : 'This session'}
                          </strong>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right support card */}
                <div className="col-12 col-md-4">
                  <div className="p-4 bg-warning bg-opacity-10 border border-warning border-dashed rounded-3 h-100">
                    <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center gap-2">
                      <i className="fa-solid fa-headset text-warning"></i>
                      <span>Need Assistance?</span>
                    </h6>
                    <p className="text-secondary fs-7.5 mb-3" style={{ lineHeight: '1.5' }}>
                      To protect our platform and prevent identity fraud, core artisan identification and category fields must be validated by administration reviews.
                    </p>
                    <p className="text-secondary fs-7.5 mb-0" style={{ lineHeight: '1.5' }}>
                      To update operational districts, business names, or profile details, please complete the fields inside the <strong>Edit Profile</strong> page or contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CHANGE PASSWORD */}
            {activeTab === 'password' && (
              <div id="settings-tab-password" style={{ maxWidth: '650px' }}>
                <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center gap-2">
                  <i className="fa-solid fa-key text-danger"></i>
                  <span>Change Password</span>
                </h5>

                <form onSubmit={handlePasswordSubmit}>
                  {/* Current Password */}
                  <div className="mb-3">
                    <label htmlFor="old-password" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                      Current Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        id="old-password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="form-control py-2 shadow-none fs-7.5"
                        placeholder="Enter your current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="btn btn-outline-secondary px-3"
                      >
                        <i className={showOldPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="mb-3">
                    <label htmlFor="new-password" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                      New Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="form-control py-2 shadow-none fs-7.5"
                        placeholder="Enter a secure new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="btn btn-outline-secondary px-3"
                      >
                        <i className={showNewPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {newPassword && (
                      <div className="mt-2 bg-light p-2.5 rounded-3 border">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fs-8 text-secondary">Password Strength:</span>
                          <span className={`fs-8 fw-bold ${pwdStrength.textClass}`}>{pwdStrength.label}</span>
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div 
                            className={`progress-bar ${pwdStrength.color}`} 
                            role="progressbar" 
                            style={{ width: `${(pwdStrength.score / 5) * 100}%` }} 
                            aria-valuenow={pwdStrength.score} 
                            aria-valuemin="0" 
                            aria-valuemax="5"
                          ></div>
                        </div>
                      </div>
                    )}
                    <div className="form-text fs-8 text-muted mt-1.5">
                      Strong passwords should be at least 8 characters long and include uppercase letters, lowercase letters, digits, and symbols.
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="mb-4">
                    <label htmlFor="confirm-new-password" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        id="confirm-new-password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="form-control py-2 shadow-none fs-7.5"
                        placeholder="Retype your new password to verify"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="btn btn-outline-secondary px-3"
                      >
                        <i className={showConfirmNewPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                      </button>
                    </div>
                  </div>

                  {/* Submit password button */}
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="btn btn-primary px-4 py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    style={{ cursor: savingSettings ? 'not-allowed' : 'pointer' }}
                  >
                    {savingSettings ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Saving Password...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-shield-halved"></i>
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: NOTIFICATION PREFERENCES */}
            {activeTab === 'notifications' && (
              <div id="settings-tab-notifications" style={{ maxWidth: '650px' }}>
                <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center gap-2">
                  <i className="fa-solid fa-bell text-success"></i>
                  <span>Notification Preferences</span>
                </h5>
                <p className="text-muted fs-8 mb-4">Choose how you want to be alerted when client activities take place on SkillsConnect Ghana.</p>

                <form onSubmit={handlePreferencesSubmit}>
                  <div className="d-flex flex-column gap-3.5 mb-4" id="notifications-prefs-toggles">
                    
                    {/* Toggle: Email on new enquiry */}
                    <div className="p-3.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-dark fs-7.5 d-block mb-0.5">Email on New Enquiry</strong>
                        <span className="text-secondary fs-8.5">Receive a direct email alert when customers submit a work or quote enquiry.</span>
                      </div>
                      <div className="form-check form-switch ps-0 mb-0">
                        <input
                          className="form-check-input ms-0 shadow-none"
                          type="checkbox"
                          role="switch"
                          id="pref-email-enquiry"
                          checked={prefs.email_on_enquiry}
                          onChange={() => handlePrefToggle('email_on_enquiry')}
                          style={{ width: '2.5em', height: '1.25em', cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    {/* Toggle: Email on new review */}
                    <div className="p-3.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-dark fs-7.5 d-block mb-0.5">Email on New Review</strong>
                        <span className="text-secondary fs-8.5">Receive a notification email when customers write feedback evaluations about your work.</span>
                      </div>
                      <div className="form-check form-switch ps-0 mb-0">
                        <input
                          className="form-check-input ms-0 shadow-none"
                          type="checkbox"
                          role="switch"
                          id="pref-email-review"
                          checked={prefs.email_on_review}
                          onChange={() => handlePrefToggle('email_on_review')}
                          style={{ width: '2.5em', height: '1.25em', cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    {/* Toggle: Email on profile approval */}
                    <div className="p-3.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-dark fs-7.5 d-block mb-0.5">Email on Profile Approval</strong>
                        <span className="text-secondary fs-8.5">Receive a notification when administrators complete review evaluations of your artisan profile.</span>
                      </div>
                      <div className="form-check form-switch ps-0 mb-0">
                        <input
                          className="form-check-input ms-0 shadow-none"
                          type="checkbox"
                          role="switch"
                          id="pref-email-approval"
                          checked={prefs.email_on_approval}
                          onChange={() => handlePrefToggle('email_on_approval')}
                          style={{ width: '2.5em', height: '1.25em', cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    {/* Toggle: In-app notifications */}
                    <div className="p-3.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-dark fs-7.5 d-block mb-0.5">In-App Notifications</strong>
                        <span className="text-secondary fs-8.5">Display live badges and alert indicators inside the dashboard nav header rails.</span>
                      </div>
                      <div className="form-check form-switch ps-0 mb-0">
                        <input
                          className="form-check-input ms-0 shadow-none"
                          type="checkbox"
                          role="switch"
                          id="pref-in-app"
                          checked={prefs.in_app_notifications}
                          onChange={() => handlePrefToggle('in_app_notifications')}
                          style={{ width: '2.5em', height: '1.25em', cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="btn btn-primary px-4 py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    style={{ cursor: savingSettings ? 'not-allowed' : 'pointer' }}
                  >
                    {savingSettings ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Saving Preferences...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
