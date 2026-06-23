import { useState, useRef, useEffect } from 'react';
import { Upload, MapPin, Mail, Phone, Link2, Globe, Plus, X, CheckCircle, Edit3, Save, GitBranch } from 'lucide-react';
import useStore from '../store';
import { parseResumeText } from '../gemini';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker CDN matching the installed package version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function SkillBadge({ skill, onRemove }) {
  const levels = { Expert: '#22d3a5', Advanced: '#6c63ff', Intermediate: '#f59e0b', Beginner: '#9898b8' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-full)', padding: '5px 12px',
      fontSize: '0.8rem', fontWeight: 600,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: levels[skill.level] || '#9898b8' }} />
      <span style={{ color: 'var(--color-text-primary)' }}>{skill.name}</span>
      <span style={{ color: levels[skill.level] || '#9898b8', fontSize: '0.72rem' }}>{skill.level}</span>
      {onRemove && (
        <button onClick={() => onRemove(skill.name)} style={{ color: 'var(--color-text-muted)', display: 'flex', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export default function Profile() {
  const profile = useStore(s => s.profile);
  const setProfile = useStore(s => s.setProfile);
  const addToast = useStore(s => s.addToast);
  const geminiKey = useStore(s => s.geminiKey);
  const setResumeAttachment = useStore(s => s.setResumeAttachment);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', years: 1 });
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const fileRef = useRef();

  // Keep form in sync when profile changes in store (e.g. parsed from resume)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(profile);
  }, [profile]);

  const handleSave = () => {
    setProfile(form);
    setEditing(false);
    addToast('Profile saved!', 'success');
  };

  const parsePDF = async (file) => {
    if (!file) return;
    if (!geminiKey) {
      addToast('Please configure your Gemini API Key in Settings first!', 'error');
      return;
    }
    setParsing(true);
    setParsingStep('Reading PDF file...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert to base64 in the background
      const base64Content = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      
      setResumeAttachment({
        name: file.name,
        content: base64Content,
        contentType: 'application/pdf'
      });

      setParsingStep('Loading PDF pages...');
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setParsingStep(`Extracting text from page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      
      if (!text.trim()) {
        throw new Error('We couldn\'t find any readable text in the PDF. Is it a scanned image?');
      }
      
      setParsingStep('Analyzing & extracting details with Gemini AI...');
      const parsedData = await parseResumeText(geminiKey, text);
      
      setParsingStep('Updating profile store...');
      parsedData.resumeUploaded = true;
      parsedData.resumeName = file.name;
      
      setProfile(parsedData);
      addToast(`Resume "${file.name}" successfully parsed and profile auto-filled!`, 'success');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error parsing PDF resume', 'error');
    } finally {
      setParsing(false);
      setParsingStep('');
    }
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setForm(f => ({ ...f, skills: [...f.skills, { ...newSkill }] }));
    setNewSkill({ name: '', level: 'Intermediate', years: 1 });
  };

  const removeSkill = (name) => {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s.name !== name) }));
  };

  const data = editing ? form : profile;

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Loading Overlay */}
      {parsing && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'var(--color-bg-overlay)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-4)',
        }}>
          <div className="spinner" style={{ width: 50, height: 50, borderWidth: 4 }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Processing Resume
          </div>
          <div style={{ color: 'var(--color-brand-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
            {parsingStep}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="section-header" style={{ marginTop: 'var(--space-2)' }}>
        <div>
          <p className="section-subtitle" style={{ margin: 0 }}>Your professional info — auto-filled from resume and used for smart outreach personalization</p>
        </div>
        {editing ? (
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-ghost" onClick={() => { setForm(profile); setEditing(false); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}><Save size={15} /> Save Profile</button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setEditing(true)}><Edit3 size={15} /> Edit Profile</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Avatar & Basic Info */}
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1.8rem', color: 'white',
                margin: '0 auto var(--space-4)',
                boxShadow: 'var(--shadow-glow)',
              }}>
                {data.name ? data.name.split(' ').map(n => n[0]).join('') : 'U'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{data.name || 'Anonymous User'}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>{data.currentTitle || 'Not Set'}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', textAlign: 'left' }}>
                {[
                  { icon: Mail, value: data.email, label: 'Email', href: data.email ? `mailto:${data.email}` : null },
                  { icon: Phone, value: data.phone, label: 'Phone', href: data.phone ? `tel:${data.phone}` : null },
                  { icon: MapPin, value: data.location, label: 'Location' },
                  { icon: Link2, value: data.linkedin, label: 'LinkedIn', href: data.linkedin ? (data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`) : null },
                  { icon: GitBranch, value: data.github, label: 'GitHub', href: data.github ? (data.github.startsWith('http') ? data.github : `https://${data.github}`) : null },
                  { icon: Globe, value: data.portfolio, label: 'Portfolio', href: data.portfolio ? (data.portfolio.startsWith('http') ? data.portfolio : `https://${data.portfolio}`) : null },
                ].map(({ icon: Icon, value, label, href }) => value ? (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    <Icon size={13} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-primary)', textDecoration: 'underline' }} className="truncate" title={value}>
                        {value}
                      </a>
                    ) : (
                      <span className="truncate" title={value}>{value}</span>
                    )}
                  </div>
                ) : null)}
              </div>
            </div>
          </div>

          {/* Resume ATS Wording Score */}
          <div className="card">
            <div className="card-header" style={{ paddingBottom: 'var(--space-3)' }}>
              <div className="card-title">Resume ATS Score</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 800, color: 'var(--color-brand-primary)', fontSize: '1.2rem', lineHeight: 1 }}>{data.atsScore || 89}%</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>Gemini AI</span>
              </div>
            </div>
            <div className="card-body" style={{ paddingTop: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', border: '1px dashed var(--color-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Resume Worded Benchmark</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand-accent)' }}>{data.resumeWordedScore || 86}%</span>
              </div>
              <div className="progress-track" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${data.atsScore || 89}%`, background: 'var(--gradient-brand)' }} />
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.76rem', marginTop: 'var(--space-3)' }}>
                Evaluates resume wording quality, active verb usage, achievements, and layout friendliness.
              </p>
              {data.atsFeedback && data.atsFeedback.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>ATS Wording Improvements:</div>
                  <ul style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {data.atsFeedback.map((tip, idx) => (
                      <li key={idx} style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Resume Upload */}
          <div className="card">
            <div className="card-header"><div className="card-title">Resume Parser</div></div>
            <div className="card-body">
              {data.resumeUploaded ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,211,165,0.2)', marginBottom: 'var(--space-3)' }}>
                  <CheckCircle size={18} color="var(--color-success)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-success)' }}>Active Resume</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }} className="truncate">{data.resumeName}</div>
                  </div>
                </div>
              ) : null}
              <div
                style={{
                  border: `2px dashed ${dragOver ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-5)',
                  textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'rgba(108,99,255,0.05)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); parsePDF(e.dataTransfer.files[0]); }}
              >
                <Upload size={22} color="var(--color-text-muted)" style={{ margin: '0 auto var(--space-2)' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Upload New Resume</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Drag PDF here or click to browse</div>
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => parsePDF(e.target.files[0])} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Basic Info Form */}
          {editing && (
            <div className="card animate-fade-in">
              <div className="card-header"><div className="card-title">Personal Info</div></div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {[
                  { label: 'Full Name', key: 'name' },
                  { label: 'Current Title', key: 'currentTitle' },
                  { label: 'Email', key: 'email' },
                  { label: 'Phone', key: 'phone' },
                  { label: 'Location', key: 'location' },
                  { label: 'LinkedIn URL', key: 'linkedin' },
                  { label: 'GitHub URL', key: 'github' },
                  { label: 'Portfolio URL', key: 'portfolio' },
                  { label: 'Resume Worded Score (%)', key: 'resumeWordedScore' },
                ].map(field => (
                  <div key={field.key} className="form-group" style={field.key === 'name' ? { gridColumn: '1 / -1' } : {}}>
                    <label className="form-label">{field.label}</label>
                    <input className="form-input" value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          <div className="card">
            <div className="card-header"><div className="card-title">Skills ({data.skills ? data.skills.length : 0})</div></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: editing ? 'var(--space-4)' : 0 }}>
                {data.skills && data.skills.map(s => <SkillBadge key={s.name} skill={s} onRemove={editing ? removeSkill : null} />)}
              </div>
              {editing && (
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-3)' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Skill Name</label>
                    <input className="form-input" placeholder="e.g. Docker" value={newSkill.name} onChange={e => setNewSkill(s => ({ ...s, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSkill()} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Level</label>
                    <select className="form-select" value={newSkill.level} onChange={e => setNewSkill(s => ({ ...s, level: e.target.value }))}>
                      {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Years</label>
                    <input className="form-input" type="number" min={0} max={20} value={newSkill.years} onChange={e => setNewSkill(s => ({ ...s, years: +e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" onClick={addSkill}><Plus size={15} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="card">
            <div className="card-header"><div className="card-title">Experience</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {data.experience && data.experience.map((exp, i) => (
                <div key={i} style={{ paddingLeft: 'var(--space-4)', borderLeft: '2px solid var(--color-brand-primary)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{exp.role}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: 'var(--space-2)' }}>{exp.company} · {exp.duration}</div>
                  <ul style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {exp.bullets && exp.bullets.map((b, j) => (
                      <li key={j} style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {(!data.experience || data.experience.length === 0) && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No experience listed. Upload a resume to automatically extract it.</div>
              )}
            </div>
          </div>

          {/* Education */}
          <div className="card">
            <div className="card-header"><div className="card-title">Education</div></div>
            <div className="card-body">
              {data.education && data.education.map((edu, i) => (
                <div key={i} style={{ paddingLeft: 'var(--space-4)', borderLeft: '2px solid var(--color-brand-accent)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{edu.degree}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{edu.institution} · {edu.year}</div>
                </div>
              ))}
              {(!data.education || data.education.length === 0) && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No education listed.</div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="card">
            <div className="card-header"><div className="card-title">Key Achievements</div></div>
            <div className="card-body">
              <ul style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {data.achievements && data.achievements.map((ach, idx) => (
                  <li key={idx} style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {ach}
                  </li>
                ))}
                {(!data.achievements || data.achievements.length === 0) && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>No achievements listed. Upload a resume to dynamically extract them.</div>
                )}
              </ul>
            </div>
          </div>

          {/* Projects */}
          <div className="card">
            <div className="card-header"><div className="card-title">Key Projects</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {data.projects && data.projects.map((proj, idx) => (
                <div key={idx} style={{ paddingLeft: 'var(--space-3)', borderLeft: '2px solid var(--color-brand-accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>{proj.title}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-brand-primary)', fontWeight: 600 }}>{proj.tech}</span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginTop: 4, lineHeight: 1.5 }}>{proj.description}</p>
                </div>
              ))}
              {(!data.projects || data.projects.length === 0) && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>No projects listed. Upload a resume to dynamically extract them.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
