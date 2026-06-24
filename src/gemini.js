// Gemini API Service
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

async function callGemini(apiKey, prompt) {
  if (!apiKey) throw new Error('No Gemini API key set. Go to Settings to add your key.');
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    const msg = err.error?.message || 'Gemini API error';
    if (msg.includes('not found') || msg.includes('ModelService') || msg.includes('API key')) {
      throw new Error('Gemini API key is invalid or not enabled. Please make sure to create your key at Google AI Studio (aistudio.google.com) and ensure the "Generative Language API" is enabled.');
    }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ---- ATS Score Analysis ----
export async function analyzeATS(apiKey, job, profile) {
  const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze the match between this candidate's profile and job description.

JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Required Skills: ${job.requiredSkills.join(', ')}
Experience Required: ${job.experienceRequired.min}-${job.experienceRequired.max} years
Education: ${job.educationRequired}

CANDIDATE PROFILE:
Current Title: ${profile.currentTitle}
Skills: ${profile.skills.map(s => `${s.name} (${s.level}, ${s.years}yrs)`).join(', ')}
Experience: ${profile.experience.map(e => `${e.role} at ${e.company} - ${e.duration}`).join('; ')}
Education: ${profile.education.map(e => `${e.degree} from ${e.institution}`).join('; ')}
Target Roles: ${profile.targetRoles ? profile.targetRoles.join(', ') : (profile.currentTitle || 'Software Developer')}

Respond with ONLY valid JSON in this exact format:
{
  "overallScore": <number 0-100>,
  "breakdown": {
    "keywordMatch": <number 0-100>,
    "skillsOverlap": <number 0-100>,
    "titleRelevance": <number 0-100>,
    "experienceFit": <number 0-100>,
    "educationMatch": <number 0-100>
  },
  "matchedSkills": ["skill1", "skill2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "titleGap": "<brief note about title match or gap>",
  "experienceNote": "<brief note about experience fit>",
  "educationNote": "<brief note about education fit>",
  "improvements": [
    "Specific action item 1",
    "Specific action item 2",
    "Specific action item 3",
    "Specific action item 4"
  ],
  "verdict": "<one sentence overall verdict>"
}`;

  const raw = await callGemini(apiKey, prompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format from Gemini');
  return JSON.parse(jsonMatch[0]);
}

// ---- Email Draft ----
export async function draftColdEmail(apiKey, job, contact, profile) {
  const prompt = `Write a professional, concise cold email from a job seeker to a recruiter/employee at a company. Keep it personal, not spammy.

FROM: ${profile.name} (${profile.currentTitle})
TO: ${contact.name} (${contact.title} at ${contact.company})
ABOUT ROLE: ${job.title} at ${job.company}
CANDIDATE SKILLS: ${profile.skills.slice(0, 5).map(s => s.name).join(', ')}
CANDIDATE EXPERIENCE: ${profile.experience[0]?.role} at ${profile.experience[0]?.company}

Write a cold email with:
- Subject line (prefix with "Subject: ")
- Body (3-4 short paragraphs max)
- Professional but warm tone
- Mention 1-2 specific, relevant skills
- End with a soft call to action (15 min chat)
- Do NOT use placeholders like [X] — fill in actual details from above
- Keep total length under 200 words`;

  return await callGemini(apiKey, prompt);
}

// ---- LinkedIn DM Draft ----
export async function draftLinkedInDM(apiKey, job, contact, profile) {
  const prompt = `Write a short LinkedIn connection request message / DM from a job seeker to a recruiter.

FROM: ${profile.name} (${profile.currentTitle})  
TO: ${contact.name} (${contact.title} at ${contact.company})
ROLE OF INTEREST: ${job.title} at ${job.company}
TOP SKILLS: ${profile.skills.slice(0, 3).map(s => s.name).join(', ')}

Rules:
- Max 300 characters (LinkedIn connection note limit)
- Casual but professional
- Mention the specific role
- No generic phrases like "I wanted to reach out"
- No hashtags
- Sound like a human, not a bot`;

  return await callGemini(apiKey, prompt);
}

// ---- Resume Improvement Suggestions ----
export async function getResumeImprovements(apiKey, job, profile) {
  const prompt = `You're a professional resume coach. Given this job description and candidate profile, suggest how to rewrite one of their existing bullet points to better match the JD, and suggest what new points they should add.

JOB: ${job.title} at ${job.company}
KEY JD REQUIREMENTS: ${job.requiredSkills.join(', ')}
MISSING KEYWORDS: keywords not found in resume

CANDIDATE EXPERIENCE BULLETS:
${profile.experience.flatMap(e => e.bullets).join('\n')}

Respond with ONLY valid JSON:
{
  "rewrittenBullet": {
    "original": "<one of their existing bullets>",
    "improved": "<rewritten version with JD keywords naturally integrated>"
  },
  "newBulletSuggestions": [
    "<suggested new bullet 1>",
    "<suggested new bullet 2>"
  ],
  "headlineSuggestion": "<suggested resume headline/summary for this role>"
}`;

  const raw = await callGemini(apiKey, prompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format');
  return JSON.parse(jsonMatch[0]);
}

// ---- Skill Gap & Learning Roadmap ----
export async function generateSkillRoadmap(apiKey, job, profile) {
  const prompt = `You are a career counselor and technical skills assessor. Compare the candidate's profile skills against the job description's required skills.
Identify which required skills are missing or weak (e.g. low years of experience or low level), and generate a structured, prioritized learning roadmap to close the gap.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.requiredSkills.join(', ')}

CANDIDATE PROFILE:
Current Title: ${profile.currentTitle}
Skills: ${profile.skills.map(s => `${s.name} (${s.level}, ${s.years}yrs)`).join(', ')}

Respond with ONLY valid JSON in this exact structure:
{
  "overallReadiness": "<Ready|Almost Ready|Needs Development>",
  "strongSkills": ["skill1", "skill2"],
  "skillGaps": [
    {
      "skill": "<missing or weak skill name>",
      "priority": "High|Medium|Low",
      "currentLevel": "<None|Beginner|Intermediate>",
      "targetLevel": "<level required for the role>",
      "estimatedWeeks": <number>,
      "learningResources": ["resource suggestion 1", "resource suggestion 2"]
    }
  ],
  "suggestedOrder": ["skill1 to learn first", "skill2 to learn second"],
  "summary": "<one paragraph honest assessment of readiness and what to focus on first>"
}`;

  const raw = await callGemini(apiKey, prompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format from Gemini');
  return JSON.parse(jsonMatch[0]);
}

// ---- Resume Text Parser ----
export async function parseResumeText(apiKey, resumeText) {
  const prompt = `You are a professional resume parser and data extractor. Extract the details of the candidate from the resume text provided below.
Additionally, analyze the wording of the resume for ATS (Applicant Tracking System) friendliness—checking for the use of active power verbs, inclusion of metrics/numbers, and clear formatting.
Provide a JSON response representing the candidate's parsed profile and ATS score. Do NOT write any code blocks, markdown wrapper tags, or explanations. Respond with ONLY valid JSON matching this exact structure:
{
  "name": "Full Name",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, State or Country",
  "linkedin": "LinkedIn URL (e.g. linkedin.com/in/username)",
  "github": "GitHub URL (e.g. github.com/username)",
  "portfolio": "Personal portfolio website URL",
  "currentTitle": "Most recent/highest professional role title (e.g. Senior Frontend Engineer)",
  "skills": [
    { "name": "Skill Name", "level": "Expert|Advanced|Intermediate|Beginner", "years": 3 }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "duration": "Start Date - End Date (e.g. Jan 2021 - Present)",
      "bullets": [
        "Major impact/responsibility bullet point 1",
        "Major impact/responsibility bullet point 2"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree (e.g. BS in Computer Science)",
      "institution": "University/College Name",
      "year": "Graduation Year (e.g. 2020)"
    }
  ],
  "achievements": [
    "Key achievement, award, or certification"
  ],
  "projects": [
    {
      "title": "Project Title",
      "tech": "Technologies used (e.g. React, Node.js)",
      "description": "Brief description of the project and impact"
    }
  ],
  "completeness": 95,
  "atsScore": 85,
  "atsFeedback": [
    "Feedback point 1 detailing how to improve wording for ATS systems",
    "Feedback point 2 detailing how to improve wording for ATS systems"
  ]
}

If any details are missing, construct reasonable, professional estimates or leave them as empty strings/arrays/objects. Make sure the JSON is completely valid and can be parsed directly.

RESUME TEXT:
${resumeText}`;

  const raw = await callGemini(apiKey, prompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format from Gemini');
  return JSON.parse(jsonMatch[0]);
}

// ---- Generic Cold Email Draft ----
export async function draftGenericColdEmail(apiKey, contact, profile, targetRole) {
  const prompt = `Write a professional, personalized cold email from a job seeker to a recruiter or hiring manager. It must sound genuine, engaging, and highly tailored. Do not include any brackets or placeholders (e.g., [Date] or [Company]); write it as a final copy.

SENDER PROFILE:
- Name: ${profile.name}
- Current Title: ${profile.currentTitle}
- Top Skills: ${profile.skills.slice(0, 5).map(s => s.name).join(', ')}
- Top Experience: ${profile.experience[0]?.role} at ${profile.experience[0]?.company}
- LinkedIn: ${profile.linkedin || ''}
- GitHub: ${profile.github || ''}

RECIPIENT:
- Name: ${contact.name}
- Title: ${contact.title}
- Company: ${contact.company}

TARGET POSITION:
- Role: ${targetRole || 'Software Engineering roles'}

Write a cold email that contains:
1. An attention-grabbing, short Subject line (prefix with "Subject: ")
2. A customized greeting mentioning their name (${contact.name})
3. A paragraph expressing interest in ${targetRole || 'Software Engineering'} opportunities at ${contact.company}
4. A brief highlight of how the sender's top skills (${profile.skills.slice(0, 3).map(s => s.name).join(', ')}) fit their typical needs
5. A clear, professional sign-off and soft call-to-action (e.g., a brief virtual chat)
6. SENDER SIGNATURE: Should contain name, current title, email, phone, and explicitly include LinkedIn and GitHub profiles formatted as HTML links:
   LinkedIn: <a href="${profile.linkedin ? (profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`) : '#'}" target="_blank" rel="noopener noreferrer" style="color: #6c63ff; text-decoration: underline; font-weight: 600;">LinkedIn</a>
   GitHub: <a href="${profile.github ? (profile.github.startsWith('http') ? profile.github : `https://${profile.github}`) : '#'}" target="_blank" rel="noopener noreferrer" style="color: #6c63ff; text-decoration: underline; font-weight: 600;">GitHub</a>
   (Omit the link if the profile is not set).

Total length: Under 180 words. Strictly output the raw Subject and Body without other chat text.`;

  return await callGemini(apiKey, prompt);
}

// ---- AI Parse Contacts ----
export async function parseContactsWithGemini(apiKey, rawText) {
  const prompt = `You are an expert data parser. Parse the following messy text representing a list of HR / Recruiter contacts into a structured JSON array of objects.

Each object MUST have exactly these string fields:
- "name": Full name of the contact.
- "email": Correct, cleaned-up email address. (Merge domain suffixes if split across lines, e.g. "akanksha.puri@sourcefuse.c\nom" becomes "akanksha.puri@sourcefuse.com")
- "title": Job title (e.g. Associate Director HR, Head HR, Talent Acquisition).
- "company": Company name.

Remove any leading numbers (SNo). Clean punctuation. Clean domain formatting.

Input Text:
${rawText}

Respond with ONLY a valid, parseable JSON array. Do not wrap it in markdown code blocks. Start directly with [ and end with ]:`;

  const raw = await callGemini(apiKey, prompt);
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid JSON array returned from Gemini');
  return JSON.parse(jsonMatch[0]);
}

