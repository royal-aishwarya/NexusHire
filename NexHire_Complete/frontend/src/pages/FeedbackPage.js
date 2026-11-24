import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import ScoreRing from '../components/ScoreRing';

const Section = ({ title, items, icon, color }) => (
  <div className="glass-card">
    <h3 className="card-title" style={{ color }}>{icon} {title}</h3>
    <ul className="insight-list">
      {items?.length ? items.map((item, i) => <li key={i}>{item}</li>) : <li style={{ color: 'var(--text-muted)' }}>Complete more assessments to populate this section.</li>}
    </ul>
  </div>
);

export default function FeedbackPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const loadReport = () => {
    setLoading(true);
    api.getReport()
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReport(); }, []);

  const generate = async () => {
    setGenerating(true); setError('');
    try {
      const data = await api.generateFeedback({});
      setReport(data);
    } catch (e) {
      setError(e.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const scores = report?.scores || {};
  const scoreItems = [
    { label: 'Resume', key: 'resume', color: 'var(--neon-blue)', icon: '📄' },
    { label: 'Interview', key: 'interview', color: 'var(--neon-purple)', icon: '🎤' },
    { label: 'MCQ', key: 'mcq', color: 'var(--neon-green)', icon: '🧠' },
    { label: 'Confidence', key: 'confidence', color: 'var(--neon-amber)', icon: '👁️' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">AI Feedback Report</h1>
          <p className="page-sub">Comprehensive analysis generated locally with open-source AI</p></div>
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating ? <><span className="spinner-sm"/> Generating...</> : '⚡ Generate Report'}
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {loading ? (
        <div className="loading-state"><div className="spinner"/><p>Loading report...</p></div>
      ) : !report ? (
        <div className="empty-page-state">
          <div className="empty-icon" style={{ fontSize: '4rem' }}>📊</div>
          <h2>No Report Yet</h2>
          <p>Complete your resume upload, interview, and assessments, then click Generate Report.</p>
          <button className="btn-primary" onClick={generate} disabled={generating}>
            {generating ? <><span className="spinner-sm"/> Generating...</> : '⚡ Generate Now'}
          </button>
        </div>
      ) : (
        <>
          {/* Overall Score Hero */}
          <div className="hero-score-card">
            <div className="hero-score-left">
              <ScoreRing score={scores.overall || 0} size={160} label="Overall Score" />
            </div>
            <div className="hero-score-right">
              <h2>Overall Assessment</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{report.overall_assessment}</p>
              <div className="mini-stats">
                {scoreItems.map(({ label, key, color }) => (
                  <div key={key} className="mini-stat">
                    <div className="mini-val" style={{ color }}>{scores[key] || 0}%</div>
                    <div className="mini-lbl">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Rings */}
          <div className="score-rings-row">
            {scoreItems.map(({ label, key, color }) => (
              <div key={key} className="glass-card center-card">
                <ScoreRing score={scores[key] || 0} size={100} label={label} color={color} />
              </div>
            ))}
          </div>

          {/* Detailed sections */}
          <div className="grid-2">
            <Section title="Strengths" items={report.strengths} icon="✅" color="var(--neon-green)" />
            <Section title="Areas to Improve" items={report.weaknesses} icon="⚠️" color="var(--neon-amber)" />
          </div>

          <div className="grid-2">
            <Section title="Skill Gaps" items={report.skill_gaps} icon="📉" color="var(--neon-pink)" />
            <Section title="Learning Recommendations" items={report.learning_recommendations} icon="📚" color="var(--neon-blue)" />
          </div>

          <Section title="Resume Suggestions" items={report.resume_suggestions} icon="📝" color="var(--neon-purple)" />

          {report.generated_at && (
            <p className="report-timestamp">
              Report generated: {new Date(report.generated_at).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
