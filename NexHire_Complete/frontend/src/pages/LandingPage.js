import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Brain, Mic, FileText, BarChart3, Shield, ArrowRight, Star } from 'lucide-react';

const features = [
  { icon: FileText, title: 'AI Resume Parsing', desc: 'Extract skills, experience, and education using spaCy NLP + regex. Instant match scoring.', color: 'var(--neon-blue)' },
  { icon: Mic, title: 'Voice Interview', desc: 'Speak your answers. SpeechRecognition transcribes locally. No cloud APIs.', color: 'var(--neon-purple)' },
  { icon: Brain, title: 'Smart Q&A Evaluation', desc: 'TF-IDF + cosine similarity + keyword NLP scores every answer in real time.', color: 'var(--neon-green)' },
  { icon: BarChart3, title: 'Skill Assessment', desc: 'Beginner → Advanced MCQs across Python, JS, ML, CS. Timer-based evaluation.', color: 'var(--neon-amber)' },
  { icon: Shield, title: 'Private Camera Preview', desc: 'Use your webcam for a live practice-room preview. No facial traits are scored or uploaded.', color: 'var(--neon-pink)' },
  { icon: Star, title: 'AI Feedback Report', desc: 'Strengths, gaps, recommendations generated 100% offline with scikit-learn.', color: 'var(--neon-blue)' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
      {/* Hero */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '80px 24px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.12) 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.08) 0%, transparent 60%)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-neon-blue)'
          }}>
            <Zap size={28} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900,
            background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            NEXUSHIRE
          </span>
        </div>

        <div className="badge badge-blue" style={{ marginBottom: 24, fontSize: '0.65rem' }}>
          <Zap size={10} /> 100% OFFLINE · NO API KEYS REQUIRED
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 4.5rem)',
          fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em'
        }}>
          <span style={{ color: 'var(--text-primary)' }}>AI-POWERED</span>
          <br />
          <span className="gradient-text">INTERVIEW MASTERY</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 560,
          marginBottom: 48, lineHeight: 1.7 }}>
          Complete interview & skill assessment platform powered by open-source AI.
          Resume parsing, browser voice interviews, private camera preview and MCQ tests — with no cloud AI APIs.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/register')}
            style={{ fontSize: '0.8rem', padding: '14px 36px' }}>
            Get Started Free <ArrowRight size={16} />
          </button>
          <button className="btn-ghost" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 48, marginTop: 64, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['10+', 'AI Models'], ['500+', 'Questions'], ['6', 'Skill Tracks'], ['100%', 'Offline']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900,
                background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{n}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: 16 }}>
          <span className="gradient-text">EVERYTHING YOU NEED</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 64 }}>
          Powered entirely by open-source Python libraries
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card glass-hover" style={{ cursor: 'default' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                background: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem',
                color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '0.05em' }}>
                {title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '80px 24px',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.08) 0%, transparent 70%)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 16 }}>
          Ready to <span className="gradient-text">ACE YOUR INTERVIEW?</span>
        </h2>
        <button className="btn-primary" onClick={() => navigate('/register')}
          style={{ fontSize: '0.85rem', padding: '16px 48px' }}>
          Start For Free <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
