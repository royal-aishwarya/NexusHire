
import React, { useState, useCallback, useEffect } from 'react';
import { api } from '../utils/api';
import ScoreRing from '../components/ScoreRing';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Github,
  Linkedin,
  Mail,
  Phone,
  Tag
} from 'lucide-react';

export default function ResumePage() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [jobDesc, setJobDesc] = useState('');

  // Load previously uploaded resume
  useEffect(() => {
    let active = true;

    api.getResume()
      .then((response) => {
        if (active) {
          setResume(response.data || response);
        }
      })
      .catch((err) => {
        console.error('Resume loading error:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Upload and analyze resume
  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const allowed = ['pdf', 'docx', 'doc', 'txt'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowed.includes(ext)) {
      setError('Please upload a PDF, DOCX, DOC, or TXT file.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDesc);

    try {
      const response = await api.uploadResume(formData);

      setResume(response.data || response);
    } catch (err) {
      console.error('Resume upload error:', err);
      setError(err.message || 'Resume upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [jobDesc]);

  // Drag and drop
  const onDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const scoreColor = (score) => {
    if (score >= 70) return 'var(--neon-green)';
    if (score >= 50) return 'var(--neon-amber)';
    return 'var(--neon-pink)';
  };

  const totalScore = resume?.score?.total || 0;

  return (
    <div style={{ maxWidth: 900 }}>

      {/* PAGE HEADER */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 6
        }}>
          <FileText size={18} color="var(--neon-blue)" />

          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.7rem',
            color: 'var(--neon-blue)',
            letterSpacing: '0.2em'
          }}>
            RESUME ANALYSIS
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 900
        }}>
          Resume <span className="gradient-text">Parser & Scorer</span>
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          marginTop: 6
        }}>
          Local resume extraction using regular expressions
          and TF-IDF cosine similarity.
        </p>
      </div>

      {/* JOB DESCRIPTION */}
      <div className="card" style={{ marginBottom: 24 }}>
        <label style={{
          display: 'block',
          fontFamily: 'var(--font-display)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.1em',
          marginBottom: 10
        }}>
          JOB DESCRIPTION (OPTIONAL)
        </label>

        <textarea
          className="input-field"
          rows={3}
          placeholder="Paste job description for tailored match score..."
          value={jobDesc}
          onChange={(event) => setJobDesc(event.target.value)}
          style={{
            resize: 'vertical',
            minHeight: 80
          }}
        />
      </div>

      {/* RESUME UPLOAD */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => {
            document.getElementById('resume-file')?.click();
          }}
          style={{
            border: `2px dashed ${
              dragOver ? 'var(--neon-blue)' : 'var(--border-subtle)'
            }`,
            borderRadius: 'var(--radius-lg)',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)',
            background: dragOver
              ? 'rgba(0,212,255,0.04)'
              : 'transparent'
          }}
        >
          <input
            id="resume-file"
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            style={{ display: 'none' }}
            onChange={(event) => {
              handleFile(event.target.files[0]);
              event.target.value = '';
            }}
          />

          {loading ? (
            <div className="pulse">
              <div style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--neon-blue)',
                marginBottom: 8
              }}>
                ANALYZING RESUME...
              </div>

              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                Running NLP extraction and scoring
              </div>
            </div>
          ) : (
            <>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid var(--border-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Upload size={24} color="var(--neon-blue)" />
              </div>

              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                marginBottom: 8
              }}>
                DROP YOUR RESUME HERE
              </div>

              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.8rem'
              }}>
                PDF, DOCX, DOC, or TXT · Click to browse
              </div>
            </>
          )}
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--neon-pink)',
            fontSize: '0.85rem',
            marginTop: 12
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* RESUME RESULTS */}
      {resume && (
        <div className="anim-fade-up">

          {/* SCORE SECTION */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 24,
            marginBottom: 24
          }}>
            <div className="card" style={{
              textAlign: 'center',
              padding: 28
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.15em',
                marginBottom: 16
              }}>
                RESUME SCORE
              </div>

              <ScoreRing
                score={totalScore}
                size={140}
                color={scoreColor(totalScore)}
              />
            </div>

            {/* SCORE BREAKDOWN */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.1em',
                marginBottom: 16
              }}>
                SCORE BREAKDOWN
              </div>

              {Object.entries(resume.score?.breakdown || {}).map(
                ([key, value]) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      marginBottom: 6
                    }}>
                      <span style={{
                        color: 'var(--text-secondary)',
                        textTransform: 'capitalize'
                      }}>
                        {key.replace(/_/g, ' ')}
                      </span>

                      <span style={{
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {value}
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            (Number(value) / 30) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* DETAILS SECTION */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24
          }}>

            {/* CONTACT INFORMATION */}
            <div className="card">
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                color: 'var(--neon-blue)',
                letterSpacing: '0.1em',
                marginBottom: 16
              }}>
                CONTACT INFO
              </div>

              {[
                ['Name', resume.name, CheckCircle],
                ['Email', resume.email, Mail],
                ['Phone', resume.phone, Phone],
                ['LinkedIn', resume.linkedin, Linkedin],
                ['GitHub', resume.github, Github]
              ].map(([label, value, Icon]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    marginBottom: 10
                  }}
                >
                  <Icon
                    size={14}
                    color={value
                      ? 'var(--neon-green)'
                      : 'var(--text-muted)'}
                  />

                  <span style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    minWidth: 60
                  }}>
                    {label}:
                  </span>

                  <span style={{
                    fontSize: '0.85rem',
                    color: value
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* SKILLS */}
            <div className="card">
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                color: 'var(--neon-purple)',
                letterSpacing: '0.1em',
                marginBottom: 16
              }}>
                EXTRACTED SKILLS ({resume.skills?.length || 0})
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8
              }}>
                {(resume.skills || []).map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="badge badge-purple"
                  >
                    <Tag size={10} />
                    {skill}
                  </span>
                ))}

                {!resume.skills?.length && (
                  <span style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}>
                    No skills detected
                  </span>
                )}
              </div>
            </div>

            {/* EDUCATION */}
            <div className="card">
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                color: 'var(--neon-green)',
                letterSpacing: '0.1em',
                marginBottom: 16
              }}>
                EDUCATION
              </div>

              {(resume.education || []).map((education, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 8
                  }}
                >
                  {education}
                </div>
              ))}

              {!resume.education?.length && (
                <span style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  Not detected
                </span>
              )}
            </div>

            {/* EXPERIENCE */}
            <div className="card">
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                color: 'var(--neon-amber)',
                letterSpacing: '0.1em',
                marginBottom: 16
              }}>
                EXPERIENCE
              </div>

              {resume.experience?.total_years > 0 && (
                <div
                  className="badge badge-amber"
                  style={{ marginBottom: 12 }}
                >
                  {resume.experience.total_years}+ years
                </div>
              )}

              {(resume.experience?.entries || [])
                .slice(0, 4)
                .map((experience, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 8,
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}
                  >
                    {experience}
                  </div>
                ))}

              {!resume.experience?.entries?.length && (
                <span style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  Not detected
                </span>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
