// Summary.jsx - Updated component
import React, { useState, useEffect } from 'react';
import { AlertCircle, Heart, Activity, FileText, Calendar, User, TrendingUp, Pill, Loader2, Clock } from 'lucide-react';
import api from '../../libs/apiCall.js';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

const Summary = () => {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchAISummary = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/ai/ai-summary?patient_id=${patient_id}`);
        
        if (data.status === "success") {
          setSummary(data.data);
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Failed to fetch AI summary");
      } finally {
        setLoading(false);
      }
    };

    if (patient_id) {
      fetchAISummary();
    }
  }, [patient_id]);

  if (loading) {
    return (
      <div className="ai-summary-container">
        <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Generating AI Clinical Summary...</p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Analyzing patient records from the past year...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="ai-summary-container">
        <div className="no-results">
          <p>No summary available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-summary-wrapper" style={{ padding: '24px', background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', padding: '24px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <User style={{ width: '32px', height: '32px' }} />
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{summary.patient?.name || 'Patient Name'}</h1>
                  <p style={{ color: '#bfdbfe', fontSize: '14px', margin: '4px 0 0 0' }}>
                    MRN: {summary.patient?.id || 'N/A'} • {summary.patient?.age || 'N/A'} years old • {summary.patient?.gender || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#bfdbfe' }}>AI Clinical Summary</div>
              <div style={{ fontSize: '12px', color: '#dbeafe', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <Clock style={{ width: '14px', height: '14px' }} />
                Past {summary.metadata?.summary_period || '12 months'} • {summary.metadata?.visits_last_year || 0} visits
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {summary.criticalAlerts && summary.criticalAlerts.length > 0 && (
          <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', margin: '24px', borderRadius: '0 8px 8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle style={{ width: '24px', height: '24px', color: '#dc2626', flexShrink: 0, marginTop: '4px' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 'bold', color: '#7f1d1d', fontSize: '18px', marginBottom: '8px' }}>⚠️ Critical Allergies</h3>
                {summary.criticalAlerts.map((alert, idx) => (
                  <div key={idx} style={{ color: alert.severity === 'severe' ? '#991b1b' : '#b91c1c', fontWeight: alert.severity === 'severe' ? '600' : 'normal', marginBottom: '4px' }}>
                    • {alert.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Summary Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Patient Overview */}
          {summary.overview && (
            <section style={{ background: 'linear-gradient(to right, #eff6ff, #eef2ff)', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Heart style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Patient Overview</h2>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.7', fontSize: '16px', margin: 0 }}>
                {summary.overview}
              </p>
            </section>
          )}

          {/* Clinical History (Past Year) */}
          {summary.clinicalHistory && (
            <section style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Calendar style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Clinical History - Past Year</h2>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.7', fontSize: '16px', margin: 0 }}>
                {summary.clinicalHistory}
              </p>
            </section>
          )}

          {/* Significant Findings */}
          {summary.significantFindings && (
            <section style={{ background: '#fffbeb', padding: '20px', borderRadius: '12px', border: '1px solid #fcd34d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Activity style={{ width: '20px', height: '20px', color: '#d97706' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Significant Clinical Findings</h2>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.7', fontSize: '16px', margin: 0 }}>
                {summary.significantFindings}
              </p>
            </section>
          )}

          {/* Current Treatment Plan */}
          {summary.currentPlan && (
            <section style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Pill style={{ width: '20px', height: '20px', color: '#16a34a' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Current Treatment & Follow-Up Plan</h2>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.7', fontSize: '16px', margin: 0 }}>
                {summary.currentPlan}
              </p>
            </section>
          )}

          {/* Risk Factors */}
          {summary.riskFactors && (
            <section style={{ background: '#faf5ff', padding: '20px', borderRadius: '12px', border: '1px solid #d8b4fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <TrendingUp style={{ width: '20px', height: '20px', color: '#9333ea' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Risk Factors & Considerations</h2>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.7', fontSize: '16px', margin: 0 }}>
                {summary.riskFactors}
              </p>
            </section>
          )}

          {/* Summary Stats */}
          <section style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  {summary.metadata?.visits_last_year || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Visits (Past Year)</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                  {summary.metadata?.total_allergies || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Known Allergies</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  {summary.metadata?.active_medications || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Active Medications</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9333ea' }}>
                  {summary.metadata?.chronic_conditions || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Chronic Conditions</div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div style={{ background: '#f9fafb', padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '14px', color: '#6b7280' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ width: '16px', height: '16px' }} />
              <span>This AI-generated summary only covers the past 12 months and should be reviewed by clinical staff</span>
            </div>
            <button 
              onClick={() => navigate(`/patients/details/${patient_id}`)}
              style={{ padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.background = '#2563eb'}
            >
              View Full Medical Record
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Summary;