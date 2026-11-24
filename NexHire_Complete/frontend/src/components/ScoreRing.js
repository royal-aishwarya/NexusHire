import React from 'react';

export default function ScoreRing({ score = 0, size = 120, label = '', color = 'var(--neon-blue)' }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const progress = ((score / 100) * circ);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circ}`}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)'
          }}
        />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.22,
          fontWeight: 900, color, textShadow: `0 0 20px ${color}` }}>
          {score}
        </div>
        {label && (
          <div style={{ fontSize: size * 0.1, color: 'var(--text-muted)',
            letterSpacing: '0.05em', marginTop: 2 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
