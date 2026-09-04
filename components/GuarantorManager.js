'use client';

import React, { useCallback, useEffect, useState } from 'react';

const emptyForm = { name: '', relationship: '', phone: '', email: '', notes: '' };

export default function GuarantorManager({ authFetch }) {
  const [guarantors, setGuarantors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadGuarantors = useCallback(async () => {
    try {
      const response = await authFetch('/api/guarantors');
      const result = await response.json();
      if (response.ok && result.success) setGuarantors(result.data || []);
      else setError(result.error || 'Unable to load guarantors.');
    } catch (loadError) {
      console.error('Guarantor load error:', loadError);
      setError('Unable to load guarantors.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadGuarantors(); }, 0);
    return () => clearTimeout(timer);
  }, [loadGuarantors]);

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await authFetch(editingId ? `/api/guarantors/${editingId}` : '/api/guarantors', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || 'Unable to save guarantor.');
        return;
      }
      setForm(emptyForm);
      setEditingId(null);
      setMessage(result.message || 'Guarantor submitted for review.');
      await loadGuarantors();
    } catch (saveError) {
      console.error('Guarantor save error:', saveError);
      setError('Unable to save guarantor.');
    } finally {
      setSaving(false);
    }
  };

  const editGuarantor = (guarantor) => {
    setEditingId(guarantor.guarantor_id);
    setForm({ name: guarantor.name || '', relationship: guarantor.relationship || '', phone: guarantor.phone || '', email: guarantor.email || '', notes: guarantor.notes || '' });
    setMessage('');
    setError('');
  };

  const deleteGuarantor = async (id) => {
    if (!window.confirm('Remove this guarantor?')) return;
    const response = await authFetch(`/api/guarantors/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (response.ok && result.success) loadGuarantors();
    else setError(result.error || 'Unable to remove guarantor.');
  };

  return (
    <div className="card border rounded-3 p-4 bg-white shadow-xs" id="guarantor-manager">
      <h5 className="fw-bold text-dark mb-1">Trust References</h5>
      <p className="text-muted fs-7 mb-3">Add people who can confirm your work and character. Approved references appear on your public profile.</p>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {message && <div className="alert alert-success py-2 small">{message}</div>}
      <div className="d-flex flex-column gap-2 mb-3">
        {loading ? <span className="text-muted small">Loading references...</span> : guarantors.length === 0 ? <span className="text-muted small">No references submitted yet.</span> : guarantors.map((guarantor) => (
          <div key={guarantor.guarantor_id} className="border rounded-3 p-2 d-flex justify-content-between gap-2 align-items-start">
            <div className="small"><strong>{guarantor.name}</strong><div className="text-muted">{guarantor.relationship} {guarantor.phone || guarantor.email ? `| ${guarantor.phone || guarantor.email}` : ''}</div></div>
            <div className="d-flex gap-1 align-items-center">
              <span className={`badge ${guarantor.status === 'approved' ? 'bg-success-subtle text-success' : guarantor.status === 'rejected' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning-emphasis'}`}>{guarantor.status}</span>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => editGuarantor(guarantor)}>Edit</button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteGuarantor(guarantor.guarantor_id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          {['name', 'relationship', 'phone', 'email'].map((field) => (
            <div className="col-md-6" key={field}>
              <label className="form-label small fw-semibold text-capitalize">{field === 'phone' ? 'Phone (or email)' : field}</label>
              <input className="form-control form-control-sm" name={field} value={form[field]} onChange={updateField} required={field === 'name' || field === 'relationship'} type={field === 'email' ? 'email' : 'text'} />
            </div>
          ))}
          <div className="col-12"><label className="form-label small fw-semibold">Notes</label><textarea className="form-control form-control-sm" name="notes" rows="2" value={form.notes} onChange={updateField} maxLength="2000" /></div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-3">
          {editingId && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
          <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update reference' : 'Submit reference'}</button>
        </div>
      </form>
    </div>
  );
}
