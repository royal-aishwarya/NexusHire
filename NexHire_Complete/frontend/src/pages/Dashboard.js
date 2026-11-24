import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import ScoreRing from '../components/ScoreRing';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="stat-card" style={{ '--accent': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-body">
      <div className="stat-value" style={{ color }}>{value}<span className="stat-unit">%</span></div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

const QuickAction = ({ to, icon, title, desc, color }) => (
  <Link to={to} className="quick-action" style={{ '--accent': color }}>
    <div className="qa-icon">{icon}</div>
    <div>
      <div className="qa-title">{title}</div>
      <div className="qa-desc">{desc}</div>
    </div>
    <span className="qa-arrow">→</span>
  </Link>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const overall = stats?.overall_score || 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, <span className="highlight">{user?.name || 'Candidate'}</span></p>
        </div>
        <div className="header-badge">
          <span className="pulse-dot" />
          AI Ready
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your analytics...</p>
        </div>
      ) : (
        <>
          {/* Hero Score */}
          <div className="hero-score-card">
            <div className="hero-score-left">
              <ScoreRing score={overall} size={160} label="Overall Score" />
            </div>
            <div className="hero-score-right">
              <h2>Your Performance Overview</h2>
              <p className="hero-sub">
                {overall >= 75 ? '🏆 Excellent! You\'re interview-ready.' :
                 overall >= 50 ? '📈 Good progress. Keep practicing.' :
                 overall > 0 ? '🚀 Getting started. Complete all sections.' :
                 '👋 Begin your assessment journey below.'}
              </p>
              <div className="mini-stats">
                {[
                  { label: 'Interviews', value: stats?.total_interviews || 0, unit: '' },
                  { label: 'Assessments', value: stats?.total_assessments || 0, unit: '' },
                  { label: 'Skills Found', value: stats?.skills?.length || 0, unit: '' },
                ].map(s => (
                  <div key={s.label} className="mini-stat">
                    <div className="mini-val">{s.value}{s.unit}</div>
                    <div className="mini-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid-4">
            <StatCard label="Resume Score" value={stats?.resume_score || 0} icon="📄" color="var(--neon-blue)" sub="Profile strength" />
            <StatCard label="Interview Score" value={stats?.interview_score || 0} icon="🎤" color="var(--neon-purple)" sub="Communication" />
            <StatCard label="MCQ Score" value={stats?.mcq_score || 0} icon="🧠" color="var(--neon-green)" sub="Technical knowledge" />
            <StatCard label="Interviews" value={stats?.total_interviews || 0} icon="🗣️" color="var(--neon-amber)" sub="Completed practice sessions" />
          </div>

          {/* Skills */}
          {stats?.skills?.length > 0 && (
            <div className="glass-card">
              <h3 className="card-title">Detected Skills</h3>
              <div className="skill-tags">
                {stats.skills.map((s, i) => (
                  <span key={i} className="skill-tag">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {(stats?.strengths?.length > 0 || stats?.weaknesses?.length > 0) && (
            <div className="grid-2">
              {stats.strengths?.length > 0 && (
                <div className="glass-card">
                  <h3 className="card-title">✅ Strengths</h3>
                  <ul className="insight-list">
                    {stats.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {stats.weaknesses?.length > 0 && (
                <div className="glass-card">
                  <h3 className="card-title">⚠️ Areas to Improve</h3>
                  <ul className="insight-list warn">
                    {stats.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="glass-card">
            <h3 className="card-title">Quick Actions</h3>
            <div className="quick-actions-grid">
              <QuickAction to="/app/resume" icon="📤" title="Upload Resume" desc="Parse & score your CV" color="var(--neon-blue)" />
              <QuickAction to="/app/interview" icon="🎙️" title="Start Interview" desc="AI-powered mock interview" color="var(--neon-purple)" />
              <QuickAction to="/app/assessment" icon="📝" title="Take Assessment" desc="Technical MCQ evaluation" color="var(--neon-green)" />
              <QuickAction to="/app/feedback" icon="📊" title="View Report" desc="Full AI feedback report" color="var(--neon-amber)" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
