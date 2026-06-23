import { useState, useEffect, useRef } from 'react';
import { Mail, User, Trash2, Send, Plus, Search, FileText, Check, Sparkles, Clipboard, X, ArrowUpRight, Play, Pause, AlertTriangle, Settings, Save } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import useStore from '../store';
import { draftGenericColdEmail, parseContactsWithGemini } from '../gemini';
import emailjs from '@emailjs/browser';

export default function Outreach() {
  const profile = useStore(s => s.profile);
  const geminiKey = useStore(s => s.geminiKey);
  const addToast = useStore(s => s.addToast);
  const contacts = useStore(s => s.contacts);
  const addContacts = useStore(s => s.addContacts);
  const deleteContact = useStore(s => s.deleteContact);
  const outreachHistory = useStore(s => s.outreachHistory);
  const addOutreachLog = useStore(s => s.addOutreachLog);
  const resumeAttachment = useStore(s => s.resumeAttachment);
  const setResumeAttachment = useStore(s => s.setResumeAttachment);
  const clearResumeAttachment = useStore(s => s.clearResumeAttachment);

  // EmailJS keys from store
  const emailjsServiceId = useStore(s => s.emailjsServiceId);
  const emailjsTemplateId = useStore(s => s.emailjsTemplateId);
  const emailjsPublicKey = useStore(s => s.emailjsPublicKey);
  const smtpConfig = useStore(s => s.smtpConfig);

  // Search & Pagination / Selection State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [targetRole, setTargetRole] = useState(profile.currentTitle || 'Software Engineer');

  // Input states for custom forms
  const [manualContact, setManualContact] = useState({ name: '', email: '', title: '', company: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkForm, setShowBulkForm] = useState(false);

  // Generation & Editing State
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  // --- Bulk Campaign State ---
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'
  const [bulkRawText, setBulkRawText] = useState('');
  const [parsedList, setParsedList] = useState([]);
  const [parsingEngine, setParsingEngine] = useState('local'); // 'local' or 'ai'
  const [parsingLoader, setParsingLoader] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState({}); // id -> boolean

  // Templates
  const [templateSubject, setTemplateSubject] = useState('Opportunities at {{company}} - {{sender_name}}');
  const [templateBody, setTemplateBody] = useState(
`Dear {{name}},

I hope this email finds you well.

I am reaching out because I am very interested in the {{title}} opportunities at {{company}}. I have been following {{company}}'s work, and I am inspired by your team's focus on innovation.

As a ${profile.currentTitle || 'developer'} with experience in ${profile.skills?.slice(0, 3).map(s => s.name).join(', ') || 'software development'}, I would love to connect for a quick 10-minute virtual chat to learn more about your hiring needs and share how my background could contribute to your engineering goals.

You can view my professional profiles here:
LinkedIn: {{sender_linkedin}}
GitHub: {{sender_github}}

Thank you for your time, and I look forward to connecting.

Best regards,
{{sender_name}}
{{sender_email}} | {{sender_phone}}`
  );

  // Campaign sending settings
  const [sendingEngine, setSendingEngine] = useState('smtp'); // 'smtp', 'emailjs', 'mailto'
  const [sendingDelay, setSendingDelay] = useState(3); // delay in seconds

  // Campaign Runner state
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [campaignPaused, setCampaignPaused] = useState(false);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [campaignLogs, setCampaignLogs] = useState([]);
  const [campaignStats, setCampaignStats] = useState({ total: 0, sent: 0, failed: 0 });

  // Refs for tracking mutable variables in bulk send loop
  const campaignIndexRef = useRef(0);
  const campaignRunningRef = useRef(false);
  const campaignPausedRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    campaignRunningRef.current = campaignRunning;
  }, [campaignRunning]);

  useEffect(() => {
    campaignPausedRef.current = campaignPaused;
  }, [campaignPaused]);

  useEffect(() => {
    campaignIndexRef.current = campaignIndex;
  }, [campaignIndex]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(c => {
    const s = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.company.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.title.toLowerCase().includes(s)
    );
  });

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    // Reset drafted state
    setSubject('');
    setEmailBody('');
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualContact.name || !manualContact.email || !manualContact.company) {
      addToast('Name, Email, and Company are required.', 'error');
      return;
    }
    addContacts([manualContact]);
    addToast('HR Contact added successfully!', 'success');
    // Select the newly added contact
    handleSelectContact(manualContact);
    setManualContact({ name: '', email: '', title: '', company: '' });
    setShowManualForm(false);
  };

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) {
      addToast('Paste some rows first', 'error');
      return;
    }
    // Parse Google Sheets pasted rows (Tab-separated values or Comma-separated)
    const lines = bulkInput.split('\n');
    const parsed = [];
    lines.forEach(line => {
      if (!line.trim()) return;
      // Split by tab first, fallback to comma
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(',');
      
      // Clean components
      const cleaned = parts.map(p => p.trim());
      
      let name = '';
      let email = '';
      let title = '';
      let company = '';

      if (cleaned.length >= 5) {
        // format matches: SNo | Name | Email | Title | Company
        // check if first item is a number (SNo)
        const isSNo = !isNaN(cleaned[0]);
        name = isSNo ? cleaned[1] : cleaned[0];
        email = isSNo ? cleaned[2] : cleaned[1];
        title = isSNo ? cleaned[3] : cleaned[2];
        company = isSNo ? cleaned[4] : cleaned[3];
      } else if (cleaned.length === 4) {
        // Name | Email | Title | Company
        name = cleaned[0];
        email = cleaned[1];
        title = cleaned[2];
        company = cleaned[3];
      } else if (cleaned.length === 3) {
        // Name | Email | Company
        name = cleaned[0];
        email = cleaned[1];
        company = cleaned[2];
      } else if (cleaned.length === 2) {
        // Name | Email
        name = cleaned[0];
        email = cleaned[1];
      }

      // Very loose email verification
      if (email.includes('@')) {
        parsed.push({
          name: name || 'HR Recruiter',
          email,
          title: title || 'HR Lead',
          company: company || 'Target Company'
        });
      }
    });

    if (parsed.length === 0) {
      addToast('No valid contacts found. Make sure emails are present.', 'error');
      return;
    }

    addContacts(parsed);
    addToast(`Successfully imported ${parsed.length} contacts!`, 'success');
    setBulkInput('');
    setShowBulkForm(false);
  };

  const handleGenerate = async () => {
    if (!geminiKey) {
      addToast('Please enter your Gemini API Key in Settings first.', 'error');
      return;
    }
    if (!selectedContact) {
      addToast('Please select a recipient contact first.', 'error');
      return;
    }
    setLoading(true);
    try {
      const fullResponse = await draftGenericColdEmail(geminiKey, selectedContact, profile, targetRole);
      
      // Parse subject line out of prompt response
      let sub = `Intriguing outreach to ${selectedContact.company}`;
      let body = fullResponse;
      
      const subjectMatch = fullResponse.match(/Subject:\s*(.*)/i);
      if (subjectMatch) {
        sub = subjectMatch[1].trim();
        // Remove the subject line from body
        body = fullResponse.replace(/Subject:\s*(.*)/i, '').trim();
      }
      
      setSubject(sub);
      setEmailBody(body);
      addToast('Personalized email generated!', 'success');
    } catch (err) {
      addToast(err.message || 'Error generating email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMailto = () => {
    if (!selectedContact) return;
    const mailtoUrl = `mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');

    // Add to history log
    addOutreachLog({
      contactName: selectedContact.name,
      contactEmail: selectedContact.email,
      company: selectedContact.company,
      targetRole: targetRole,
      method: 'Mail Client',
      status: 'Sent (Mailto)'
    });
    addToast('Opened default mail client! logged in history.', 'success');
  };

  const handleSendSMTP = async () => {
    if (!selectedContact) return;
    const email = selectedContact.email?.trim() || '';
    const atIdx = email.indexOf('@');
    if (!email || atIdx === -1 || !email.slice(atIdx + 1).includes('.') || email.slice(atIdx + 1).split('.').pop().length < 2) {
      addToast(`Typos or invalid email format detected: "${email}". Please verify the domain (e.g., ".com").`, 'error');
      return;
    }
    if (!smtpConfig.user || !smtpConfig.pass) {
      addToast('SMTP credentials are not configured in Settings.', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          emailData: {
            to: selectedContact.email,
            subject: subject,
            body: autoLinkHTML(emailBody),
            attachments: resumeAttachment ? [resumeAttachment] : []
          }
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'SMTP Error');
      }

      addOutreachLog({
        contactName: selectedContact.name,
        contactEmail: selectedContact.email,
        company: selectedContact.company,
        targetRole: targetRole,
        method: 'Direct (SMTP)',
        status: 'Delivered'
      });
      addToast(`Email successfully delivered to ${selectedContact.name} via SMTP! ✉️`, 'success');
      
      setSelectedContact(null);
      setSubject('');
      setEmailBody('');
    } catch (err) {
      console.error(err);
      addToast(`Delivery failed: ${err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendEmailJS = async () => {
    if (!selectedContact) return;
    const email = selectedContact.email?.trim() || '';
    const atIdx = email.indexOf('@');
    if (!email || atIdx === -1 || !email.slice(atIdx + 1).includes('.') || email.slice(atIdx + 1).split('.').pop().length < 2) {
      addToast(`Typos or invalid email format detected: "${email}". Please verify the domain (e.g., ".com").`, 'error');
      return;
    }
    if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
      addToast('EmailJS is not fully configured in Settings.', 'error');
      return;
    }
    setSending(true);
    try {
      const templateParams = {
        to_name: selectedContact.name,
        to_email: selectedContact.email,
        from_name: profile.name,
        reply_to: profile.email,
        subject: subject,
        message: autoLinkHTML(emailBody),
        company: selectedContact.company,
        role: targetRole,
      };

      await emailjs.send(emailjsServiceId, emailjsTemplateId, templateParams, emailjsPublicKey);
      
      // Log successful send
      addOutreachLog({
        contactName: selectedContact.name,
        contactEmail: selectedContact.email,
        company: selectedContact.company,
        targetRole: targetRole,
        method: 'Direct (EmailJS)',
        status: 'Delivered'
      });
      addToast(`Email successfully delivered to ${selectedContact.name}! ✉️`, 'success');
      // Clear active workspace
      setSelectedContact(null);
      setSubject('');
      setEmailBody('');
    } catch (err) {
      console.error(err);
      addToast(`Delivery failed: ${err.text || err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  // --- Smart Local Heuristics List Parser ---
  const parseBulkInputHeuristically = (inputText) => {
    if (!inputText.trim()) return [];
    const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
    
    const blocks = [];
    let currentBlock = [];
    
    lines.forEach(line => {
      const hasEmail = line.includes('@');
      const currentBlockHasEmail = currentBlock.some(l => l.includes('@'));
      const startsWithNumber = /^\s*\d+\s+[A-Z]/.test(line) || /^\s*\d+\s*$/.test(line);
      
      // Split block if line starts with a number or if we see another email address
      if (startsWithNumber || (hasEmail && currentBlockHasEmail)) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
        }
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    });
    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }
    
    const parsedContacts = [];
    
    blocks.forEach(block => {
      const tokens = block.split(/\s+/).filter(Boolean);
      let emailIdx = tokens.findIndex(t => t.includes('@'));
      if (emailIdx === -1) {
        emailIdx = tokens.findIndex(t => t.toLowerCase().includes('at') && (t.endsWith('.com') || t.endsWith('.in')));
      }
      
      if (emailIdx === -1) return;
      
      let email = tokens[emailIdx];
      
      // Reconstruct domain split wrap
      if (emailIdx + 1 < tokens.length) {
        const nextToken = tokens[emailIdx + 1];
        const hasValidTld = /\.[a-zA-Z]{2,6}$/.test(email);
        if (!hasValidTld && (/^[a-zA-Z0-9.-]+$/.test(nextToken) || nextToken.startsWith('.'))) {
          email = (email + nextToken).replace(/\s+/g, '');
          tokens.splice(emailIdx + 1, 1);
        }
      }
      
      email = email.replace(/[.,;:!]$/, '').replace(/\s/g, '');
      
      let nameTokens = tokens.slice(0, emailIdx);
      if (nameTokens.length > 0 && /^\d+$/.test(nameTokens[0])) {
        nameTokens.shift();
      }
      
      let name = nameTokens.join(' ');
      if (!name) {
        // Fallback: extract name from email username (e.g. sarah.chen -> Sarah Chen)
        const username = email.split('@')[0];
        name = username
          .split(/[._-]/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      
      const afterTokens = tokens.slice(emailIdx + 1);
      const afterText = afterTokens.join(' ');
      
      const titleKeywords = [
        'hr', 'recruiter', 'talent', 'acquisition', 'head', 'vp', 'director', 
        'president', 'manager', 'people', 'culture', 'lead', 'officer', 'general',
        'generalist', 'operations', 'partner', 'specialist', 'human', 'resources',
        'chief', 'avp', 'associate', 'vice', 'recruitment', 'sourcing', 'ops',
        'executive', 'coordinator'
      ];
      const connectors = ['of', 'and', '&', '-', 'for', 'in', '|', '/'];
      
      const afterWords = afterText.split(/\s+/).filter(Boolean);
      const titleWords = [];
      const companyWords = [];
      let companyStarted = false;
      
      afterWords.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        const isTitleWord = titleKeywords.includes(cleanWord) || connectors.includes(word.toLowerCase()) || /^\W+$/.test(word);
        
        if (isTitleWord && !companyStarted) {
          titleWords.push(word);
        } else {
          companyStarted = true;
          companyWords.push(word);
        }
      });
      
      let title = titleWords.join(' ').replace(/[,;:-]$/, '').trim();
      let company = companyWords.join(' ').replace(/[,;:-]$/, '').trim();
      
      if (!title) title = 'HR Manager';
      if (!company) company = 'Target Company';
      
      parsedContacts.push({
        id: 'parsed_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        title,
        company
      });
    });
    
    return parsedContacts;
  };

  // --- Parsing List Handler ---
  const handleParseList = async () => {
    if (!bulkRawText.trim()) {
      addToast('Please paste a contact list first.', 'error');
      return;
    }
    setParsingLoader(true);
    try {
      let parsed = [];
      if (parsingEngine === 'ai') {
        if (!geminiKey) {
          addToast('Gemini API key is required for AI Parsing. Go to Settings.', 'error');
          setParsingLoader(false);
          return;
        }
        parsed = await parseContactsWithGemini(geminiKey, bulkRawText);
      } else {
        parsed = parseBulkInputHeuristically(bulkRawText);
      }

      if (parsed.length === 0) {
        addToast('No valid contacts could be parsed. Check the text format.', 'error');
      } else {
        const withIds = parsed.map(c => ({
          id: c.id || 'parsed_' + Math.random().toString(36).substr(2, 9),
          ...c
        }));
        setParsedList(withIds);
        
        // Select all by default
        const initialSelected = {};
        withIds.forEach(c => { initialSelected[c.id] = true; });
        setSelectedContacts(initialSelected);

        addToast(`Successfully parsed ${withIds.length} contacts!`, 'success');
      }
    } catch (e) {
      console.error(e);
      addToast('Parsing error: ' + e.message, 'error');
    } finally {
      setParsingLoader(false);
    }
  };

  const handleEditParsedContact = (id, field, value) => {
    setParsedList(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleDeleteParsedContact = (id) => {
    setParsedList(prev => prev.filter(c => c.id !== id));
    setSelectedContacts(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleAddParsedContact = () => {
    const newId = 'parsed_' + Math.random().toString(36).substr(2, 9);
    const newContact = {
      id: newId,
      name: 'New Contact',
      email: 'recruiter@company.com',
      title: 'HR Manager',
      company: 'Company Name'
    };
    setParsedList(prev => [...prev, newContact]);
    setSelectedContacts(prev => ({ ...prev, [newId]: true }));
  };

  const handleSaveToGlobalDirectory = () => {
    const selected = parsedList.filter(c => selectedContacts[c.id]);
    if (selected.length === 0) {
      addToast('No contacts selected.', 'error');
      return;
    }
    const contactsToSave = selected.map(c => ({
      name: c.name,
      email: c.email,
      title: c.title,
      company: c.company
    }));
    addContacts(contactsToSave);
    addToast(`Saved ${selected.length} contacts to global directory!`, 'success');
  };

  // --- Resume Attachment Uploader UI Component ---
  const renderAttachmentSection = () => {
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
        addToast('Only PDF files are supported.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setResumeAttachment({
          name: file.name,
          content: base64,
          contentType: 'application/pdf'
        });
        addToast(`Attached resume: ${file.name}`, 'success');
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="form-group" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between', marginBottom: 6 }}>
          <span>Resume Attachment (PDF)</span>
          {resumeAttachment && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>Ready to send</span>
          )}
        </label>
        {resumeAttachment ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '8px 12px'
          }}>
            <FileText size={16} color="var(--color-brand-primary)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }} className="truncate">
                {resumeAttachment.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                PDF Attachment
              </div>
            </div>
            <button
              onClick={clearResumeAttachment}
              className="btn btn-ghost btn-sm btn-danger"
              style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Remove Attachment"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => document.getElementById('outreach-resume-file').click()}
            style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: '12px',
              textAlign: 'center', cursor: 'pointer',
              background: 'transparent',
              transition: 'all var(--transition-fast)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <Plus size={16} color="var(--color-text-muted)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Attach Resume PDF
            </span>
            <input
              id="outreach-resume-file"
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>
    );
  };

  const autoLinkHTML = (text) => {
    if (!text) return '';
    
    // Split by HTML tags so we don't touch existing anchor tags or other HTML elements
    const parts = text.split(/(<[^>]+>)/);
    
    const processedParts = parts.map((part, index) => {
      // If it is an HTML tag (odd index), leave it untouched
      if (index % 2 === 1) {
        return part;
      }
      
      if (!part) return '';
      
      // First, strip leading braces/brackets: {{https://... or {github.com/...
      let cleaned = part.replace(/[{[]+(https?:\/\/|www\.|github\.com\/|linkedin\.com\/)/g, '$1');
      
      // Strip trailing braces/brackets: https://...}} or github.com/...}
      cleaned = cleaned.replace(/(https?:\/\/[^\s{}<>[\]"]+|www\.[^\s{}<>[\]"]+|github\.com\/[^\s{}<>[\]"]+|linkedin\.com\/[^\s{}<>[\]"]+)[}\]]+/g, '$1');
      
      // Auto-link any URLs starting with http://, https://, www., github.com/, or linkedin.com/
      return cleaned.replace(/(https?:\/\/[^\s{}<>[\]"]+|www\.[^\s{}<>[\]"]+|github\.com\/[^\s{}<>[\]"]+|linkedin\.com\/[^\s{}<>[\]"]+)/g, (url) => {
        const href = url.startsWith('http') ? url : `https://${url}`;
        let label = url;
        if (url.includes('github.com')) {
          label = 'GitHub';
        } else if (url.includes('linkedin.com')) {
          label = 'LinkedIn';
        }
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: var(--color-brand-primary); text-decoration: underline; font-weight: 600;">${label}</a>`;
      });
    });
    
    return processedParts.join('');
  };

  // --- Real-time Template Variables Replacer ---
  const replaceTags = (text, contact) => {
    const formatLink = (url, label) => {
      if (!url) return '';
      const href = url.startsWith('http') ? url : `https://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: var(--color-brand-primary); text-decoration: underline; font-weight: 600;">${label}</a>`;
    };

    const replaced = text
      .replace(/\{\{name\}\}/g, contact.name)
      .replace(/\{\{company\}\}/g, contact.company)
      .replace(/\{\{title\}\}/g, contact.title)
      .replace(/\{\{sender_name\}\}/g, profile.name || 'Alex Johnson')
      .replace(/\{\{sender_email\}\}/g, profile.email || 'alex.johnson@gmail.com')
      .replace(/\{\{sender_phone\}\}/g, profile.phone || '')
      .replace(/\{\{sender_linkedin\}\}/g, formatLink(profile.linkedin, 'LinkedIn'))
      .replace(/\{\{sender_github\}\}/g, formatLink(profile.github, 'GitHub'));

    return autoLinkHTML(replaced);
  };

  const getPreviewText = () => {
    const selectedList = parsedList.filter(c => selectedContacts[c.id]);
    const firstContact = selectedList[0] || parsedList[0] || {
      name: 'John Doe',
      email: 'john.doe@company.com',
      title: 'Talent Acquisition',
      company: 'Target Company'
    };

    return {
      to: firstContact.email,
      subject: replaceTags(templateSubject, firstContact),
      body: replaceTags(templateBody, firstContact)
    };
  };

  const preview = getPreviewText();

  // --- Campaign Executor Log ---
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCampaignLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // --- Individual Email Dispatch Handler ---
  const executeSend = async (contact) => {
    const email = contact.email?.trim() || '';
    const atIdx = email.indexOf('@');
    if (!email || atIdx === -1 || !email.slice(atIdx + 1).includes('.') || email.slice(atIdx + 1).split('.').pop().length < 2) {
      throw new Error(`Invalid email address or typo detected: "${email}". Check for missing ".com".`);
    }
    const targetSubject = replaceTags(templateSubject, contact);
    const targetBody = replaceTags(templateBody, contact);

    if (sendingEngine === 'smtp') {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          emailData: {
            to: contact.email,
            subject: targetSubject,
            body: targetBody,
            attachments: resumeAttachment ? [resumeAttachment] : []
          }
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'SMTP Error');
      }
    } else if (sendingEngine === 'emailjs') {
      const templateParams = {
        to_name: contact.name,
        to_email: contact.email,
        from_name: profile.name,
        reply_to: profile.email,
        subject: targetSubject,
        message: targetBody,
        company: contact.company,
        role: contact.title
      };
      await emailjs.send(emailjsServiceId, emailjsTemplateId, templateParams, emailjsPublicKey);
    } else if (sendingEngine === 'mailto') {
      const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(targetSubject)}&body=${encodeURIComponent(targetBody)}`;
      window.open(mailtoUrl, '_blank');
    }
  };

  // --- Loop Step Runner ---
  const runCampaignStep = async (targets) => {
    if (!campaignRunningRef.current) return;
    if (campaignPausedRef.current) {
      addLog('Campaign paused.');
      return;
    }

    const idx = campaignIndexRef.current;
    if (idx >= targets.length) {
      addLog('Campaign completed! 🎉');
      setCampaignRunning(false);
      return;
    }

    const contact = targets[idx];
    addLog(`[${idx + 1}/${targets.length}] Dispatching email to ${contact.name} (${contact.email})...`);
    
    try {
      await executeSend(contact);
      
      // Log successful outreach in store
      addOutreachLog({
        contactName: contact.name,
        contactEmail: contact.email,
        company: contact.company,
        targetRole: contact.title,
        method: sendingEngine === 'smtp' ? 'SMTP Direct' : sendingEngine === 'emailjs' ? 'EmailJS' : 'mailto client',
        status: 'Delivered'
      });

      addLog(`[${idx + 1}/${targets.length}] SUCCESS to ${contact.name}.`);
      setCampaignStats(prev => ({ ...prev, sent: prev.sent + 1 }));
    } catch (error) {
      console.error(error);
      addLog(`[${idx + 1}/${targets.length}] FAILED: ${error.message}`);
      setCampaignStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    }

    const nextIdx = idx + 1;
    setCampaignIndex(nextIdx);
    campaignIndexRef.current = nextIdx;

    if (nextIdx < targets.length && campaignRunningRef.current) {
      addLog(`Waiting ${sendingDelay} seconds before next email...`);
      setTimeout(() => {
        runCampaignStep(targets);
      }, sendingDelay * 1000);
    } else if (nextIdx >= targets.length) {
      addLog('Campaign completed! 🎉');
      setCampaignRunning(false);
    }
  };

  // --- Campaign Control Triggers ---
  const startCampaign = () => {
    const targets = parsedList.filter(c => selectedContacts[c.id]);
    if (targets.length === 0) {
      addToast('Please select at least one contact to start campaign.', 'error');
      return;
    }

    if (sendingEngine === 'smtp' && (!smtpConfig.user || !smtpConfig.pass)) {
      addToast('SMTP credentials are not configured. Go to Settings first.', 'error');
      return;
    }
    if (sendingEngine === 'emailjs' && (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey)) {
      addToast('EmailJS keys are not configured. Go to Settings first.', 'error');
      return;
    }

    setCampaignRunning(true);
    setCampaignPaused(false);
    setCampaignIndex(0);
    setCampaignStats({ total: targets.length, sent: 0, failed: 0 });
    setCampaignLogs([]);
    
    addLog(`Campaign launched for ${targets.length} recipients.`);
    campaignIndexRef.current = 0;
    
    setTimeout(() => {
      runCampaignStep(targets);
    }, 100);
  };

  const pauseCampaign = () => {
    setCampaignPaused(true);
    addLog('Requesting pause...');
  };

  const resumeCampaign = () => {
    setCampaignPaused(false);
    addLog('Resuming campaign...');
    const targets = parsedList.filter(c => selectedContacts[c.id]);
    setTimeout(() => {
      runCampaignStep(targets);
    }, 300);
  };

  const stopCampaign = () => {
    setCampaignRunning(false);
    setCampaignPaused(false);
    addLog('Campaign aborted by user.');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 className="section-title">Outreach Hub</h2>
          <p className="section-subtitle">Auto-generate hyper-tailored cold emails and send them directly to hiring managers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs animate-fade-in" style={{ marginBottom: 'var(--space-6)', maxWidth: '360px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '4px' }}>
        <button 
          className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`} 
          onClick={() => setActiveTab('single')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '50%' }}
        >
          <User size={14} /> Single Recipient
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`} 
          onClick={() => setActiveTab('bulk')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '50%' }}
        >
          <Send size={14} /> Bulk Campaign
        </button>
      </div>

      {activeTab === 'bulk' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }} className="animate-fade-in">
          {/* Left Column: Import and Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Contact Parser Card */}
            <div className="card animate-fade-in">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clipboard size={16} color="var(--color-brand-primary)" />
                  Step 1: Import Recruiter Contacts List
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {parsedList.length === 0 ? (
                  <>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      Paste your list of HR contacts from your spreadsheet, PDF, or text file. The smart parser will automatically extract Names, Emails, Job Titles, and Company Names, and merge any wrapped lines.
                    </p>
                    <div className="form-group">
                      <textarea
                        className="form-textarea"
                        rows={10}
                        placeholder="Paste list here...&#10;Example:&#10;1 Akanksha Puri&#10;akanksha.puri@sourcefuse.c&#10;om Associate Director HR&#10;SourceFuse&#10;Technologies"
                        value={bulkRawText}
                        onChange={e => setBulkRawText(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <select className="form-select" value={parsingEngine} onChange={e => setParsingEngine(e.target.value)}>
                          <option value="local">Smart Heuristic Parser (Fast & Local)</option>
                          <option value="ai">✨ Gemini AI Parser (Highly Accurate)</option>
                        </select>
                      </div>
                      <button className="btn btn-primary" onClick={handleParseList} disabled={parsingLoader} style={{ height: '38px' }}>
                        {parsingLoader ? (
                          <>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            Parsing...
                          </>
                        ) : 'Parse Contacts'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Parsed List ({parsedList.filter(c => selectedContacts[c.id]).length} / {parsedList.length} Selected)
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-secondary btn-sm" onClick={handleAddParsedContact} style={{ padding: '4px 8px' }}>
                          <Plus size={12} /> Add Row
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleSaveToGlobalDirectory} style={{ padding: '4px 8px' }}>
                          <Save size={12} /> Save to Directory
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setParsedList([]); setBulkRawText(''); }} style={{ padding: '4px 8px' }}>
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Table Wrapper */}
                    <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '8px 12px', width: '32px' }}>
                              <input 
                                type="checkbox" 
                                checked={parsedList.length > 0 && parsedList.every(c => selectedContacts[c.id])} 
                                onChange={e => {
                                  const checked = e.target.checked;
                                  const nextSelected = {};
                                  parsedList.forEach(c => { nextSelected[c.id] = checked; });
                                  setSelectedContacts(nextSelected);
                                }}
                              />
                            </th>
                            <th style={{ padding: '8px 12px' }}>Name</th>
                            <th style={{ padding: '8px 12px' }}>Email</th>
                            <th style={{ padding: '8px 12px' }}>Title</th>
                            <th style={{ padding: '8px 12px' }}>Company</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedList.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background var(--transition-fast)' }} className="table-row-hover">
                              <td style={{ padding: '6px 12px' }}>
                                <input 
                                  type="checkbox" 
                                  checked={!!selectedContacts[c.id]} 
                                  onChange={e => setSelectedContacts(prev => ({ ...prev, [c.id]: e.target.checked }))}
                                />
                              </td>
                              <td style={{ padding: '2px 4px' }}>
                                <input 
                                  className="form-input" 
                                  value={c.name} 
                                  onChange={e => handleEditParsedContact(c.id, 'name', e.target.value)}
                                  style={{ background: 'none', border: 'none', padding: '4px', fontSize: '0.82rem', color: 'var(--color-text-primary)' }}
                                />
                              </td>
                              <td style={{ padding: '2px 4px' }}>
                                <input 
                                  className="form-input" 
                                  value={c.email} 
                                  onChange={e => handleEditParsedContact(c.id, 'email', e.target.value)}
                                  style={{ background: 'none', border: 'none', padding: '4px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}
                                />
                              </td>
                              <td style={{ padding: '2px 4px' }}>
                                <input 
                                  className="form-input" 
                                  value={c.title} 
                                  onChange={e => handleEditParsedContact(c.id, 'title', e.target.value)}
                                  style={{ background: 'none', border: 'none', padding: '4px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}
                                />
                              </td>
                              <td style={{ padding: '2px 4px' }}>
                                <input 
                                  className="form-input" 
                                  value={c.company} 
                                  onChange={e => handleEditParsedContact(c.id, 'company', e.target.value)}
                                  style={{ background: 'none', border: 'none', padding: '4px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brand-secondary)' }}
                                />
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                                <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteParsedContact(c.id)} style={{ padding: '2px' }}>
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Campaign Options Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Settings size={16} color="var(--color-brand-primary)" />
                  Step 2: Sending Engine & Delivery settings
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Sending Engine</label>
                    <select className="form-select" value={sendingEngine} onChange={e => setSendingEngine(e.target.value)}>
                      <option value="smtp">SMTP Direct (Send via Local Server)</option>
                      <option value="emailjs">EmailJS (Browser Direct API)</option>
                      <option value="mailto">Local Mail Client (Mailto Client)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delay Between Sends (Seconds)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={sendingDelay} 
                        onChange={e => setSendingDelay(parseInt(e.target.value))} 
                        style={{ flex: 1, accentColor: 'var(--color-brand-primary)' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{sendingDelay}s</span>
                    </div>
                  </div>
                </div>

                {sendingEngine === 'smtp' && (!smtpConfig.user || !smtpConfig.pass) && (
                  <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-warning)', flex: 1 }}>
                      SMTP connection details are not fully configured yet.
                    </span>
                    <NavLink to="/settings" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                      Configure SMTP
                    </NavLink>
                  </div>
                )}

                {sendingEngine === 'emailjs' && (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) && (
                  <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-warning)', flex: 1 }}>
                      EmailJS keys are not configured yet.
                    </span>
                    <NavLink to="/settings" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                      Configure EmailJS
                    </NavLink>
                  </div>
                )}

                {renderAttachmentSection()}
              </div>
            </div>

          </div>

          {/* Right Column: Template Composer & Live Runner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Campaign Composer Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="var(--color-brand-primary)" />
                  Step 3: Message Template Composer
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Use placeholder tags: <code style={{ color: 'var(--color-brand-secondary)', fontWeight: 600 }}>{"{{name}}"}</code>, <code style={{ color: 'var(--color-brand-secondary)', fontWeight: 600 }}>{"{{company}}"}</code>, <code style={{ color: 'var(--color-brand-secondary)', fontWeight: 600 }}>{"{{title}}"}</code>, <code style={{ color: 'var(--color-brand-secondary)', fontWeight: 600 }}>{"{{sender_name}}"}</code>, <code style={{ color: 'var(--color-brand-secondary)', fontWeight: 600 }}>{"{{sender_linkedin}}"}</code>, <code style={{ color: 'var(--color-brand-secondary)', fontWeight: 600 }}>{"{{sender_github}}"}</code>.
                </p>
                <div className="form-group">
                  <label className="form-label">Subject Template</label>
                  <input
                    className="form-input"
                    value={templateSubject}
                    onChange={e => setTemplateSubject(e.target.value)}
                    placeholder="Subject..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Body Template</label>
                  <textarea
                    className="form-textarea"
                    rows={12}
                    value={templateBody}
                    onChange={e => setTemplateBody(e.target.value)}
                    placeholder="Dear {{name}}..."
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                {/* Template Real-time Preview */}
                <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Template Live Preview
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 500 }}>
                      Showing dynamic rendering for Recipient #1
                    </span>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '8px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>To: </span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{preview.to}</span>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '8px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Subject: </span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{preview.subject}</span>
                  </div>
                  <div 
                    style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: 'var(--color-text-secondary)', maxHeight: '200px', overflowY: 'auto', lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: preview.body }}
                  />
                </div>
              </div>
            </div>

            {/* Campaign Executor Card */}
            <div className="card" style={{ background: campaignRunning ? 'linear-gradient(135deg, rgba(108,99,255,0.05) 0%, var(--color-bg-card) 100%)' : 'var(--color-bg-card)', transition: 'all var(--transition-base)' }}>
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--color-brand-primary)" />
                  Step 4: Launch & Monitor Campaign
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {!campaignRunning ? (
                  <button 
                    className="btn btn-primary btn-lg" 
                    onClick={startCampaign}
                    disabled={parsedList.filter(c => selectedContacts[c.id]).length === 0}
                    style={{ width: '100%', gap: '8px' }}
                  >
                    <Send size={18} />
                    Launch Campaign for {parsedList.filter(c => selectedContacts[c.id]).length} Recipients
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    
                    {/* Stats summary */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                          {campaignStats.sent + campaignStats.failed} / {campaignStats.total}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Emails Dispatched
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Success: {campaignStats.sent}</span>
                        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Failed: {campaignStats.failed}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-bar-wrap">
                      <div className="progress-track" style={{ height: '8px' }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${(campaignStats.total > 0 ? (campaignStats.sent + campaignStats.failed) / campaignStats.total : 0) * 100}%`,
                            background: 'var(--gradient-brand)'
                          }} 
                        />
                      </div>
                    </div>

                    {/* Controls row */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {campaignPaused ? (
                        <button className="btn btn-primary" onClick={resumeCampaign} style={{ flex: 1, gap: 6, display: 'flex', justifyContent: 'center' }}>
                          <Play size={14} /> Resume Campaign
                        </button>
                      ) : (
                        <button className="btn btn-secondary" onClick={pauseCampaign} style={{ flex: 1, gap: 6, display: 'flex', justifyContent: 'center' }}>
                          <Pause size={14} /> Pause Campaign
                        </button>
                      )}
                      <button className="btn btn-danger" onClick={stopCampaign} style={{ flex: 1, gap: 6, display: 'flex', justifyContent: 'center' }}>
                        Cancel Campaign
                      </button>
                    </div>

                    {/* Terminal window log */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Live Delivery Log</label>
                      <div style={{
                        background: '#07070e',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3) var(--space-4)',
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        color: '#a5adcb',
                        height: '180px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        {campaignLogs.map((log, index) => (
                          <div key={index} style={{
                            color: log.includes('SUCCESS') ? 'var(--color-success)' :
                                   log.includes('FAILED') ? 'var(--color-danger)' :
                                   log.includes('completed') ? 'var(--color-success)' :
                                   log.includes('Dispatching') ? 'var(--color-info)' : 'inherit'
                          }}>
                            {log}
                          </div>
                        ))}
                        {campaignLogs.length === 0 && (
                          <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            Launching email dispatcher...
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: 'var(--space-6)', alignItems: 'start' }} className="animate-fade-in">
          
          {/* Left Column: HR Contacts Directory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="card animate-fade-in">
              <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div className="card-title" style={{ flex: 1 }}>Hiring Manager Directory ({contacts.length})</div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowBulkForm(!showBulkForm); setShowManualForm(false); }}>
                    <Clipboard size={14} /> Bulk Sheets-Paste
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => { setShowManualForm(!showManualForm); setShowBulkForm(false); }}>
                    <Plus size={14} /> Add HR Contact
                  </button>
                </div>
              </div>
              
              <div className="card-body" style={{ padding: 0 }}>
                
                {/* Manual Form Accordion */}
                {showManualForm && (
                  <form onSubmit={handleManualAdd} style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', background: 'var(--color-bg-input)' }}>
                    <div className="form-group">
                      <label className="form-label">Recruiter Name</label>
                      <input className="form-input" placeholder="e.g. Sarah Connor" value={manualContact.name} onChange={e => setManualContact({...manualContact, name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input className="form-input" type="email" placeholder="sarah@skynet.com" value={manualContact.email} onChange={e => setManualContact({...manualContact, email: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Title / Role</label>
                      <input className="form-input" placeholder="e.g. Talent Acquisition Lead" value={manualContact.title} onChange={e => setManualContact({...manualContact, title: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company</label>
                      <input className="form-input" placeholder="e.g. Skynet" value={manualContact.company} onChange={e => setManualContact({...manualContact, company: e.target.value})} required />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowManualForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary btn-sm">Save Contact</button>
                    </div>
                  </form>
                )}

                {/* Bulk Form Accordion */}
                {showBulkForm && (
                  <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-input)' }}>
                    <div className="form-group">
                      <label className="form-label">Paste Google Sheets Columns</label>
                      <textarea 
                        className="form-textarea" 
                        rows={5} 
                        placeholder="Paste cells here...&#10;Format: Name [tab/comma] Email [tab/comma] Title [tab/comma] Company"
                        value={bulkInput}
                        onChange={e => setBulkInput(e.target.value)}
                      />
                      <span className="form-hint">Rows will parse line-by-line. Requires a valid email on each line.</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowBulkForm(false)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleBulkAdd}>Import Rows</button>
                    </div>
                  </div>
                )}

                {/* Search Header */}
                <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Search size={16} color="var(--color-text-muted)" />
                  <input 
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: '0.875rem' }} 
                    placeholder="Filter directory by recruiter name, title, company..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} style={{ color: 'var(--color-text-muted)' }}><X size={14} /></button>
                  )}
                </div>

                {/* Directory Table */}
                <div style={{ maxHeight: 440, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        <th style={{ padding: '12px 20px' }}>Name</th>
                        <th style={{ padding: '12px 20px' }}>Title</th>
                        <th style={{ padding: '12px 20px' }}>Company</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map(c => {
                        const isSelected = selectedContact?.email === c.email;
                        return (
                          <tr 
                            key={c.id || c.email} 
                            style={{ 
                              borderBottom: '1px solid var(--color-border)', 
                              background: isSelected ? 'rgba(108,99,255,0.08)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)'
                            }}
                            onClick={() => handleSelectContact(c)}
                            className="table-row-hover"
                          >
                            <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? 'var(--color-brand-primary)' : 'transparent' }} />
                                {c.name}
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', color: 'var(--color-text-secondary)' }}>{c.title || 'Recruiter'}</td>
                            <td style={{ padding: '14px 20px', color: 'var(--color-brand-secondary)', fontWeight: 500 }}>{c.company}</td>
                            <td style={{ padding: '14px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button 
                                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`} 
                                  onClick={() => handleSelectContact(c)}
                                  style={{ padding: '2px 8px' }}
                                >
                                  {isSelected ? <Check size={12} /> : 'Select'}
                                </button>
                                {c.id?.startsWith('imported_') && (
                                  <button 
                                    className="btn btn-ghost btn-sm btn-danger" 
                                    onClick={() => { deleteContact(c.id); if(isSelected) setSelectedContact(null); }}
                                    style={{ padding: '2px' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredContacts.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '40px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            No matching contacts found in directory. Add one or paste rows.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Outreach History Log */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Outreach Log & Tracking</div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                        <th style={{ padding: '10px 20px' }}>Date</th>
                        <th style={{ padding: '10px 20px' }}>Contact</th>
                        <th style={{ padding: '10px 20px' }}>Target Role</th>
                        <th style={{ padding: '10px 20px' }}>Method</th>
                        <th style={{ padding: '10px 20px', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outreachHistory.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 20px', color: 'var(--color-text-muted)' }}>{log.date}</td>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ fontWeight: 600 }}>{log.contactName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{log.company}</div>
                          </td>
                          <td style={{ padding: '12px 20px', color: 'var(--color-text-secondary)' }}>{log.targetRole}</td>
                          <td style={{ padding: '12px 20px', color: 'var(--color-text-muted)' }}>{log.method}</td>
                          <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                            <span className={`badge ${log.status === 'Delivered' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {outreachHistory.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            No sent emails tracked in this session yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Outreach Generator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.08) 0%, rgba(22,22,42,1) 100%)' }}>
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--color-brand-primary)" />
                  Outreach Workspace
                </div>
              </div>
              
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                {selectedContact ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Recipient</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginTop: 2 }}>{selectedContact.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{selectedContact.title} at <strong style={{ color: 'var(--color-brand-secondary)' }}>{selectedContact.company}</strong></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Mail size={11} /> {selectedContact.email}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 'var(--space-6)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>
                    <User size={24} color="var(--color-text-muted)" style={{ margin: '0 auto var(--space-2)' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>No Recruiter Selected</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      Select an HR contact from the directory list or add a custom one to begin drafting.
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Target Role / Position</label>
                  <input 
                    className="form-input" 
                    value={targetRole} 
                    onChange={e => setTargetRole(e.target.value)} 
                    placeholder="e.g. Frontend Developer"
                  />
                </div>

                {renderAttachmentSection()}

                <button 
                  className="btn btn-primary" 
                  onClick={handleGenerate} 
                  disabled={loading || !selectedContact} 
                  style={{ width: '100%' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14 }} />
                      Generating Email...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Generate Auto Cold Email
                    </>
                  )}
                </button>

                {/* Editable Draft Preview */}
                {(subject || emailBody) && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                    
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input 
                        className="form-input" 
                        value={subject} 
                        onChange={e => setSubject(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Body</label>
                      <textarea 
                        className="form-textarea" 
                        rows={10} 
                        value={emailBody} 
                        onChange={e => setEmailBody(e.target.value)} 
                      />
                    </div>

                    {/* Live HTML Preview inside outreach composer */}
                    <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                        Live Draft Preview
                      </div>
                      <div 
                        style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: 'var(--color-text-secondary)', maxHeight: '180px', overflowY: 'auto', lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: autoLinkHTML(emailBody) }}
                      />
                    </div>

                    {/* Send Consoles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      
                      {/* Direct SMTP Send Option */}
                      <button 
                        className="btn btn-primary" 
                        onClick={handleSendSMTP} 
                        disabled={sending}
                        style={{ display: 'flex', justifyContent: 'center', gap: 6 }}
                      >
                        {sending ? (
                          <>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            Sending via SMTP...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Send Directly (SMTP Direct)
                          </>
                        )}
                      </button>

                      {/* Direct EmailJS Send Option */}
                      <button 
                        className="btn btn-secondary" 
                        onClick={handleSendEmailJS} 
                        disabled={sending}
                        style={{ display: 'flex', justifyContent: 'center', gap: 6 }}
                      >
                        {sending ? (
                          <>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            Sending via EmailJS...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Send Directly (EmailJS)
                          </>
                        )}
                      </button>
                      
                      {/* Fallback Mailto client send */}
                      <button className="btn btn-ghost" onClick={handleSendMailto}>
                        <ArrowUpRight size={14} />
                        Send via Local Mail Client (mailto)
                      </button>

                      {(!smtpConfig.user || !smtpConfig.pass) ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-warning)', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                          ⚠️ Configure SMTP Credentials in Settings to send directly with attachments.
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                          ✓ SMTP server configured and ready to attach resume.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
