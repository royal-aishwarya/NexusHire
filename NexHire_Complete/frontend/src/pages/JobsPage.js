import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState('');
  const [preferred, setPreferred] = useState('');
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => { try { setJobs(await api.getJobs()); } catch (e) { setError(e.message); } };
  useEffect(() => { refresh(); }, []);

  const create = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api.createJob({title, company, description,
        required_skills: required.split(',').map(x=>x.trim()).filter(Boolean),
        preferred_skills: preferred.split(',').map(x=>x.trim()).filter(Boolean)});
      setTitle(''); setCompany(''); setDescription(''); setRequired(''); setPreferred('');
      await refresh();
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  const runMatch = async (id) => {
    setBusy(true); setError(''); setMatch(null);
    try { setMatch(await api.matchJob(id)); } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this job description?')) return;
    try { await api.deleteJob(id); await refresh(); if(match?.job_id===id) setMatch(null); }
    catch(e) { setError(e.message); }
  };

  return <div className="page">
    <div className="page-header"><div><h1 className="page-title">Job Matching</h1>
      <p className="page-sub">Create role profiles and compare your saved resume using local TF-IDF and skill coverage.</p></div></div>
    <form className="setup-card" onSubmit={create}>
      <h2>Add a job description</h2>
      <div className="field-group"><label>Job title</label><input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Frontend Developer"/></div>
      <div className="field-group"><label>Company (optional)</label><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name"/></div>
      <div className="field-group"><label>Full job description</label><textarea required rows="5" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Paste the job description..."/></div>
      <div className="field-group"><label>Required skills (comma-separated)</label><input value={required} onChange={e=>setRequired(e.target.value)} placeholder="JavaScript, React, HTML, CSS"/></div>
      <div className="field-group"><label>Preferred skills (comma-separated)</label><input value={preferred} onChange={e=>setPreferred(e.target.value)} placeholder="TypeScript, Docker, AWS"/></div>
      <button className="btn-primary" disabled={busy}>{busy?'Saving...':'Save job profile'}</button>
    </form>
    {error && <div className="auth-error" style={{marginTop:16}}>{error}</div>}
    <div style={{display:'grid',gap:16,marginTop:24}}>
      {jobs.map(job=><div className="setup-card" key={job._id}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div><h2>{job.title}</h2><p className="page-sub">{job.company || 'Company not specified'}</p></div>
          <div style={{display:'flex',gap:8,alignItems:'start'}}>
            <button className="btn-primary" onClick={()=>runMatch(job._id)} disabled={busy}>Match resume</button>
            <button className="btn-secondary" onClick={()=>remove(job._id)}>Delete</button>
          </div>
        </div>
        <p style={{whiteSpace:'pre-wrap',opacity:.8}}>{job.description.slice(0,500)}{job.description.length>500?'…':''}</p>
        <p><b>Required:</b> {(job.required_skills||[]).join(', ') || 'Not set'}</p>
        <p><b>Preferred:</b> {(job.preferred_skills||[]).join(', ') || 'Not set'}</p>
      </div>)}
      {!jobs.length && <div className="setup-card">No job profiles saved yet. Add one above.</div>}
    </div>
    {match && <div className="setup-card" style={{marginTop:24}}>
      <h2>Match report — {match.job_title}</h2>
      <div style={{fontSize:40,fontWeight:800}}>{match.composite_score}%</div>
      <p>Text similarity: {match.text_similarity}% · Required coverage: {match.required_skill_coverage ?? 'N/A'}% · Preferred coverage: {match.preferred_skill_coverage ?? 'N/A'}%</p>
      <p><b>Missing required:</b> {match.missing_required_skills.join(', ') || 'None'}</p>
      <p><b>Missing preferred:</b> {match.missing_preferred_skills.join(', ') || 'None'}</p>
      <p>{match.scoring_method}</p>
      <ul>{match.recommendations.map((r,i)=><li key={i}>{r}</li>)}</ul>
    </div>}
  </div>;
}
