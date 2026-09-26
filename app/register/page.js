'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { validatePassword, generateStrongPassword } from '@/lib/validators';
import { filterCategoriesBySearch, getCategorySubmissionPayload } from '@/lib/category-utils';

const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Eastern',
  'Western',
  'Central',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Savannah',
  'North East',
  'Oti',
  'Western North'
];

export default function Register() {
  const router = useRouter();

  // Active role tab: 'customer' or 'artisan'
  const [role, setRole] = useState('customer');

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationError, setLocationError] = useState('');
  const [locationRequested, setLocationRequested] = useState(false);

  // Artisan-Only Fields State
  const [categoryId, setCategoryId] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  // UI interaction states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) {
      return { label: 'No password yet', color: 'text-secondary', progressClass: 'bg-secondary', percent: 0, score };
    }
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { label: 'Weak', color: 'text-danger', progressClass: 'bg-danger', percent: 20 * score, score };
    }
    if (score <= 4) {
      return { label: 'Strong', color: 'text-warning', progressClass: 'bg-warning', percent: 20 * score, score };
    }
    return { label: 'Very strong', color: 'text-success', progressClass: 'bg-success', percent: 100, score };
  };

  const handleRecommendPassword = () => {
    const newPass = generateStrongPassword();
    setPassword(newPass);
    setConfirmPassword(newPass);
  };

  // Fetch active categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success) {
          setCategories(json.data || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadCategories();
  }, []);

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    // Help user format standard Ghanaian numbers (024..., 050...) into +233...
    if (value.startsWith('0') && value.length === 10) {
      value = '+233' + value.substring(1);
    }
    setPhone(value);
  };

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported in your browser.');
      return;
    }

    setLocationRequested(true);
    setLocationError('');
    setLocationStatus('Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoords([position.coords.latitude, position.coords.longitude]);
        setLocationStatus('Location detected. It will be saved with your account.');
        setLocationError('');
      },
      (err) => {
        console.error('Location request failed:', err);
        setLocationCoords(null);
        setLocationError('Unable to detect location. Please allow location access or continue with manual address entry.');
        setLocationStatus('Location access was denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredCategories = filterCategoriesBySearch(categories, categorySearch);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // 1. Basic client-side validation
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword || !region || !district.trim()) {
      toast.error('Please fill in all common fields.');
      return;
    }

    if (!/^[\p{L}]+(?:[ \t]+[\p{L}]+)*$/u.test(fullName.trim())) {
      toast.error('Full name must contain letters only, with spaces allowed between names.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.message);
      return;
    }

    // Phone format validation
    const phoneRegex = /^\+233\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Phone number must be +233 followed by exactly 9 digits (e.g. +233501234567)');
      return;
    }

    // Artisan fields validation
    if (role === 'artisan') {
      const selectedCategory = showCustomCategory ? customCategory.trim() : categoryId;
      if (!selectedCategory) {
        toast.error('Please select your trade specialty.');
        return;
      }
      if (!yearsExperience || parseInt(yearsExperience, 10) < 0) {
        toast.error('Please provide valid years of experience.');
        return;
      }
      if (!bio.trim() || bio.trim().length > 300) {
        toast.error('Please provide a bio description (max 300 characters).');
        return;
      }
    }

    if (!termsAccepted) {
      toast.error('You must agree to the Terms and Conditions.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirm_password: confirmPassword,
        role,
        region,
        district: district.trim(),
        ...(role === 'artisan' && {
          ...getCategorySubmissionPayload(categoryId, customCategory, showCustomCategory),
          years_experience: yearsExperience,
          bio: bio.trim()
        }),
        ...(locationCoords && {
          latitude: locationCoords[0],
          longitude: locationCoords[1]
        })
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Account created — check your email for the 6-digit verification code.');
        const verificationRedirect = result.data.role === 'artisan'
          ? '/dashboard/artisan'
          : '/dashboard/customer';
        router.push(
          `/verify-email?email=${encodeURIComponent(result.data.email)}&redirect=${encodeURIComponent(verificationRedirect)}`
        );
      } else {
        const errorMsg = result.error || 'Registration failed. Please check inputs.';
        setApiError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Registration dispatch error:', err);
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" id="register-root-wrapper">
      <Navbar />

      <main className="flex-grow-1 bg-light d-flex align-items-center justify-content-center py-5">
        <div className="container d-flex justify-content-center">
          <div className="card border rounded-4 shadow-lg p-4 bg-white w-100" style={{ maxWidth: '520px' }} id="register-form-card">
            
            {/* TOP TITLE */}
            <div className="text-center mb-4">
              <h1 className="h3 fw-bold text-dark mb-1">Create an Account on SkillsConnect</h1>
              <p className="text-muted small">Connect with trusted local artisans across Ghana — fast and secure.</p>
            </div>

            {/* ROLE TAB SELECTOR */}
            <div className="btn-group w-100 mb-4" role="group" aria-label="Role selector tabs">
              <button
                type="button"
                className={`btn py-2.5 fw-semibold border-bottom border-2 ${role === 'customer' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                onClick={() => { setRole('customer'); setApiError(''); }}
                style={{ borderBottomLeftRadius: '8px', borderTopLeftRadius: '8px' }}
              >
                I am a Customer
              </button>
              <button
                type="button"
                className={`btn py-2.5 fw-semibold border-bottom border-2 ${role === 'artisan' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                onClick={() => { setRole('artisan'); setApiError(''); }}
                style={{ borderBottomRightRadius: '8px', borderTopRightRadius: '8px' }}
              >
                I am a Service Provider
              </button>
            </div>

            {/* Error Message banner */}
            {apiError && (
              <div className="alert alert-danger fs-7 py-2.5 px-3 mb-3 text-start" role="alert">
                <i className="fa-solid fa-circle-exclamation me-1.5"></i>
                {apiError}
              </div>
            )}

            {/* REGISTRATION FORM */}
            <form onSubmit={handleRegisterSubmit} className="text-start">
              
              {/* COMMON FIELDS */}
              <div className="mb-3">
                <label htmlFor="register-full-name" className="form-label text-secondary small fw-medium">Full Name</label>
                <input
                  id="register-full-name"
                  type="text"
                  className="form-control text-secondary small"
                  placeholder="e.g. Kojo Mensah"
                  pattern="[A-Za-zÀ-ÖØ-öø-ÿ]+([ \\t]+[A-Za-zÀ-ÖØ-öø-ÿ]+)*"
                  title="Use letters only, with spaces between names."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="register-email" className="form-label text-secondary small fw-medium">Email Address</label>
                <input
                  id="register-email"
                  type="email"
                  className="form-control text-secondary small"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="register-phone" className="form-label text-secondary small fw-medium">Phone Number</label>
                <input
                  id="register-phone"
                  type="tel"
                  className="form-control text-secondary small"
                  placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                />
                <div className="form-text fs-8 text-muted">
                  We will help format common Ghana numbers (e.g. 024/050) into the +233 standard.
                </div>
              </div>

              {/* REGION AND DISTRICT */}
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label htmlFor="register-region" className="form-label text-secondary small fw-medium">Region</label>
                  <select
                    id="register-region"
                    className="form-select text-secondary small"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                  >
                    <option value="">Select Region</option>
                    {REGIONS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-6">
                  <label htmlFor="register-district" className="form-label text-secondary small fw-medium">District / Town</label>
                  <input
                    id="register-district"
                    type="text"
                    className="form-control text-secondary small"
                    placeholder="e.g. Dansoman, Accra"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span id="register-location-label" className="form-label text-secondary small fw-medium mb-0">Your current location</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={requestLocation}
                    disabled={locationRequested}
                    aria-describedby="register-location-label"
                  >
                    Use My Location
                  </button>
                </div>
                {locationStatus && <div className="text-muted fs-8 mb-1">{locationStatus}</div>}
                {locationError && <div className="text-danger fs-8 mb-1">{locationError}</div>}
                {locationCoords && (
                  <div className="text-success fs-8">
                    Detected coordinates: {locationCoords[0].toFixed(4)}, {locationCoords[1].toFixed(4)}
                  </div>
                )}
              </div>

              {/* PASSWORD FIELDS */}
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label htmlFor="register-password" className="form-label text-secondary small fw-medium">Password</label>
                  <div className="input-group">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-control text-secondary small border-end-0"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="btn border border-start-0 text-muted"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} fs-7`} aria-hidden="true"></i>
                    </button>
                  </div>
                  <div className="form-text fs-8 mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill px-3 py-2 fw-semibold"
                      onClick={handleRecommendPassword}
                    >
                      Recommend Password
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className={`fw-semibold ${getPasswordStrength(password).color}`}>
                        {getPasswordStrength(password).label}
                      </small>
                      <small className="text-muted">{getPasswordStrength(password).percent}%</small>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar ${getPasswordStrength(password).progressClass}`}
                        role="progressbar"
                        style={{ width: `${getPasswordStrength(password).percent}%` }}
                        aria-valuenow={getPasswordStrength(password).percent}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <div className="form-text fs-8 text-muted mt-2">
                    {password
                      ? 'Make sure your password includes uppercase, lowercase, numbers, and a symbol to make it very strong.'
                      : 'Type a password or click the recommended password to generate a secure one.'}
                  </div>
                </div>
                <div className="col-sm-6">
                  <label htmlFor="register-confirm-password" className="form-label text-secondary small fw-medium">Confirm Password</label>
                  <div className="input-group">
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control text-secondary small border-end-0"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      className="btn border border-start-0 text-muted"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      aria-pressed={showConfirmPassword}
                    >
                      <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} fs-7`} aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* ARTISAN-ONLY FIELDS */}
              {role === 'artisan' && (
                <div className="border rounded-3 p-3 bg-light mb-3" id="artisan-fields-container">
                  <h2 className="h6 fw-bold text-dark fs-7 mb-3">Service Provider details</h2>

                  <div className="mb-3">
                    <label htmlFor="register-category-search" className="form-label text-secondary small fw-medium">Search trade specialties</label>
                    <input
                      id="register-category-search"
                      type="text"
                      className="form-control text-secondary small"
                      placeholder="Search specialties"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                    />
                    <label htmlFor="register-category" className="form-label text-secondary small fw-medium mt-2">Trade Specialty</label>
                    <select
                      id="register-category"
                      className="form-select text-secondary small mt-2"
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setShowCustomCategory(false);
                      }}
                      required={!showCustomCategory}
                    >
                      <option value="">Select your specialty</option>
                      {filteredCategories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                    <div className="form-text fs-8 text-muted mt-2">
                      Search for a trade and choose it. If yours is missing, use the custom option below.
                    </div>
                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="custom-specialty"
                        checked={showCustomCategory}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setShowCustomCategory(checked);
                          if (!checked) {
                            setCustomCategory('');
                          }
                        }}
                      />
                      <label className="form-check-label text-secondary small" htmlFor="custom-specialty">
                        My specialty is not listed
                      </label>
                    </div>
                    {showCustomCategory && (
                      <>
                      <label htmlFor="register-custom-category" className="form-label text-secondary small fw-medium mt-2">Custom specialty</label>
                      <input
                        id="register-custom-category"
                        type="text"
                        className="form-control text-secondary small mt-2"
                        placeholder="Enter your specialty"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        required
                      />
                      </>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="register-years-experience" className="form-label text-secondary small fw-medium">Years of Experience</label>
                    <input
                      id="register-years-experience"
                      type="number"
                      className="form-control text-secondary small"
                      placeholder="e.g. 5"
                      min="0"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <label htmlFor="register-bio" className="form-label text-secondary small fw-medium">Short Biography</label>
                      <span className="text-muted fs-8 mt-0.5">{bio.length}/300 chars</span>
                    </div>
                    <textarea
                      id="register-bio"
                      className="form-control text-secondary small"
                      rows="3"
                      maxLength={300}
                      placeholder="Brief description of your domestic craft, client service values, and specialties..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-1">
                    <label htmlFor="register-profile-photo" className="form-label text-secondary small fw-medium">Profile Photo</label>
                    <input
                      id="register-profile-photo"
                      type="file"
                      className="form-control text-secondary small"
                      accept="image/*"
                      onChange={(e) => setProfilePhoto(e.target.files[0])}
                    />
                    <div className="form-text fs-8 text-muted">
                      Images only. You can also update this later inside your profile.
                    </div>
                  </div>
                </div>
              )}

              {/* TERMS CHECKBOX */}
              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="agreeTerms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                />
                <label className="form-check-label text-secondary small" htmlFor="agreeTerms">
                  I accept the <Link href="/terms" className="text-primary fw-semibold text-decoration-none">Terms and Conditions</Link> for SkillsConnect Ghana.
                </label>
              </div>

              <div className="alert alert-info rounded-4 border-0 mb-4" role="alert">
                <h2 className="h6 fw-semibold mb-2">Need help during signup?</h2>
                <p className="mb-1 small text-secondary">
                  If you have an issue with registration, payment, or account verification, send feedback directly to the admin support team.
                </p>
                <p className="mb-0 small">
                  Email: <a href="mailto:skillsconnectgh@zohomail.com" className="text-primary">skillsconnectgh@zohomail.com</a> or <Link href="/contact" className="text-primary">submit feedback here</Link>.
                </p>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="btn btn-primary w-100 rounded-pill py-2.5 fs-6 fw-semibold mb-3 shadow"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="text-center mt-2">
                <span className="text-muted small">Already have an account? </span>
                <Link href="/login" className="text-primary fw-semibold small text-decoration-none">
                  Login
                </Link>
              </div>

            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
