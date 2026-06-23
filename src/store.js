import { create } from 'zustand';

// ---- Mock Data ----
const MOCK_JOBS = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    companyLogo: 'S',
    location: 'San Francisco, CA (Remote)',
    workType: 'Remote',
    salary: '$150K – $200K',
    postedDate: '2 days ago',
    source: 'LinkedIn',
    source_url: 'https://stripe.com/jobs/careers/senior-frontend-engineer',
    description: `We're looking for a Senior Frontend Engineer to join our team. You'll work on building beautiful, performant web experiences that millions of businesses rely on daily.

Requirements:
- 4+ years of experience in frontend development
- Deep expertise in React, TypeScript, and modern JavaScript
- Experience with CI/CD pipelines and Agile methodology
- Strong understanding of Kubernetes and cloud infrastructure
- Familiarity with REST APIs and GraphQL
- Experience with Next.js and server-side rendering

Nice to have:
- Experience at a fintech company
- Open source contributions
- Familiarity with WebSockets and real-time systems`,
    requiredSkills: ['React', 'TypeScript', 'JavaScript', 'Kubernetes', 'CI/CD', 'Agile', 'REST APIs', 'GraphQL', 'Next.js'],
    preferredSkills: ['WebSockets', 'Fintech', 'Open Source'],
    experienceRequired: { min: 4, max: 8 },
    educationRequired: 'BS in Computer Science or equivalent',
    atsScore: 72,
    status: 'new',
    contacts: [
      { id: 'c1', name: 'Sarah Chen', title: 'Technical Recruiter', company: 'Stripe', linkedin: 'https://linkedin.com', email: 'sarah.chen@stripe.com', confidence: 92 },
      { id: 'c2', name: 'Marcus Alvarez', title: 'Engineering Manager', company: 'Stripe', linkedin: 'https://linkedin.com', email: null, confidence: 78 },
    ],
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'Notion',
    companyLogo: 'N',
    location: 'New York, NY (Hybrid)',
    workType: 'Hybrid',
    salary: '$130K – $170K',
    postedDate: '1 day ago',
    source: 'Indeed',
    source_url: 'https://www.notion.so/careers',
    description: `Notion is looking for a Full Stack Engineer to help build the future of productivity software. You'll own end-to-end features from database schema to pixel-perfect UI.

Requirements:
- 3+ years of full stack development experience
- Proficiency in React and Node.js
- PostgreSQL and database design experience
- REST API design and implementation
- Agile/Scrum methodology
- Experience with AWS or similar cloud platforms`,
    requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'REST APIs', 'AWS', 'Agile', 'Scrum'],
    preferredSkills: ['TypeScript', 'Redis', 'WebSockets'],
    experienceRequired: { min: 3, max: 6 },
    educationRequired: 'BS degree required',
    atsScore: 84,
    status: 'reviewed',
    contacts: [
      { id: 'c3', name: 'Priya Sharma', title: 'Talent Acquisition', company: 'Notion', linkedin: 'https://linkedin.com', email: 'priya@notion.so', confidence: 88 },
    ],
  },
  {
    id: '3',
    title: 'React Developer',
    company: 'Linear',
    companyLogo: 'L',
    location: 'Remote (Global)',
    workType: 'Remote',
    salary: '$120K – $160K',
    postedDate: '3 days ago',
    source: 'Dice',
    source_url: 'https://linear.app/careers',
    description: `Linear builds the issue tracking tool that engineers actually love using. We're looking for a React Developer who obsesses over performance and developer experience.

Requirements:
- 2+ years of React development
- Strong CSS and animation skills
- Experience with TypeScript
- Performance optimization mindset
- REST API integration experience`,
    requiredSkills: ['React', 'CSS', 'TypeScript', 'REST APIs', 'Performance'],
    preferredSkills: ['Framer Motion', 'GraphQL'],
    experienceRequired: { min: 2, max: 5 },
    educationRequired: 'Not specified',
    atsScore: 91,
    status: 'applied',
    contacts: [
      { id: 'c4', name: 'Alex Kim', title: 'People Operations', company: 'Linear', linkedin: 'https://linkedin.com', email: null, confidence: 71 },
    ],
  },
  {
    id: '4',
    title: 'Software Engineer - Platform',
    company: 'Vercel',
    companyLogo: 'V',
    location: 'Remote',
    workType: 'Remote',
    salary: '$140K – $190K',
    postedDate: '5 days ago',
    source: 'LinkedIn',
    source_url: 'https://vercel.com/careers',
    description: `Join Vercel's Platform team to work on the infrastructure that powers millions of deployments. You'll work on Kubernetes orchestration, CI/CD systems, and developer tooling.

Requirements:
- 5+ years of software engineering experience
- Strong Go or Node.js backend skills
- Kubernetes and container orchestration
- CI/CD pipeline design and implementation
- Distributed systems experience
- AWS or GCP cloud infrastructure`,
    requiredSkills: ['Go', 'Node.js', 'Kubernetes', 'CI/CD', 'AWS', 'GCP', 'Distributed Systems'],
    preferredSkills: ['Rust', 'WebAssembly'],
    experienceRequired: { min: 5, max: 10 },
    educationRequired: 'BS in CS preferred',
    atsScore: 55,
    status: 'new',
    contacts: [
      { id: 'c5', name: 'Jordan Lee', title: 'Senior Recruiter', company: 'Vercel', linkedin: 'https://linkedin.com', email: 'jordan@vercel.com', confidence: 95 },
    ],
  },
  {
    id: '5',
    title: 'Frontend Engineer',
    company: 'Figma',
    companyLogo: 'F',
    location: 'San Francisco, CA',
    workType: 'Onsite',
    salary: '$145K – $185K',
    postedDate: '1 week ago',
    source: 'ZipRecruiter',
    source_url: 'https://www.figma.com/careers',
    description: `Figma is the design tool used by top teams worldwide. We're looking for a Frontend Engineer to help push the boundaries of what's possible in the browser.

Requirements:
- 4+ years of frontend engineering
- React and TypeScript expertise
- Deep understanding of browser rendering and performance
- CSS animations and Web APIs
- Agile development experience`,
    requiredSkills: ['React', 'TypeScript', 'CSS', 'Browser APIs', 'Performance', 'Agile'],
    preferredSkills: ['WebGL', 'Canvas API', 'Rust/WASM'],
    experienceRequired: { min: 4, max: 8 },
    educationRequired: 'BS degree',
    atsScore: 78,
    status: 'interview',
    contacts: [
      { id: 'c6', name: 'Maya Patel', title: 'Technical Recruiter', company: 'Figma', linkedin: 'https://linkedin.com', email: 'maya.patel@figma.com', confidence: 90 },
      { id: 'c7', name: 'Chris Wang', title: 'Frontend Engineering Manager', company: 'Figma', linkedin: 'https://linkedin.com', email: null, confidence: 65 },
    ],
  },
];

