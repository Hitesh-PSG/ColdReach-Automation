import { useState } from 'react';
import { Key, Eye, EyeOff, Save, CheckCircle, ExternalLink, Mail, User } from 'lucide-react';
import useStore from '../store';
import Profile from './Profile';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const geminiKey = useStore(s => s.geminiKey);
  const setGeminiKey = useStore(s => s.setGeminiKey);
  const addToast = useStore(s => s.addToast);

  const emailjsServiceId = useStore(s => s.emailjsServiceId);
  const emailjsTemplateId = useStore(s => s.emailjsTemplateId);
  const emailjsPublicKey = useStore(s => s.emailjsPublicKey);
  const setEmailjsConfig = useStore(s => s.setEmailjsConfig);

  const smtpConfig = useStore(s => s.smtpConfig);
  const setSmtpConfig = useStore(s => s.setSmtpConfig);

  const [keyInput, setKeyInput] = useState(geminiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);

  const [serviceId, setServiceId] = useState(emailjsServiceId);
  const [templateId, setTemplateId] = useState(emailjsTemplateId);
  const [publicKey, setPublicKey] = useState(emailjsPublicKey);

  // SMTP Settings form state
  const [smtpHost, setSmtpHost] = useState(smtpConfig.host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(smtpConfig.port || '465');
  const [smtpUser, setSmtpUser] = useState(smtpConfig.user || '');
  const [smtpPass, setSmtpPass] = useState(smtpConfig.pass || '');
  const [smtpSenderName, setSmtpSenderName] = useState(smtpConfig.senderName || '');
  const [smtpReplyTo, setSmtpReplyTo] = useState(smtpConfig.replyTo || '');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);

  const handleSave = () => {
    setGeminiKey(keyInput.trim());
    addToast('API key saved!', 'success');
  };

  const handleSaveEmailjs = () => {
    setEmailjsConfig(serviceId.trim(), templateId.trim(), publicKey.trim());
    addToast('EmailJS configuration saved!', 'success');
  };

  const handleSaveSmtp = () => {
    setSmtpConfig({
      host: smtpHost.trim(),
      port: smtpPort.trim(),
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      senderName: smtpSenderName.trim(),
      replyTo: smtpReplyTo.trim(),
    });
    addToast('SMTP credentials saved!', 'success');
  };

  const handleTestSmtp = async () => {
    if (!smtpUser.trim() || !smtpPass.trim()) {
      addToast('SMTP username and password are required to test connection.', 'error');
      return;
    }
    setTestingSmtp(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig: {
            host: smtpHost.trim(),
            port: smtpPort.trim(),
            user: smtpUser.trim(),
            pass: smtpPass.trim(),
            senderName: smtpSenderName.trim() || 'JobReach Test',
            replyTo: smtpReplyTo.trim(),
          },
          emailData: {
            to: smtpUser.trim(),
            subject: 'JobReach SMTP Connection Test 🚀',
            body: `Hello! If you are reading this email, it means your SMTP configuration in JobReach is successfully working.

Sender Name: ${smtpSenderName || smtpUser}
Host: ${smtpHost}
Port: ${smtpPort}
Time: ${new Date().toLocaleString()}

Happy cold emailing!
- The JobReach Team`,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('SMTP Connection Test Successful! Check your inbox. ✉️', 'success');
      } else {
        addToast(`SMTP Connection Failed: ${data.error}`, 'error');
      }
    } catch (e) {
      addToast('SMTP connection error: ' + e.message, 'error');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTest = async () => {
    if (!keyInput.trim()) { addToast('Enter a key first', 'error'); return; }
    setTesting(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${keyInput.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say "OK" in one word.' }] }] }),
      });
      if (res.ok) {
        setTested(true);
        addToast('API key is valid! ✅', 'success');
      } else {
        const err = await res.json();
        const msg = err.error?.message || 'Gemini API error';
        if (msg.includes('not found') || msg.includes('ModelService') || msg.includes('API key')) {
          addToast('Invalid key: Please make sure you created your API key in Google AI Studio (aistudio.google.com) and enabled the "Generative Language API" in your project.', 'error');
        } else {
          addToast(`Invalid key: ${msg}`, 'error');
        }
      }
    } catch (e) {
      addToast('Connection error: ' + e.message, 'error');
    }
    setTesting(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 className="section-title">Settings</h2>
          <p className="section-subtitle">Configure your personal profile, resume parser, and API connections</p>
        </div>
      </div>

      <div className="tabs animate-fade-in" style={{ marginBottom: 'var(--space-6)', maxWidth: '360px', padding: '4px' }}>
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} 
          onClick={() => setActiveTab('profile')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '50%' }}
        >
          <User size={14} /> Profile & Resume
        </button>
        <button 
          className={`tab-btn ${activeTab === 'integrations' ? 'active' : ''}`} 
          onClick={() => setActiveTab('integrations')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '50%' }}
        >
          <Key size={14} /> Integrations
        </button>
      </div>

      {activeTab === 'profile' ? (
        <Profile />
      ) : (
        <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Gemini API Key */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 38, height: 38, background: 'rgba(108,99,255,0.12)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={18} color="var(--color-brand-primary)" />
                </div>
                <div>
                  <div className="card-title">Google Gemini API Key</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Used for ATS analysis, email drafting & resume parsing</div>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-4)', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-info)', lineHeight: 1.6 }}>
                📌 Get your free Gemini API key at{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-secondary)', textDecoration: 'underline', fontWeight: 600 }}>
                  aistudio.google.com <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>
                . The key is stored locally in your browser and never sent to any server other than Google's API.
              </div>

              <div className="form-group">
                <label className="form-label">API Key</label>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showKey ? 'text' : 'password'}
                      placeholder="AIza..."
                      value={keyInput}
                      onChange={e => { setKeyInput(e.target.value); setTested(false); }}
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button className="btn btn-ghost" onClick={handleTest} disabled={testing}>
                    {testing ? <span className="spinner" style={{ width: 16, height: 16 }} /> : tested ? <CheckCircle size={16} color="var(--color-success)" /> : 'Test'}
                  </button>
                  <button className="btn btn-primary" onClick={handleSave}>
                    <Save size={15} /> Save
                  </button>
                </div>
                <div className="form-hint">Key is saved to localStorage — never leaves your browser.</div>
              </div>

              {geminiKey && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-success)' }}>
                  <CheckCircle size={14} /> API key is configured
                </div>
              )}
            </div>
          </div>

          {/* EmailJS Configuration */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 38, height: 38, background: 'rgba(34,211,165,0.12)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} color="var(--color-success)" />
                </div>
                <div>
                  <div className="card-title">EmailJS Configuration</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Send cold emails directly from your browser</div>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-4)', background: 'rgba(34,211,165,0.06)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                💡 Set up a free account at{' '}
                <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-success)', textDecoration: 'underline', fontWeight: 600 }}>
                  emailjs.com <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>
                . Create a Gmail service, add a template, and map variables:
                <code style={{ display: 'block', background: 'var(--color-bg-base)', padding: '8px 12px', borderRadius: 6, marginTop: 8, fontSize: '0.78rem', fontFamily: 'monospace', border: '1px solid var(--color-border)' }}>
                  Subject: {"{{subject}}"} <br />
                  Body: {"{{message}}"} <br />
                  To Email: {"{{to_email}}"} <br />
                  To Name: {"{{to_name}}"} <br />
                  From Name: {"{{from_name}}"} <br />
                  Reply To: {"{{reply_to}}"}
                </code>
              </div>

              <div className="form-group">
                <label className="form-label">Service ID</label>
                <input
                  className="form-input"
                  placeholder="service_xxxxx"
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Template ID</label>
                <input
                  className="form-input"
                  placeholder="template_xxxxx"
                  value={templateId}
                  onChange={e => setTemplateId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Public Key</label>
                <input
                  className="form-input"
                  placeholder="user_xxxxxxxxxxxxxxxx"
                  value={publicKey}
                  onChange={e => setPublicKey(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" onClick={handleSaveEmailjs} style={{ alignSelf: 'flex-start' }}>
                <Save size={15} /> Save EmailJS Credentials
              </button>
            </div>
          </div>

          {/* SMTP Direct Email Credentials */}
          <div className="card animate-fade-in">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 38, height: 38, background: 'rgba(108,99,255,0.12)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} color="var(--color-brand-primary)" />
                </div>
                <div>
                  <div className="card-title">SMTP Direct Email Credentials</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Send cold emails directly from your personal email via SMTP</div>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-4)', background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                💡 <strong>For Gmail:</strong> Enable 2-Step Verification on your Google Account and create an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-secondary)', textDecoration: 'underline', fontWeight: 600 }}>App Password</a>, then enter the 16-character code as the SMTP password.
              </div>

              <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">SMTP Host</label>
                  <input
                    className="form-input"
                    placeholder="e.g. smtp.gmail.com"
                    value={smtpHost}
                    onChange={e => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SMTP Port</label>
                  <input
                    className="form-input"
                    placeholder="e.g. 465 (SSL) or 587 (TLS)"
                    value={smtpPort}
                    onChange={e => setSmtpPort(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">SMTP Username (Email Address)</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="e.g. alex.johnson@gmail.com"
                    value={smtpUser}
                    onChange={e => setSmtpUser(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SMTP Password / App Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showSmtpPass ? 'text' : 'password'}
                      placeholder="Enter SMTP password"
                      value={smtpPass}
                      onChange={e => setSmtpPass(e.target.value)}
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                    >
                      {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Sender Name (Optional)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Alex Johnson"
                    value={smtpSenderName}
                    onChange={e => setSmtpSenderName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reply-To Email (Optional)</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="e.g. alex@customdomain.com"
                    value={smtpReplyTo}
                    onChange={e => setSmtpReplyTo(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button className="btn btn-primary" onClick={handleSaveSmtp}>
                  <Save size={15} /> Save SMTP Credentials
                </button>
                <button className="btn btn-ghost" onClick={handleTestSmtp} disabled={testingSmtp}>
                  {testingSmtp ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14 }} />
                      Testing Connection...
                    </>
                  ) : 'Test SMTP Connection'}
                </button>
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div className="card">
            <div className="card-header"><div className="card-title">What AI Powers</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { label: 'Resume Parser', desc: 'Auto-fills profile sections (skills, experience, contact info) from uploaded PDFs', icon: '📝', status: 'powered' },
                { label: 'ATS Score Analysis', desc: 'Gemini reads your resume + JD and gives a detailed fit score with breakdown', icon: '🎯', status: 'powered' },
                { label: 'Cold Email Drafting', desc: 'Personalized cold emails written by AI based on contact + job context', icon: '✉️', status: 'powered' },
                { label: 'LinkedIn DM Drafting', desc: 'Short, human-sounding connection messages tailored to each recruiter', icon: '💬', status: 'powered' },
                { label: 'Resume Improvement Tips', desc: 'Rewrites your bullets and headline to match the specific JD keywords', icon: '✨', status: 'powered' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{f.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{f.desc}</div>
                  </div>
                  <span className={`badge ${f.status === 'powered' ? 'badge-success' : 'badge-warning'}`} style={{ flexShrink: 0 }}>
                    {f.status === 'powered' ? 'Live' : 'Coming Soon'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="card">
            <div className="card-header"><div className="card-title">About JobReach</div></div>
            <div className="card-body">
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
                JobReach is a smart job search assistant that aggregates openings, scores your resume against ATS systems, finds the right contacts at target companies, and drafts personalized outreach — all from one place.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">v1.0.0-beta</span>
                <span className="badge badge-neutral">React + Vite</span>
                <span className="badge badge-neutral">Gemini AI</span>
                <span className="badge badge-neutral">Zustand</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
