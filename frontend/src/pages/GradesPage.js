import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GradesPage() {
  const { user, hasPermission, api } = useAuth();
  const isStudent   = user?.role === 'student';
  const canInput    = hasPermission('grades:input');      // faculty
  const canViewDept = hasPermission('reports:department'); // dept head

  const [items,      setItems]   = useState([]);
  const [loading,    setLoad]    = useState(true);
  const [error,      setError]   = useState('');
  const [note,       setNote]    = useState('');

  // Grade modal state
  const [gradeModal, setGradeModal] = useState(null);
  const [gradeForm,  setGradeForm]  = useState({ grade: '', feedback: '', isFinal: false });
  const [saving,     setSaving]     = useState(false);

  const notify = (m) => { setNote(m); setTimeout(() => setNote(''), 3000); };

  const fetchGrades = useCallback(async () => {
    setLoad(true);
    try {
      const r = await api.get('/assignments', { params: { status: 'graded' } });
      let data = r.data.items || [];
      if (isStudent) {
        data = data.filter(a =>
          String(a.submittedBy?._id || a.submittedBy) === String(user._id)
        );
      }
      setItems(data);
    } catch {
      setError('Failed to load grades');
    } finally {
      setLoad(false);
    }
  }, [api, isStudent, user]);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  const openGradeModal = (item) => {
    setGradeForm({
      grade:    item.grade    || '',
      feedback: item.feedback || '',
      isFinal:  false,   // always start unchecked — faculty must explicitly check it
    });
    setGradeModal(item);
  };

  const handleGrade = async () => {
    if (!gradeForm.grade.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/assignments/${gradeModal._id}/grade`, {
        grade:    gradeForm.grade.trim(),
        feedback: gradeForm.feedback.trim(),
        isFinal:  gradeForm.isFinal,   // boolean sent directly
      });
      notify(gradeForm.isFinal ? '🔒 Final grade saved!' : '✅ Grade updated!');
      setGradeModal(null);
      fetchGrades();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const gradeColor = (g) => {
    if (!g) return 'var(--text-muted)';
    const u = g.toUpperCase();
    if (u.startsWith('A')) return '#10b981';
    if (u.startsWith('B')) return '#3b82f6';
    if (u.startsWith('C')) return '#f59e0b';
    if (u.startsWith('D')) return '#f97316';
    return '#ef4444';
  };

  return (
    <div>
      {/* Toast */}
      {note && (
        <div className="alert alert-success" style={{
          position: 'fixed', top: 80, right: 24, zIndex: 300,
          minWidth: 280, boxShadow: 'var(--shadow-lg)'
        }}>{note}</div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: 'inherit'
          }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
          {isStudent ? 'My Grades' : canViewDept ? 'Department Grade Report' : 'Grade Records'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          {isStudent
            ? '🎯 View your academic grades and feedback.'
            : canInput
            ? '✏️ Review and mark grades as final for your students.'
            : '📊 Grade overview for your department.'}
        </p>
      </div>

      {/* Student read-only notice */}
      {isStudent && (
        <div className="alert alert-info" style={{ marginBottom: 20, fontSize: 13 }}>
          🔒 You can only view your own grades. Students cannot modify grades.
        </div>
      )}

      {/* Faculty hint */}
      {canInput && !isStudent && (
        <div className="alert alert-info" style={{ marginBottom: 20, fontSize: 13 }}>
          ✏️ Click the <strong>Edit</strong> button on any grade row to update the grade or mark it as <strong>Final</strong>. TAs can grade but only Faculty can mark a grade as Final.
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Course</th>
              <th>Subject</th>
              {!isStudent && <th>Student</th>}
              <th>Grade</th>
              <th>Status</th>
              <th>Graded By</th>
              <th>Feedback</th>
              <th>Date</th>
              {canInput && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canInput ? 10 : 9}>
                  <div className="page-spinner"><div className="spinner" /></div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={canInput ? 10 : 9}>
                  <div className="empty-state">
                    <div className="empty-icon">🎯</div>
                    <p>{isStudent
                      ? 'No grades yet. Submit assignments to get graded!'
                      : 'No graded assignments found.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : items.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 500 }}>{item.title}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.course}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.subject}</td>
                {!isStudent && (
                  <td style={{ fontSize: 13 }}>{item.submittedByName || '—'}</td>
                )}
                <td>
                  <span style={{ fontWeight: 800, fontSize: 16, color: gradeColor(item.grade) }}>
                    {item.grade || '—'}
                  </span>
                </td>
                <td>
                  {item.isFinalGrade ? (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.15)', color: 'var(--danger)',
                      fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)'
                    }}>🔒 FINAL</span>
                  ) : (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 10,
                      background: 'rgba(245,158,11,0.12)', color: '#d97706',
                      fontWeight: 600, border: '1px solid rgba(245,158,11,0.25)'
                    }}>📝 Provisional</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {item.gradedByName || '—'}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180 }}>
                  {item.feedback || '—'}
                </td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
                {canInput && (
                  <td>
                    {/* Don't allow editing already-finalized grades */}
                    {item.isFinalGrade ? (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Locked</span>
                    ) : (
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Edit / Mark as Final"
                        onClick={() => openGradeModal(item)}
                        style={{ color: 'var(--accent)' }}
                      >✏️</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Grade Modal ────────────────────────────────────────────────────── */}
      {gradeModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setGradeModal(null)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit Grade</h2>
              <button className="modal-close" onClick={() => setGradeModal(null)}>✕</button>
            </div>

            {/* Assignment info */}
            <div style={{
              padding: '10px 14px', background: 'var(--bg-elevated)',
              borderRadius: 8, marginBottom: 16
            }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{gradeModal.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {gradeModal.course} · {gradeModal.subject}
              </div>
              {gradeModal.submittedByName && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Student: <strong>{gradeModal.submittedByName}</strong>
                </div>
              )}
              {gradeModal.submissionText && (
                <div style={{
                  fontSize: 12, color: 'var(--text-muted)', marginTop: 6,
                  fontStyle: 'italic', borderLeft: '3px solid var(--border)',
                  paddingLeft: 8
                }}>
                  "{gradeModal.submissionText}"
                </div>
              )}
            </div>

            {/* Grade input */}
            <div className="form-group">
              <label className="form-label">Grade *</label>
              <input
                className="form-input"
                value={gradeForm.grade}
                onChange={e => setGradeForm({ ...gradeForm, grade: e.target.value })}
                placeholder="e.g. A+, B, 88/100, Pass"
                autoFocus
              />
            </div>

            {/* Feedback */}
            <div className="form-group">
              <label className="form-label">Feedback</label>
              <textarea
                className="form-input"
                rows={3}
                value={gradeForm.feedback}
                onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                placeholder="Comments for the student..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Final grade toggle — faculty only */}
            {user?.role === 'faculty' && (
              <div className="form-group">
                <div
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${gradeForm.isFinal ? '#ef4444' : 'var(--border)'}`,
                    background: gradeForm.isFinal ? 'rgba(239,68,68,0.06)' : 'var(--bg-secondary)',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setGradeForm({ ...gradeForm, isFinal: !gradeForm.isFinal })}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={gradeForm.isFinal === true}
                      onChange={e => setGradeForm({ ...gradeForm, isFinal: e.target.checked })}
                      onClick={e => e.stopPropagation()}
                      style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 13 }}>
                        🔒 Mark as Final Grade
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                        Once marked final, this grade is locked and cannot be edited again.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TA notice */}
            {user?.role === 'teaching_assistant' && (
              <div className="alert alert-info" style={{ fontSize: 12, marginBottom: 12 }}>
                ℹ️ As a TA you can update grades, but only Faculty can mark a grade as Final.
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setGradeModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGrade}
                disabled={saving || !gradeForm.grade.trim()}
                style={{
                  width: 'auto', padding: '10px 24px',
                  background: gradeForm.isFinal ? '#ef4444' : undefined,
                  borderColor: gradeForm.isFinal ? '#ef4444' : undefined
                }}
              >
                {saving
                  ? '⏳ Saving...'
                  : gradeForm.isFinal
                  ? '🔒 Save Final Grade'
                  : '✅ Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}