const MOCK_PROFILE = {
  name: 'Alex Johnson',
  email: 'alex.johnson@gmail.com',
  phone: '+1 (555) 987-6543',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexjohnson',
  github: 'github.com/alexjohnson',
  portfolio: 'alexjohnson.dev',
  currentTitle: 'Software Developer',
  achievements: [
    'Winner of TechCorp Annual Hackathon 2024 (Out of 120 teams)',
    'AWS Certified Solutions Architect - Associate (Issued Dec 2024)',
    'Open source contributor to React-Router and Recharts packages'
  ],
  projects: [
    {
      title: 'JobReach CRM',
      tech: 'React, Zustand, CSS, Vite',
      description: 'Personal job application tracking pipeline and cold outreach dispatch engine with automated AI resume parsing.'
    },
    {
      title: 'ATS Matcher Chrome Extension',
      tech: 'JavaScript, Chrome Extension API',
      description: 'Browser utility to grab job details from LinkedIn and evaluate them against local profile qualifications in real-time.'
    }
  ],
  skills: [
    { name: 'React', level: 'Expert', years: 4 },
    { name: 'TypeScript', level: 'Advanced', years: 3 },
    { name: 'JavaScript', level: 'Expert', years: 5 },
    { name: 'Node.js', level: 'Advanced', years: 3 },
    { name: 'Python', level: 'Intermediate', years: 2 },
    { name: 'REST APIs', level: 'Expert', years: 4 },
    { name: 'Git', level: 'Expert', years: 5 },
    { name: 'PostgreSQL', level: 'Advanced', years: 2 },
    { name: 'CSS', level: 'Expert', years: 5 },
    { name: 'AWS', level: 'Intermediate', years: 1 },
  ],
  experience: [
    {
      company: 'TechCorp Inc.',
      role: 'Software Developer',
      duration: 'Jan 2022 – Present (3 yrs)',
      bullets: [
        'Built and maintained 10+ React components used by 50K+ users',
        'Implemented REST API integrations reducing load time by 40%',
        'Collaborated in Agile sprints with cross-functional teams',
      ],
    },
    {
      company: 'StartupXYZ',
      role: 'Junior Frontend Developer',
      duration: 'Jun 2020 – Dec 2021 (1.5 yrs)',
      bullets: [
        'Developed responsive UI components with React and CSS',
        'Integrated third-party APIs and services',
        'Participated in daily standups and sprint planning',
      ],
    },
  ],
  experienceRequired: { min: 2, max: 5 },
  education: [
    { degree: 'Bachelor of Science in Computer Science', institution: 'UC Berkeley', year: '2020' },
  ],
  resumeUploaded: true,
  resumeName: 'alex_johnson_resume.pdf',
  completeness: 88,
  atsScore: 89,
  resumeWordedScore: 86,
  atsFeedback: [
    'Add more quantifiable achievements and metrics to describe impact in bullet points.',
    'Integrate key core technologies (such as Docker, CI/CD, or AWS Cloud) directly into job descriptions.',
    'Use stronger action verbs (e.g. "Spearheaded", "Optimized", "Architected") at the start of experience statements.'
  ]
};

