import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleGoogleCallback(token);
      setTimeout(() => navigate('/dashboard'), 500);
    } else {
      navigate('/login?error=google');
    }
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <div className="loading-screen">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Completing sign in with Google...</p>
      </div>
    </div>
  );
}