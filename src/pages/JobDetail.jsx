import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, DollarSign, Clock, Globe, User, Mail, Link2,
  Zap, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink, Loader,
  ChevronDown, Sparkles, FileText, MessageSquare
} from 'lucide-react';
import useStore from '../store';
import { analyzeATS, draftColdEmail, draftLinkedInDM, getResumeImprovements, generateSkillRoadmap } from '../gemini';
import SkillRoadmap from '../components/SkillRoadmap';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

function ScoreGauge({ score, size = 140 }) {
  const color = score >= 80 ? '#22d3a5' : score >= 65 ? '#6c63ff' : score >= 50 ? '#f59e0b' : '#f87171';
  const label = score >= 80 ? 'Great Fit' : score >= 65 ? 'Good Fit' : score >= 50 ? 'Fair Fit' : 'Low Fit';
  const data = [{ value: score, fill: color }];

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius={size * 0.28} outerRadius={size * 0.44} data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'rgba(255,255,255,0.05)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1, fontFamily: 'var(--font-display)' }}>{score}</span>
        <span style={{ fontSize: size * 0.09, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>/100</span>
        <span style={{ fontSize: size * 0.1, color, fontWeight: 600, marginTop: 4 }}>{label}</span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-header">
        <span className="progress-bar-label">{label}</span>
        <span className="progress-bar-value">{value}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%`, background: color || 'var(--color-brand-primary)' }} />
      </div>
    </div>
  );
}

function ContactCard({ contact, job, profile, geminiKey, addToast }) {
  const [emailDraft, setEmailDraft] = useState('');
  const [dmDraft, setDmDraft] = useState('');
  const [loading, setLoading] = useState('');

  const handleDraft = async (type) => {
    if (!geminiKey) { addToast('Add your Gemini API key in Settings first', 'error'); return; }
    setLoading(type);
    try {
      if (type === 'email') {
        const draft = await draftColdEmail(geminiKey, job, contact, profile);
        setEmailDraft(draft);
      } else {
        const draft = await draftLinkedInDM(geminiKey, job, contact, profile);
        setDmDraft(draft);
      }
      addToast('Draft generated!', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
    setLoading('');
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="card-body">
        {/* Contact Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', color: 'white', flexShrink: 0
          }}>
            {contact.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{contact.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{contact.title} · {contact.company}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Confidence</div>
            <div style={{ fontWeight: 700, color: contact.confidence >= 85 ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '0.9rem' }}>
              {contact.confidence}%
            </div>
          </div>
        </div>

        {/* Contact Links */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <a href={contact.linkedin} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
            <Link2 size={13} /> LinkedIn
          </a>
          {contact.email && (
            <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => copyText(contact.email)}>
              <Mail size={13} /> {contact.email}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: emailDraft || dmDraft ? 'var(--space-4)' : 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleDraft('email')} disabled={loading === 'email'} style={{ flex: 1 }}>
            {loading === 'email' ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Drafting…</> : <><Mail size={13} /> Draft Email</>}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleDraft('dm')} disabled={loading === 'dm'} style={{ flex: 1 }}>
            {loading === 'dm' ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Drafting…</> : <><MessageSquare size={13} /> LinkedIn DM</>}
          </button>
        </div>

        {/* Email Draft */}
        {emailDraft && (
          <div className="animate-fade-in" style={{ background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Draft</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => copyText(emailDraft)}><Copy size={12} /></button>
                <a href={`mailto:${contact.email || ''}?body=${encodeURIComponent(emailDraft)}`} className="btn btn-secondary btn-sm"><ExternalLink size={12} /> Open Gmail</a>
              </div>
            </div>
            <pre style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>{emailDraft}</pre>
          </div>
        )}

        {/* DM Draft */}
        {dmDraft && (
          <div className="animate-fade-in" style={{ background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', marginTop: emailDraft ? 'var(--space-3)' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-info)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>LinkedIn DM</span>
              <button className="btn btn-ghost btn-sm" onClick={() => copyText(dmDraft)}><Copy size={12} /> Copy</button>
            </div>
            <pre style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>{dmDraft}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobs = useStore(s => s.jobs);
  const profile = useStore(s => s.profile);
  const geminiKey = useStore(s => s.geminiKey);
  const updateJobStatus = useStore(s => s.updateJobStatus);
  const addToast = useStore(s => s.addToast);

  const job = jobs.find(j => j.id === id);
  const [activeTab, setActiveTab] = useState('ats');
  const [atsData, setAtsData] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [resumeSuggestions, setResumeSuggestions] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [roadmapData, setRoadmapData] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  if (!job) return (
    <div className="empty-state">
      <div className="empty-state-title">Job not found</div>
      <button className="btn btn-primary" onClick={() => navigate('/jobs')}>Back to Jobs</button>
    </div>
  );

  const handleATSAnalysis = async () => {
    if (!geminiKey) { addToast('Add your Gemini API key in Settings first', 'error'); return; }
    setAtsLoading(true);
    try {
      const result = await analyzeATS(geminiKey, job, profile);
      setAtsData(result);
      addToast('ATS analysis complete!', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
    setAtsLoading(false);
  };

  const handleResumeSuggestions = async () => {
    if (!geminiKey) { addToast('Add your Gemini API key in Settings first', 'error'); return; }
    setResumeLoading(true);
    try {
      const result = await getResumeImprovements(geminiKey, job, profile);
      setResumeSuggestions(result);
      addToast('Resume suggestions ready!', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
    setResumeLoading(false);
  };

  const handleGenerateRoadmap = async () => {
    if (!geminiKey) { addToast('Add your Gemini API key in Settings first', 'error'); return; }
    setRoadmapLoading(true);
    try {
      const result = await generateSkillRoadmap(geminiKey, job, profile);
      setRoadmapData(result);
      addToast('Skill roadmap generated!', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
    setRoadmapLoading(false);
  };

  const displayScore = atsData?.overallScore ?? job.atsScore;
  const scoreColor = displayScore >= 80 ? '#22d3a5' : displayScore >= 65 ? '#6c63ff' : displayScore >= 50 ? '#f59e0b' : '#f87171';

  const statusColors = { new: '#38bdf8', reviewed: '#a78bfa', applied: '#f59e0b', interview: '#22d3a5', offer: '#a3e635', rejected: '#f87171' };

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')} style={{ marginBottom: 'var(--space-5)' }}>
        <ArrowLeft size={14} /> Back to Jobs
      </button>

      {/* Job Header Card */}
      <div className="card" style={{
        marginBottom: 'var(--space-6)',
        background: 'linear-gradient(135deg, rgba(108,99,255,0.08) 0%, rgba(16,22,42,1) 60%)',
      }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
            {/* Logo */}
            <div style={{
              width: 60, height: 60, borderRadius: 'var(--radius-lg)', flexShrink: 0,
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.5rem', color: 'white',
              boxShadow: 'var(--shadow-glow-sm)',
            }}>
              {job.companyLogo}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 4 }}>{job.title}</h1>
              <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 'var(--space-3)' }}>{job.company}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><MapPin size={14} />{job.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><DollarSign size={14} />{job.salary}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><Clock size={14} />{job.postedDate}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><Globe size={14} />{job.source}</span>
              </div>
            </div>

            {/* Score + Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
              <ScoreGauge score={displayScore} size={120} />
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select
                  className="form-select"
                  value={job.status}
                  onChange={e => { updateJobStatus(job.id, e.target.value); addToast('Status updated', 'success'); }}
                  style={{ fontSize: '0.78rem', padding: '4px 10px', width: 'auto', color: statusColors[job.status], borderColor: `${statusColors[job.status]}40` }}
                >
                  {['new', 'reviewed', 'applied', 'interview', 'offer', 'rejected'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <a 
                  href={job.source_url && job.source_url !== '#' ? job.source_url : `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary btn-sm"
                >
                  <ExternalLink size={13} /> Apply
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { id: 'ats', label: '🎯 ATS Score', },
          { id: 'jd', label: '📄 Job Description' },
          { id: 'roadmap', label: '🗺️ Skill Roadmap' },
          { id: 'outreach', label: '✉️ Outreach' },
          { id: 'resume', label: '✨ Resume Tips' },
        ].map(tab => (
          <button key={tab.id} className={`tab-btn${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: ATS Score */}
      {activeTab === 'ats' && (
        <div className="animate-fade-in">
          {!atsData && !atsLoading && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)',
              padding: 'var(--space-12)', textAlign: 'center',
            }}>
              <div style={{
                width: 80, height: 80, background: 'rgba(108,99,255,0.12)', borderRadius: 'var(--radius-xl)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={36} color="var(--color-brand-primary)" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>Run Full ATS Analysis</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: 440 }}>
                  Gemini AI will analyze your resume against this job description and give you a detailed breakdown of your fit score, missing keywords, and exactly how to improve.
                </p>
                {!geminiKey && <p style={{ color: 'var(--color-warning)', fontSize: '0.82rem', marginTop: 8 }}>⚠️ Add your Gemini API key in Settings first</p>}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary btn-lg" onClick={handleATSAnalysis}>
                  <Sparkles size={18} /> Analyze with AI
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => setAtsData({ overallScore: job.atsScore, breakdown: { keywordMatch: 68, skillsOverlap: 76, titleRelevance: 60, experienceFit: 80, educationMatch: 90 }, matchedSkills: job.requiredSkills.slice(0, 4), missingKeywords: job.requiredSkills.slice(4), titleGap: `You have "${profile.currentTitle}" — JD wants "${job.title}"`, experienceNote: `You have ~3 yrs — JD requires ${job.experienceRequired.min}–${job.experienceRequired.max} yrs`, educationNote: `Your BS matches the requirement`, improvements: [`Add "${job.requiredSkills[4] || 'CI/CD'}" to your skills section`, `Use the phrase "${job.title}" in your resume headline`, `Mention Agile/Scrum methodology in your experience bullets`, `Quantify your impact — add numbers to bullet points`], verdict: `Solid candidate with room to improve keyword alignment.` })}>
                  Use Demo Data
                </button>
              </div>
            </div>
          )}

          {atsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
              <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
              <p style={{ color: 'var(--color-text-muted)' }}>Gemini AI is analyzing your resume against this JD…</p>
            </div>
          )}

          {atsData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
              {/* Score Overview */}
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                  <ScoreGauge score={atsData.overallScore} size={160} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--space-2)' }}>
                      Score Breakdown
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>{atsData.verdict}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {[
                        { label: 'Keyword Match (30%)', value: atsData.breakdown.keywordMatch, color: '#6c63ff' },
                        { label: 'Skills Overlap (25%)', value: atsData.breakdown.skillsOverlap, color: '#22d3a5' },
                        { label: 'Title Relevance (20%)', value: atsData.breakdown.titleRelevance, color: '#38bdf8' },
                        { label: 'Experience Fit (15%)', value: atsData.breakdown.experienceFit, color: '#a78bfa' },
                        { label: 'Education Match (10%)', value: atsData.breakdown.educationMatch, color: '#f59e0b' },
                      ].map(b => <ProgressBar key={b.label} {...b} />)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Matched Skills */}
              <div className="card">
                <div className="card-header"><div className="card-title">✅ Matched Skills</div></div>
                <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {atsData.matchedSkills.map(s => (
                    <span key={s} className="skill-chip skill-chip-matched">{s}</span>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="card">
                <div className="card-header"><div className="card-title">❌ Missing Keywords</div></div>
                <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {atsData.missingKeywords.map(s => (
                    <span key={s} className="skill-chip skill-chip-missing">{s}</span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="card">
                <div className="card-header"><div className="card-title">📋 Fit Notes</div></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {[
                    { icon: User, label: 'Title', note: atsData.titleGap },
                    { icon: Clock, label: 'Experience', note: atsData.experienceNote },
                    { icon: FileText, label: 'Education', note: atsData.educationNote },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <item.icon size={16} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{item.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Actions */}
              <div className="card">
                <div className="card-header"><div className="card-title">💡 How to Improve</div></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {atsData.improvements.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: 'rgba(108,99,255,0.15)',
                        color: 'var(--color-brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                      }}>{i + 1}</div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Tab: Skill Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="animate-fade-in">
          {!roadmapData && !roadmapLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)', padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: 'rgba(108,99,255,0.12)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={36} color="var(--color-brand-primary)" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>Generate Learning Roadmap</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: 440 }}>
                  Compare your skills against the job requirements using Gemini AI to identify gaps, prioritize learning, and generate a step-by-step roadmap.
                </p>
                {!geminiKey && <p style={{ color: 'var(--color-warning)', fontSize: '0.82rem', marginTop: 8 }}>⚠️ Add your Gemini API key in Settings first</p>}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary btn-lg" onClick={handleGenerateRoadmap}>
                  <Sparkles size={18} /> Generate with AI
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => setRoadmapData({
                  overallReadiness: 'Almost Ready',
                  strongSkills: job.requiredSkills.slice(0, Math.min(3, job.requiredSkills.length)),
                  skillGaps: (job.requiredSkills.length > 3 ? job.requiredSkills.slice(3) : ['Docker', 'AWS', 'System Design']).map((skill, index) => ({
                    skill,
                    priority: index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low',
                    currentLevel: index === 0 ? 'None' : 'Beginner',
                    targetLevel: 'Intermediate',
                    estimatedWeeks: (index + 1) * 2,
                    learningResources: [
                      `Official ${skill} Documentation`,
                      `Udemy Course on modern ${skill} development`,
                      `Learn ${skill} in 100 Seconds video guide`
                    ]
                  })),
                  suggestedOrder: job.requiredSkills.length > 3 ? job.requiredSkills.slice(3) : ['Docker', 'AWS', 'System Design'],
                  summary: `You have strong qualifications in ${job.requiredSkills.slice(0, 2).join(', ')}, but you need to develop skills in ${job.requiredSkills.length > 3 ? job.requiredSkills.slice(3, 5).join(' and ') : 'Docker and AWS'} to match the job requirements fully. We suggest focusing on ${job.requiredSkills.length > 3 ? job.requiredSkills[3] : 'Docker'} first.`
                })}>
                  Use Demo Data
                </button>
              </div>
            </div>
          )}

          {roadmapLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
              <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
              <p style={{ color: 'var(--color-text-muted)' }}>Analyzing skill gaps and generating learning roadmap…</p>
            </div>
          )}

          {roadmapData && (
            <SkillRoadmap roadmap={roadmapData} />
          )}
        </div>
      )}

      {/* Tab: Job Description */}
      {activeTab === 'jd' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Job Description</div></div>
            <div className="card-body">
              <pre style={{ fontFamily: 'var(--font-body)', whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                {job.description}
              </pre>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Required Skills</div></div>
              <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {job.requiredSkills.map(s => <span key={s} className="skill-chip">{s}</span>)}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Nice to Have</div></div>
              <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {job.preferredSkills.map(s => <span key={s} className="badge badge-neutral">{s}</span>)}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Requirements</div></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: 2 }}>Experience</div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{job.experienceRequired.min}–{job.experienceRequired.max} years</div>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: 2 }}>Education</div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{job.educationRequired}</div>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: 2 }}>Work Type</div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{job.workType}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Outreach */}
      {activeTab === 'outreach' && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>Smart Contact Finder</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {job.contacts.length} contacts found at {job.company}. Generate personalized outreach for each.
            </p>
          </div>
          {job.contacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} job={job} profile={profile} geminiKey={geminiKey} addToast={addToast} />
          ))}
        </div>
      )}

      {/* Tab: Resume Tips */}
      {activeTab === 'resume' && (
        <div className="animate-fade-in">
          {!resumeSuggestions && !resumeLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)', padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: 'rgba(34,211,165,0.1)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={36} color="var(--color-success)" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>Tailor Your Resume for This Role</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: 440 }}>
                  Get AI-powered suggestions to rewrite your resume bullets, add missing keywords, and craft a headline optimized for this specific JD.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary btn-lg" onClick={handleResumeSuggestions}>
                  <Sparkles size={18} /> Get AI Suggestions
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => setResumeSuggestions({
                  rewrittenBullet: {
                    original: 'Built and maintained 10+ React components used by 50K+ users',
                    improved: `Engineered 10+ performant React/TypeScript components using Agile methodology, serving 50K+ users with 40% improvement in load time via REST API optimization`
                  },
                  newBulletSuggestions: [
                    `Implemented CI/CD pipelines reducing deployment time by 60%, collaborating across cross-functional Agile teams`,
                    `Containerized microservices with Docker/Kubernetes, improving scalability and system reliability`,
                  ],
                  headlineSuggestion: `${job.title} | React · TypeScript · REST APIs | 3+ Years Delivering Scalable Web Applications`
                })}>
                  Use Demo Data
                </button>
              </div>
            </div>
          )}

          {resumeLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
              <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
              <p style={{ color: 'var(--color-text-muted)' }}>Generating tailored resume suggestions…</p>
            </div>
          )}

          {resumeSuggestions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Headline */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">📌 Optimized Resume Headline</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(resumeSuggestions.headlineSuggestion).then(() => addToast('Copied!', 'success'))}>
                    <Copy size={13} /> Copy
                  </button>
                </div>
                <div className="card-body">
                  <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                    {resumeSuggestions.headlineSuggestion}
                  </div>
                </div>
              </div>

              {/* Rewritten Bullet */}
              <div className="card">
                <div className="card-header"><div className="card-title">✏️ Rewrite This Bullet</div></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>❌ Original</div>
                    <div style={{ background: 'var(--color-danger-bg)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {resumeSuggestions.rewrittenBullet.original}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>✅ Improved</div>
                    <div style={{ background: 'var(--color-success-bg)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {resumeSuggestions.rewrittenBullet.improved}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => navigator.clipboard.writeText(resumeSuggestions.rewrittenBullet.improved).then(() => addToast('Copied improved bullet!', 'success'))}>
                      <Copy size={13} /> Copy Improved Version
                    </button>
                  </div>
                </div>
              </div>

              {/* New Bullets to Add */}
              <div className="card">
                <div className="card-header"><div className="card-title">➕ Suggested New Bullets to Add</div></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {resumeSuggestions.newBulletSuggestions.map((bullet, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-brand-primary)', flexShrink: 0, marginTop: 1 }}>•</div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', flex: 1, lineHeight: 1.6 }}>{bullet}</span>
                      <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => navigator.clipboard.writeText(bullet).then(() => addToast('Copied!', 'success'))}>
                        <Copy size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