const DEFAULT_HR_DATABASE = [
  { id: 'hr1', name: 'Akanksha Puri', email: 'akanksha.puri@sourcefuse.com', title: 'Associate Director HR', company: 'SourceFuse Technologies' },
  { id: 'hr2', name: 'Akanksha Sogani', email: 'akanksha.sogani@perennialsys.com', title: 'Head HR', company: 'Perennial Systems' },
  { id: 'hr3', name: 'Akhil Jogiparthi', email: 'akhil@ibhubs.co', title: 'Vice President - Talent Accelerator', company: 'iB Hubs' },
  { id: 'hr4', name: 'Akhila Chandan', email: 'akhila@estuate.com', title: 'Associate Vice President Human Resources', company: 'Estuate' },
  { id: 'hr5', name: 'Akram Mohammad', email: 'akram.mohammad@colruytgroup.com', title: 'Deputy Head Head HR', company: 'Colruyt India' },
  { id: 'hr6', name: 'Akriti', email: 'akriti@elsner.in', title: 'HR-Head', company: 'Elsner Technologies' },
  { id: 'hr7', name: 'Akshata Bhandare', email: 'akshata.bhandare@windmill.ch', title: 'HR & Location Head, India', company: 'Windmill' },
  { id: 'hr8', name: 'Albino Mascarenhas', email: 'albino@pixis.ai', title: 'Head - Human Resources Global', company: 'Pyxis One' },
  { id: 'hr9', name: 'Allwyn Richard', email: 'allwyn.r@qbrainx.com', title: 'Head of Human Resources', company: 'QBrainX Inc' },
  { id: 'hr10', name: 'Alok Baghel', email: 'alok.singh@recro.io', title: 'Head Of Talent Management', company: 'Recro' },
  { id: 'hr11', name: 'Alok Kumar', email: 'alok.kumar@vfislk.com', title: 'Operations Leader and Head Transitions, L&D', company: 'VFI SLK' },
  { id: 'hr12', name: 'Alwyn Barretto', email: 'alwyn.barretto@infrasofttech.com', title: 'Head Recruitments', company: 'Infrasoft Technologies' },
  { id: 'hr13', name: 'Aman Khan', email: 'aman.khan@areteanstech.com', title: 'Vice President Human Resources', company: 'Areteans' },
  { id: 'hr14', name: 'Amandeep Kaur', email: 'amandeep.k@antiersolutions.com', title: 'Sr. HR Executive (Technical Recruitment Head)', company: 'Antier Solutions' },
  { id: 'hr15', name: 'Amar Sinha', email: 'amar.sinha@nitorinfotech.com', title: 'Director Talent Acquisition (People Function)', company: 'Nitor Infotech' },
  { id: 'hr16', name: 'Ambrish Kanungo', email: 'ambrish.kanungo@beyondkey.com', title: 'Head of HR', company: 'Beyond Key' },
  { id: 'hr17', name: 'Amiit Avaasthi', email: 'amiit.avaasthi@altudo.co', title: 'Chief People Officer', company: 'Altudo' },
  { id: 'hr18', name: 'Amit', email: 'amit.malhotra@wundermanthompson.com', title: 'Chief People Officer', company: 'Wunderman Thompson MSC' },
  { id: 'hr19', name: 'Amit Kataria', email: 'amit@hanu.com', title: 'Chief Human Resources Officer', company: 'Hanu Software' },
  { id: 'hr20', name: 'Amit Prayagi', email: 'amit.prayagi@claimgenius.com', title: 'Head Of Recruitment & HR Operation', company: 'Claim Genius' },
  { id: 'hr21', name: 'Amit Ranjan', email: 'amit.ranjan@scikey.ai', title: 'Associate Director- Talent Solutions', company: 'SCIKEY' },
  { id: 'hr22', name: 'Amit Sahoo', email: 'amit.sahoo@areteanstech.com', title: 'Vice President and Global Head - Human Resources', company: 'Areteans' },
  { id: 'hr23', name: 'Amita Shital', email: 'ashital@svam.com', title: 'Head of HR', company: 'SVAM International' },
  { id: 'hr24', name: 'Amitesh Verma', email: 'amitesh.verma@cheersin.com', title: 'Associate Director, Talent Acquisition', company: 'Cheers Interactive' },
  { id: 'hr25', name: 'Amitha K', email: 'amitha.k@secure-24.com', title: 'Director- HR', company: 'Secure-24' },
  { id: 'hr26', name: 'Amlan Nag', email: 'amlan.nag@mjunction.in', title: 'General Manager & Head HR', company: 'mjunction services' },
  { id: 'hr27', name: 'Amresh Mehra', email: 'amreshm@zendrive.com', title: 'VP - People & Culture', company: 'Zendrive' },
  { id: 'hr28', name: 'Amrita', email: 'akishore@dimagi.com', title: 'Director of People Operations, India', company: 'Dimagi' },
  { id: 'hr29', name: 'Amrita Cheema', email: 'amrita.cheema@loconav.com', title: 'Head HR - Global SaaS', company: 'LocoNav' },
  { id: 'hr30', name: 'Amrita Singh', email: 'amrita.singh@cogentinfo.com', title: 'Director - Recruitment & Delivery (US Staffing)', company: 'COGENT Infotech' },
  { id: 'hr31', name: 'Amrita Singh', email: 'amrita.singh@itbd.net', title: 'Head HR (India)', company: 'IT BY DESIGN' },
  { id: 'hr32', name: 'Amrita Tripathi', email: 'amrita@sdnaglobal.com', title: 'VP - India, ME and APAC HR', company: 'Stanley David and Associates' },
  { id: 'hr33', name: 'Amritesh Shukla', email: 'amritesh.shukla@mygate.com', title: 'Head Of Human Resources', company: 'MyGate' },
  { id: 'hr34', name: 'Amruta Urkude', email: 'amruta@greatplaceitservices.com', title: 'HR Head (Generalist)', company: 'Great Place IT Services' },
  { id: 'hr35', name: 'Amulya', email: 'amulya.ms@utthunga.com', title: 'Director HR', company: 'Utthunga' },
  { id: 'hr36', name: 'Anand Christopher', email: 'anand.christopher@grassrootsbpo.com', title: 'Vice President Human Resources', company: 'Grassroots' },
  { id: 'hr37', name: 'Anand E', email: 'anand.e@increff.com', title: 'Chief Human Resources Officer', company: 'Increff' },
  { id: 'hr38', name: 'Anand K', email: 'ak@8kmiles.com', title: 'Vice President Human Resources', company: 'SecureKloud Technologies' },
  { id: 'hr39', name: 'Anand Khot', email: 'anandk@pharmarack.com', title: 'Chief Human Resources Officer', company: 'Pharmarack' },
  { id: 'hr40', name: 'Anand Rajendran', email: 'anand.r@whatarage.com', title: 'Director - HR', company: 'ADK Rage' },
  { id: 'hr41', name: 'Anand Sasidharan', email: 'anand@hubilo.com', title: 'Head of Talent Acquisition', company: 'Hubilo' },
  { id: 'hr42', name: 'Anand Sl', email: 'anand@auzmor.com', title: 'HR Director / Operations Head (India)', company: 'Auzmor' },
  { id: 'hr43', name: 'Anand Soni', email: 'anand@capsitech.com', title: 'Talent Acquisition Head', company: 'Capsitech' },
  { id: 'hr44', name: 'Anand Thiagarajan', email: 'athiagarajan@inniveinc.com', title: 'Vice President - Human Resources', company: 'Innive Inc' },
  { id: 'hr45', name: 'Anandhi Srinivasan', email: 'anandhi.s@dsmsoft.com', title: 'Associate Vice President - Human Resources', company: 'DSM SOFT' },
  { id: 'hr46', name: 'Ananthram Iyer', email: 'ananthram.iyer@customercentria.com', title: 'Vice President HR', company: 'Customer Centria' },
  { id: 'hr47', name: 'Anchal Rastogi', email: 'anrastogi@enhanceit.com', title: 'AVP Recruitments', company: 'Enhance IT' },
  { id: 'hr48', name: 'Anchan Arasinaguppe', email: 'aarasina@teksystems.com', title: 'Associate Director Talent Acquisition', company: 'TEKsystems Global Services' },
  { id: 'hr49', name: 'Angel Mathew', email: 'angel.mathew@delphix.com', title: 'Human Resources Director', company: 'Delphix' },
  { id: 'hr50', name: 'Anil Chandra', email: 'anil.chandra@thoughtspot.com', title: 'Senior Director, Talent Acquisition', company: 'ThoughtSpot' },
];

