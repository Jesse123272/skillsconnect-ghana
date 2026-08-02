'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// DashboardLayout provided by app/dashboard/layout.js; per-page wrapper removed
import ProfileAvatar from '@/components/ProfileAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import { validateEmail, validatePassword, validatePhone } from '@/lib/validators';

export default function CustomerSettings() {
  const {  user, setUser, loading: authLoading, logout , authFetch } = useAuth();
  const router = useRouter();

  // Dynamic Geographic data states
  const [regionsList, setRegionsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  // Active Tab State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'account'

  // Form Profile State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  // Form Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // File Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // UI States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deactivatingAccount, setDeactivatingAccount] = useState(false);
  
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [accountError, setAccountError] = useState(null);

  // Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Load Ghana geographical regions on mount
  useEffect(() => {
    async function loadRegions() {
      try {
        const response = await authFetch('/api/regions');
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setRegionsList(result.data);
          }
        }
      } catch (err) {
        console.error('Error fetching Ghana regions:', err);
      }
    }
    loadRegions();
  }, [authFetch]);

  // Pre-fill profile fields once user context is loaded
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setFullName(user.full_name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setRegion(user.region || '');
        setDistrict(user.district || '');
        setProfilePhoto(user.profile_photo || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Keep district dropdown in sync when selected region changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (region && regionsList.length > 0) {
        const selectedRegObj = regionsList.find((r) => r.region === region);
        if (selectedRegObj) {
          setDistrictsList(selectedRegObj.districts || []);
        } else {
          setDistrictsList([]);
        }
      } else {
        setDistrictsList([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [region, regionsList]);

  // Password strength calculation
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

  // Profile Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validations
    if (!file.type.startsWith('image/')) {
      setProfileError('Invalid file format. Please upload an image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('File size must not exceed the 5MB limit.');
      return;
    }

    try {
      setUploadingPhoto(true);
      setProfileError(null);
      setProfileSuccess(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile');

      const response = await authFetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const uploadedPath = result.data.file_path;
        setProfilePhoto(uploadedPath);
        setProfileSuccess('Profile photo uploaded and saved successfully!');

        // Update user context state
        setUser((prev) => ({
          ...prev,
          profile_photo: uploadedPath
        }));
      } else {
        setProfileError(result.error || 'Failed to upload photo.');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setProfileError('An unexpected error occurred during photo upload.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle Profile Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !region || !district) {
      setProfileError('All primary profile fields are required.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setProfileError('Please provide a valid email address.');
      return;
    }

    if (!validatePhone(phone.trim())) {
      setProfileError('Phone number must be in the format +233XXXXXXXXX (e.g., +233240000000).');
      return;
    }

    try {
      setSavingProfile(true);

      const response = await authFetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          region: region,
          district: district,
          profile_photo: profilePhoto.trim() || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProfileSuccess('Your profile settings have been updated successfully!');
        
        // Update global user details inside context instantly
        setUser((prev) => ({
          ...prev,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          region: region,
          district: district,
          profile_photo: profilePhoto.trim() || null,
        }));
      } else {
        setProfileError(result.error || 'Failed to update profile settings.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setProfileError('An unexpected server communication error occurred.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      setPasswordError(passwordCheck.message);
      return;
    }

    try {
      setSavingPassword(true);

      const response = await authFetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPasswordSuccess('Your account password has been updated successfully!');
        // Clear inputs
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(result.error || 'Failed to update account password.');
      }
    } catch (err) {
      console.error('Error saving password:', err);
      setPasswordError('An unexpected network error occurred.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Account Deletion
  const handleAccountDelete = async () => {
    try {
      setDeactivatingAccount(true);
      setAccountError(null);

      const response = await authFetch('/api/profile/update', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsDeleteModalOpen(false);
        // Call auth context logout to clean client states, then redirect to login
        await logout();
        router.push('/login');
      } else {
        setAccountError(result.error || 'Failed to deactivate account.');
      }
    } catch (err) {
      console.error('Error deactivating account:', err);
      setAccountError('An unexpected server communication error occurred.');
    } finally {
      setDeactivatingAccount(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  if (!user) {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Redirecting to login..." />
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid px-0" id="account-settings-container">
        
        {/* Header Block */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Account & Security Settings</h4>
          <p className="text-muted mb-0 fs-7">
            Manage your personal profile, secure credentials, and active account status.
          </p>
        </div>

        {/* Dynamic Bootstrap Nav Tabs */}
        <div className="card border rounded-3 mb-4 bg-white shadow-xs">
          <div className="card-header bg-light border-bottom p-0">
            <ul className="nav nav-tabs border-0 px-3 pt-2" id="settings-tabs-list" role="tablist">
              <li className="nav-item">
                <button 
                  className={`nav-link fw-bold border-0 bg-transparent px-4 py-2.5 fs-7 ${activeTab === 'profile' ? 'active border-bottom border-primary text-primary border-3 fw-semibold' : 'text-secondary'}`} 
                  onClick={() => setActiveTab('profile')}
                  id="tab-btn-profile"
                >
                  <i className="fa-solid fa-user-circle me-1.5"></i> Profile Information
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link fw-bold border-0 bg-transparent px-4 py-2.5 fs-7 ${activeTab === 'password' ? 'active border-bottom border-primary text-primary border-3 fw-semibold' : 'text-secondary'}`} 
                  onClick={() => setActiveTab('password')}
                  id="tab-btn-password"
                >
                  <i className="fa-solid fa-lock me-1.5"></i> Change Password
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link fw-bold border-0 bg-transparent px-4 py-2.5 fs-7 ${activeTab === 'account' ? 'active border-bottom border-primary text-primary border-3 fw-semibold' : 'text-secondary'}`} 
                  onClick={() => setActiveTab('account')}
                  id="tab-btn-account"
                >
                  <i className="fa-solid fa-circle-info me-1.5"></i> Account Details
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body p-4">
            
            {/* TAB 1: PROFILE INFORMATION */}
            {activeTab === 'profile' && (
              <div id="settings-tab-profile">
                <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center gap-2">
                  <i className="fa-solid fa-id-card text-primary"></i>
                  <span>Personal Details & Location</span>
                </h5>

                {profileError && <AlertMessage type="danger" message={profileError} onClose={() => setProfileError(null)} />}
                {profileSuccess && <AlertMessage type="success" message={profileSuccess} onClose={() => setProfileSuccess(null)} />}

                {/* Avatar & Upload Section */}
                <div className="d-flex flex-column flex-sm-row align-items-center gap-4 mb-4 bg-light p-3.5 rounded-3 border" id="profile-avatar-upload-box">
                  <ProfileAvatar name={fullName} photo_url={profilePhoto} size="xl" />
                  <div className="text-center text-sm-start flex-grow-1">
                    <h6 className="fw-bold text-dark mb-1">Your Profile Photo</h6>
                    <p className="text-muted fs-8 mb-3">Upload a portrait JPG, PNG or WEBP. Max 5MB file limit.</p>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      accept="image/*" 
                      className="d-none" 
                      id="photo-file-upload-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm btn-primary px-3 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
                      disabled={uploadingPhoto}
                      style={{ cursor: 'pointer' }}
                    >
                      {uploadingPhoto ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-camera"></i>
                          <span>Change Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} id="profile-settings-form">
                  
                  {/* FULL NAME */}
                  <div className="mb-3">
                    <label htmlFor="settings-fullname" className="form-label fw-semibold text-dark fs-7">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="settings-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="form-control py-2 shadow-none fs-7"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  {/* EMAIL ADDRESS (Disabled as it acts as unique key) */}
                  <div className="mb-3">
                    <label htmlFor="settings-email" className="form-label fw-semibold text-muted fs-7">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      id="settings-email"
                      value={email}
                      className="form-control py-2 bg-light text-muted shadow-none fs-7"
                      placeholder="name@domain.com"
                      disabled
                    />
                  </div>

                  {/* PHONE NUMBER */}
                  <div className="mb-3">
                    <label htmlFor="settings-phone" className="form-label fw-semibold text-dark fs-7">
                      Phone Number (+233 format)
                    </label>
                    <input
                      type="tel"
                      id="settings-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-control py-2 shadow-none fs-7"
                      placeholder="+233240000000"
                      required
                    />
                    <div className="form-text fs-8 text-muted">Format: +233XXXXXXXXX (e.g., +233245678901)</div>
                  </div>

                  {/* GEOGRAPHY ROW */}
                  <div className="row g-3 mb-4">
                    {/* REGION SELECT */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="settings-region" className="form-label fw-semibold text-dark fs-7">
                        Region
                      </label>
                      <select
                        id="settings-region"
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value);
                          setDistrict(''); // Reset district
                        }}
                        className="form-select py-2 shadow-none fs-7"
                        required
                      >
                        <option value="">Select Region</option>
                        {regionsList.map((r) => (
                          <option key={r.region} value={r.region}>
                            {r.region}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DISTRICT SELECT */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="settings-district" className="form-label fw-semibold text-dark fs-7">
                        District / City
                      </label>
                      <select
                        id="settings-district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="form-select py-2 shadow-none fs-7"
                        disabled={!region}
                        required
                      >
                        <option value="">Select District</option>
                        {districtsList.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary px-5 py-2.5 rounded-pill fw-bold"
                    disabled={savingProfile}
                    style={{ cursor: savingProfile ? 'not-allowed' : 'pointer' }}
                  >
                    {savingProfile ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>
                        <span>Saving profile...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>

                </form>
              </div>
            )}

            {/* TAB 2: CHANGE PASSWORD */}
            {activeTab === 'password' && (
              <div id="settings-tab-password">
                <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center gap-2">
                  <i className="fa-solid fa-key text-danger"></i>
                  <span>Update Account Password</span>
                </h5>

                {passwordError && <AlertMessage type="danger" message={passwordError} onClose={() => setPasswordError(null)} />}
                {passwordSuccess && <AlertMessage type="success" message={passwordSuccess} onClose={() => setPasswordSuccess(null)} />}

                <form onSubmit={handlePasswordSubmit} id="change-password-form">
                  
                  {/* CURRENT PASSWORD */}
                  <div className="mb-3 position-relative">
                    <label htmlFor="settings-currentpassword" className="form-label fw-semibold text-dark fs-7">
                      Current Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="settings-currentpassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="form-control py-2 shadow-none fs-7"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="btn btn-outline-secondary px-3"
                      >
                        <i className={showCurrentPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                      </button>
                    </div>
                  </div>

                  {/* NEW PASSWORD */}
                  <div className="mb-3">
                    <label htmlFor="settings-newpassword" className="form-label fw-semibold text-dark fs-7">
                      New Password
                    </label>
                    <div className="input-group mb-1">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="settings-newpassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="form-control py-2 shadow-none fs-7"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="btn btn-outline-secondary px-3"
                      >
                        <i className={showNewPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
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
                    <div className="form-text fs-8 text-muted">Use a strong password with at least 8 characters, including uppercase letters, lowercase letters, numbers, and symbols.</div>
                  </div>

                  {/* CONFIRM NEW PASSWORD */}
                  <div className="mb-4">
                    <label htmlFor="settings-confirmpassword" className="form-label fw-semibold text-dark fs-7">
                      Confirm New Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="settings-confirmpassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="form-control py-2 shadow-none fs-7"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="btn btn-outline-secondary px-3"
                      >
                        <i className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary px-5 py-2.5 rounded-pill fw-bold"
                    disabled={savingPassword}
                    style={{ cursor: savingPassword ? 'not-allowed' : 'pointer' }}
                  >
                    {savingPassword ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>

                </form>
              </div>
            )}

            {/* TAB 3: ACCOUNT */}
            {activeTab === 'account' && (
              <div id="settings-tab-account">
                <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-warning"></i>
                  <span>Account Status & Metadata</span>
                </h5>

                {accountError && <AlertMessage type="danger" message={accountError} onClose={() => setAccountError(null)} />}

                <div className="row g-4 mb-4" id="account-info-box">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <span className="text-muted fs-8 text-uppercase tracking-wider d-block fw-semibold" style={{ fontSize: '10px' }}>Account Status</span>
                      <span className="badge bg-success-subtle text-success fs-7 px-3 py-1.5 mt-1 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold">
                        <span className="spinner-grow spinner-grow-sm text-success" role="status" aria-hidden="true" style={{ width: '8px', height: '8px' }}></span>
                        <span>Active Verified Client</span>
                      </span>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <span className="text-muted fs-8 text-uppercase tracking-wider d-block fw-semibold" style={{ fontSize: '10px' }}>Created Since</span>
                      <strong className="text-dark fs-6 mt-1 d-block">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                      </strong>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3 border">
                      <span className="text-muted fs-8 text-uppercase tracking-wider d-block fw-semibold" style={{ fontSize: '10px' }}>Last Logged In</span>
                      <strong className="text-dark fs-7 mt-1 d-block">
                        {user.last_login ? new Date(user.last_login).toLocaleString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'This session'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Account Deletion Alert Box */}
                <div className="p-4 border border-dashed border-danger rounded-3 bg-danger bg-opacity-10 mb-2" id="danger-zone-alert">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="bg-danger text-white p-2.5 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                      <i className="fa-solid fa-circle-exclamation fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-danger mb-1">Danger Zone: Permanent Account Deletion</h6>
                      <p className="text-secondary fs-7 mb-3">
                        Once you delete your SkillsConnect Ghana customer account, your profile metadata, saved bookmarks, and historical reviews will be deactivated. You will not be able to retrieve your communication records or login to the system again.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="btn btn-sm btn-danger px-4 py-2.5 rounded-pill fw-bold"
                        style={{ cursor: 'pointer' }}
                      >
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        {isDeleteModalOpen && (
          <>
            <div 
              className="modal fade show d-block" 
              tabIndex="-1" 
              role="dialog" 
              style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}
              id="confirm-delete-modal"
            >
              <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content border-0 rounded-3 shadow">
                  <div className="modal-header bg-danger text-white p-3 border-0">
                    <h5 className="modal-title fw-bold d-flex align-items-center gap-2 fs-6">
                      <i className="fa-solid fa-circle-exclamation"></i>
                      <span>Confirm Account Deletion</span>
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white shadow-none" 
                      onClick={() => setIsDeleteModalOpen(false)}
                      aria-label="Close"
                      style={{ cursor: 'pointer' }}
                    ></button>
                  </div>
                  <div className="modal-body p-4">
                    <p className="text-dark fs-6 mb-2">
                      Are you absolutely sure you want to delete your SkillsConnect account?
                    </p>
                    <p className="text-secondary fs-7 mb-0">
                      This action will deactivate your profile instantly and log you out. This is irreversible.
                    </p>
                  </div>
                  <div className="modal-footer bg-light p-3 border-top d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-secondary px-4 py-2 rounded-pill fw-semibold" 
                      onClick={() => setIsDeleteModalOpen(false)}
                      disabled={deactivatingAccount}
                      style={{ cursor: 'pointer' }}
                    >
                      No, Keep Account
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-danger px-4 py-2 rounded-pill fw-bold"
                      onClick={handleAccountDelete}
                      disabled={deactivatingAccount}
                      style={{ cursor: deactivatingAccount ? 'not-allowed' : 'pointer' }}
                    >
                      {deactivatingAccount ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>
                          <span>Deactivating...</span>
                        </>
                      ) : (
                        <span>Yes, Delete Permanently</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          </>
        )}

      </div>
    </>
  );
}
