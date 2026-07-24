'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProfileAvatar from '@/components/ProfileAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';

export default function ArtisanProfileEdit() {
  const { user, setUser, loading: authLoading } = useAuth();

  // Geographical lists
  const [regionsList, setRegionsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  // SECTION 1 - PERSONAL INFO
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');

  // SECTION 2 - PROFESSIONAL INFO
  const [categoryId, setCategoryId] = useState('');
  const [yearsExperience, setYearsExperience] = useState('0');
  const [bio, setBio] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');

  // SECTION 3 - PROFILE PHOTO
  const [profilePhoto, setProfilePhoto] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // UI STATES
  const [loadingData, setLoadingData] = useState(true);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // 1. Fetch Categories, Regions, and Me simultaneously on mount
  useEffect(() => {
    async function loadFormData() {
      try {
        setLoadingData(true);
        const [categoriesRes, regionsRes, meRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/regions'),
          fetch('/api/auth/me')
        ]);

        if (categoriesRes.ok) {
          const catResult = await categoriesRes.json();
          if (catResult.success && Array.isArray(catResult.data)) {
            setCategoriesList(catResult.data);
          }
        }

        if (regionsRes.ok) {
          const regResult = await regionsRes.json();
          if (regResult.success && Array.isArray(regResult.data)) {
            setRegionsList(regResult.data);
          }
        }

        if (meRes.ok) {
          const meResult = await meRes.json();
          if (meResult.success && meResult.data) {
            const fetchedUser = meResult.data;
            // Pre-populate fields
            setFullName(fetchedUser.full_name || '');
            setPhone(fetchedUser.phone || '');
            setRegion(fetchedUser.region || '');
            setDistrict(fetchedUser.district || '');
            setProfilePhoto(fetchedUser.profile_photo || '');

            const artisanProfile = fetchedUser.artisan_profile || {};
            setCategoryId(artisanProfile.category_id || '');
            setYearsExperience(artisanProfile.years_experience !== undefined ? String(artisanProfile.years_experience) : '0');
            setBio(artisanProfile.bio || '');
            setServiceAreas(artisanProfile.service_areas || '');
          }
        }
      } catch (err) {
        console.error('Error fetching profile edit options:', err);
        setFormError('Failed to load professional categories or geographic configurations.');
      } finally {
        setLoadingData(false);
      }
    }

    if (!authLoading && user) {
      loadFormData();
    }
  }, [user, authLoading]);

  // 2. Sync Districts selection list when Region changes
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

  // Handle Photo input file select
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('The selected profile photo file exceeds the 5MB size limit.');
      return;
    }

    // Validate image format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Only JPG, PNG, GIF, or WEBP image formats are permitted.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Perform separate profile photo upload
  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    try {
      setUploadingPhoto(true);
      setFormError(null);
      setFormSuccess(null);

      const formData = new FormData();
      formData.append('file', photoFile);
      formData.append('type', 'profile');

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success && result.data?.file_path) {
        const uploadedPath = result.data.file_path;
        setProfilePhoto(uploadedPath);
        setPhotoFile(null); // Clear pending file state
        setPhotoPreview('');
        setFormSuccess('Profile photo uploaded and processed successfully!');
        
        // Update local context
        setUser((prev) => ({
          ...prev,
          profile_photo: uploadedPath,
        }));
      } else {
        setFormError(result.error || 'Could not complete the profile image upload.');
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setFormError('A connection error occurred during image upload.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save All Changes Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validation
    if (!fullName.trim() || !phone.trim() || !region || !district || !categoryId || !bio.trim()) {
      setFormError('All fields in Sections 1 & 2 are required.');
      return;
    }

    const phoneRegex = /^\+233\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setFormError('Phone number must be in the format +233XXXXXXXXX (e.g., +233240000000).');
      return;
    }

    if (bio.trim().length > 300) {
      setFormError('Your professional bio exceeds the 300 character limit.');
      return;
    }

    try {
      setSubmittingForm(true);

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: user.email, // Kept read-only from auth context
          phone: phone.trim(),
          region: region,
          district: district,
          profile_photo: profilePhoto || null,
          category_id: parseInt(categoryId, 10),
          years_experience: parseInt(yearsExperience, 10) || 0,
          bio: bio.trim(),
          service_areas: serviceAreas.trim() || district,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormSuccess('Professional profile and credentials updated successfully!');
        
        // Sync context state
        setUser((prev) => ({
          ...prev,
          full_name: fullName.trim(),
          phone: phone.trim(),
          region: region,
          district: district,
          profile_photo: profilePhoto,
          artisan_profile: {
            ...prev?.artisan_profile,
            category_id: parseInt(categoryId, 10),
            years_experience: parseInt(yearsExperience, 10) || 0,
            bio: bio.trim(),
            service_areas: serviceAreas.trim(),
          }
        }));

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError(result.error || 'Failed to update professional profile details.');
      }
    } catch (err) {
      console.error('Error submitting profile form:', err);
      setFormError('An unexpected networking exception occurred while saving profile changes.');
    } finally {
      setSubmittingForm(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying authentication..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can access profile management." />
      </div>
    );
  }

  return (
    <DashboardLayout role="artisan" pageTitle="Manage Profile">
      <div className="container-fluid px-0" id="artisan-profile-edit-view">
        
        {/* Header Title */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Professional Profile Editor</h4>
          <p className="text-muted mb-0 fs-7">
            Manage your personal profile, geographical service zones, trade categories, and profile biography.
          </p>
        </div>

        {formError && <AlertMessage type="danger" message={formError} onClose={() => setFormError(null)} />}
        {formSuccess && <AlertMessage type="success" message={formSuccess} onClose={() => setFormSuccess(null)} />}

        {loadingData ? (
          <LoadingSpinner message="Retrieving profile configurations..." />
        ) : (
          <div className="row g-4">
            
            {/* LEFT PROFILE EDIT COLUMN */}
            <div className="col-12 col-lg-8">
              <form onSubmit={handleFormSubmit} id="artisan-profile-edit-form">
                
                {/* SECTION 1 - PERSONAL INFO */}
                <div className="card border rounded-3 p-4 bg-white shadow-xs mb-4">
                  <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white rounded-circle fs-8 p-1.5" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                    <span>Personal Contact Information</span>
                  </h5>

                  {/* FULL NAME */}
                  <div className="mb-3">
                    <label htmlFor="profile-fullname" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="profile-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="form-control py-2 shadow-none"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  {/* PHONE CONTACT */}
                  <div className="mb-3">
                    <label htmlFor="profile-phone" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                      Phone Number (+233 format)
                    </label>
                    <input
                      type="tel"
                      id="profile-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-control py-2 shadow-none"
                      placeholder="+233240000000"
                      required
                    />
                    <div className="form-text fs-8 text-muted">Provide your primary call/WhatsApp contact. Format: +233XXXXXXXXX</div>
                  </div>

                  {/* GEOGRAPHY ROUTE */}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="profile-region" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                        Region of Operation
                      </label>
                      <select
                        id="profile-region"
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value);
                          setDistrict('');
                        }}
                        className="form-select py-2 shadow-none"
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

                    <div className="col-12 col-md-6">
                      <label htmlFor="profile-district" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                        District / City
                      </label>
                      <select
                        id="profile-district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="form-select py-2 shadow-none"
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
                </div>

                {/* SECTION 2 - PROFESSIONAL INFO */}
                <div className="card border rounded-3 p-4 bg-white shadow-xs mb-4">
                  <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white rounded-circle fs-8 p-1.5" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                    <span>Professional Trade Credentials</span>
                  </h5>

                  {/* CATEGORY & EXPERIENCE */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="profile-category" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                        Trade Category / Specialization
                      </label>
                      <select
                        id="profile-category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="form-select py-2 shadow-none"
                        required
                      >
                        <option value="">Select Category</option>
                        {categoriesList.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="profile-experience" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                        Years of Active Experience
                      </label>
                      <input
                        type="number"
                        id="profile-experience"
                        min="0"
                        max="50"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="form-control py-2 shadow-none"
                        placeholder="e.g., 5"
                        required
                      />
                    </div>
                  </div>

                  {/* SERVICE COVERAGE AREAS */}
                  <div className="mb-3">
                    <label htmlFor="profile-areas" className="form-label fw-semibold text-dark fs-7 mb-1.5">
                      Service Areas Coverage
                    </label>
                    <input
                      type="text"
                      id="profile-areas"
                      value={serviceAreas}
                      onChange={(e) => setServiceAreas(e.target.value)}
                      className="form-control py-2 shadow-none"
                      placeholder="e.g., East Legon, Spintex, Airport Residential Area"
                    />
                    <div className="form-text fs-8 text-muted">Provide communities or suburbs you can commute to. Comma-separated.</div>
                  </div>

                  {/* BIOGRAPHY */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <label htmlFor="profile-bio" className="form-label fw-semibold text-dark fs-7 mb-0">
                        Professional Biography / Pitch
                      </label>
                      <span className={`fs-8 fw-semibold ${bio.length > 280 ? 'text-danger' : 'text-success'}`}>
                        {bio.length}/300 characters
                      </span>
                    </div>
                    <textarea
                      id="profile-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value.substring(0, 300))}
                      className="form-control shadow-none"
                      rows="4"
                      placeholder="Share a brief overview of your skills, equipment used, trade precision details, and why customers in Ghana should hire you."
                      required
                    ></textarea>
                    <div className="form-text fs-8 text-muted mt-1">Brief summary displayed to public. Max 300 characters.</div>
                  </div>
                </div>

                {/* SAVE BUTTON SECTION */}
                <div className="border-top pt-4 text-end">
                  <button
                    type="submit"
                    className="btn btn-primary px-5 py-2.5 rounded-pill shadow-sm fw-bold d-inline-flex align-items-center gap-2"
                    disabled={submittingForm}
                    style={{ cursor: submittingForm ? 'not-allowed' : 'pointer' }}
                  >
                    {submittingForm ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Saving All Changes...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Save Profile Settings</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* RIGHT PROFILE PHOTO COLUMN */}
            <div className="col-12 col-lg-4">
              <div className="card border rounded-3 p-4 bg-light shadow-xs mb-4" id="photo-uploader-box">
                <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-8 p-1.5" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                  <span>Profile Photo</span>
                </h5>

                {/* Photo Display segment */}
                <div className="text-center mb-4 p-3 bg-white rounded-3 border d-flex flex-column align-items-center justify-content-center">
                  <div className="mb-3 position-relative d-inline-block">
                    <ProfileAvatar 
                      name={fullName || user.full_name} 
                      photo_url={photoPreview || profilePhoto} 
                      size="xxl" 
                    />
                    {photoPreview && (
                      <span className="position-absolute bottom-0 end-0 badge bg-warning text-dark border border-white rounded-pill px-2 py-1 fs-8.5 fw-bold">
                        Preview
                      </span>
                    )}
                  </div>
                  <h6 className="fw-bold text-dark mb-1">{fullName || 'My Name'}</h6>
                  <p className="text-muted fs-8 mb-0">JPEG, PNG, WebP up to 5MB.</p>
                </div>

                {/* Choose & Upload form */}
                <div className="mb-3">
                  <label htmlFor="photo-file-input" className="form-label fw-bold text-dark fs-7.5 mb-1.5">
                    Select New Photo File
                  </label>
                  <input
                    type="file"
                    id="photo-file-input"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="form-control shadow-none fs-7.5"
                  />
                </div>

                {photoFile && (
                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="btn btn-warning w-100 py-2 rounded-pill fw-bold text-dark mt-2 d-flex align-items-center justify-content-center gap-2"
                    style={{ cursor: uploadingPhoto ? 'not-allowed' : 'pointer' }}
                  >
                    {uploadingPhoto ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span>Upload Selected Photo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