const getStoredJSON = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setStoredJSON = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
};

// ---- Zustand Store ----
const useStore = create((set, get) => ({
  // Profile (persisted)
  profile: getStoredJSON('jobreach_profile', MOCK_PROFILE),
  setProfile: (data) => {
    const newProfile = { ...get().profile, ...data };
    set({ profile: newProfile });
    setStoredJSON('jobreach_profile', newProfile);
  },

  // Resume Attachment (in-memory)
  resumeAttachment: null,
  setResumeAttachment: (attachment) => set({ resumeAttachment: attachment }),
  clearResumeAttachment: () => set({ resumeAttachment: null }),

  // Jobs
  jobs: MOCK_JOBS,
  selectedJob: null,
  jobFilter: { search: '', workType: 'all', status: 'all', source: 'all', minScore: 0 },
  setSelectedJob: (job) => set({ selectedJob: job }),
  setJobFilter: (filter) => set({ jobFilter: { ...get().jobFilter, ...filter } }),
  updateJobStatus: (jobId, status) => set({
    jobs: get().jobs.map(j => j.id === jobId ? { ...j, status } : j)
  }),

  // Filtered Jobs
  get filteredJobs() {
    const { jobs, jobFilter } = get();
    return jobs.filter(j => {
      if (jobFilter.search && !j.title.toLowerCase().includes(jobFilter.search.toLowerCase()) && !j.company.toLowerCase().includes(jobFilter.search.toLowerCase())) return false;
      if (jobFilter.workType !== 'all' && j.workType !== jobFilter.workType) return false;
      if (jobFilter.status !== 'all' && j.status !== jobFilter.status) return false;
      if (jobFilter.source !== 'all' && j.source !== jobFilter.source) return false;
      if (j.atsScore < jobFilter.minScore) return false;
      return true;
    });
  },

  // Outreach Drafts
  outreachDrafts: {},
  setOutreachDraft: (jobId, type, text) => set({
    outreachDrafts: { ...get().outreachDrafts, [`${jobId}-${type}`]: text }
  }),

  // AI Loading states
  aiLoading: {},
  setAiLoading: (key, val) => set({ aiLoading: { ...get().aiLoading, [key]: val } }),

  // Toast
  toasts: [],
  addToast: (msg, type = 'info') => {
    const id = Date.now();
    set({ toasts: [...get().toasts, { id, msg, type }] });
    setTimeout(() => set({ toasts: get().toasts.filter(t => t.id !== id) }), 3500);
  },

  // Gemini API Key
  geminiKey: localStorage.getItem('gemini_key') || '',
  setGeminiKey: (key) => { localStorage.setItem('gemini_key', key); set({ geminiKey: key }); },

  // EmailJS Configuration
  emailjsServiceId: localStorage.getItem('emailjs_service_id') || '',
  emailjsTemplateId: localStorage.getItem('emailjs_template_id') || '',
  emailjsPublicKey: localStorage.getItem('emailjs_public_key') || '',
  setEmailjsConfig: (serviceId, templateId, publicKey) => {
    localStorage.setItem('emailjs_service_id', serviceId);
    localStorage.setItem('emailjs_template_id', templateId);
    localStorage.setItem('emailjs_public_key', publicKey);
    set({
      emailjsServiceId: serviceId,
      emailjsTemplateId: templateId,
      emailjsPublicKey: publicKey
    });
  },

  // SMTP Configuration
  smtpConfig: getStoredJSON('jobreach_smtp_config', {
    host: 'smtp.gmail.com',
    port: '465',
    user: '',
    pass: '',
    senderName: '',
    replyTo: ''
  }),
  setSmtpConfig: (config) => {
    const newConfig = { ...get().smtpConfig, ...config };
    set({ smtpConfig: newConfig });
    setStoredJSON('jobreach_smtp_config', newConfig);
  },

  // Outreach Contacts
  contacts: getStoredJSON('jobreach_contacts', DEFAULT_HR_DATABASE),
  addContacts: (newContacts) => {
    const contacts = [...get().contacts];
    // filter duplicates by email
    const existingEmails = new Set(contacts.map(c => c.email?.toLowerCase()));
    newContacts.forEach(nc => {
      if (nc.email && !existingEmails.has(nc.email.toLowerCase())) {
        contacts.unshift({
          id: 'imported_' + Math.random().toString(36).substr(2, 9),
          ...nc
        });
      }
    });
    set({ contacts });
    setStoredJSON('jobreach_contacts', contacts);
  },
  deleteContact: (id) => {
    const contacts = get().contacts.filter(c => c.id !== id);
    set({ contacts });
    setStoredJSON('jobreach_contacts', contacts);
  },

  // Outreach Sent History
  outreachHistory: getStoredJSON('jobreach_outreach_history', []),
  addOutreachLog: (log) => {
    const newLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...log
    };
    const outreachHistory = [newLog, ...get().outreachHistory];
    set({ outreachHistory });
    setStoredJSON('jobreach_outreach_history', outreachHistory);
  }
}));

export default useStore;

