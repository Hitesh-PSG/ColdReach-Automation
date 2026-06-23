# 🚀 JobReach: CRM & Cold Outreach Hub

Welcome to **JobReach**! JobReach is an all-in-one personal job search assistant and customer relationship manager (CRM). It is designed to help job seekers upload resumes, evaluate ATS scores, manage hiring manager directories, and launch personalized cold email campaigns—all from a sleek, local web dashboard.

This project is built using **React**, **Vite**, and **Google Gemini AI**. Even if you are a complete beginner to web development, this guide will help you get the app up and running in minutes!

---

## 🌟 Key Features

1. **📄 Smart Resume Parser**: Drag and drop your PDF resume. The app automatically extracts your contact details, skills, projects, and work history.
2. **🎯 ATS Score Analysis**: The app compares your resume qualifications against target roles, giving you an ATS score and benchmark comparison (similar to Resume Worded) along with actionable feedback to improve your wording.
3. **📇 Recruiter Directory**: Manage all your hiring contacts in one place. Add them manually or paste spreadsheet rows (from Google Sheets or Excel) to import them instantly.
4. **🧠 Smart AI Contact Parser**: Paste a messy paragraph or list of recruiter contacts. Gemini AI or local smart heuristics will instantly clean, merge wrapped lines, and extract structured records.
5. **✉️ Personalised Cold Emails**: Gemini AI writes tailor-made cold emails for you based on the recruiter's company, target role, and your matching skills.
6. **🔗 Smart HTML Signatures**: Automatically formats clean, clickable anchor links for your LinkedIn and GitHub profiles. Raw pasted links are tidied up and labeled automatically.
7. **📎 PDF Resume Attachments**: Send your uploaded PDF resume directly to recruiters as a real email attachment.
8. **📬 Direct SMTP & Bulk Campaigns**: Send single emails or launch automated bulk campaigns via your personal email account (like Gmail) with custom delay intervals, progress bars, and live logs.
9. **🛡️ Email Typos Guard**: Validates recruiter email addresses before sending to prevent messages from bouncing due to common typos (e.g. `@gmail` instead of `@gmail.com`).

---

## 🛠️ How to Get Started (Beginner's Guide)

Follow these steps to run the application on your computer:

### Step 1: Install Node.js
To run the app, you need **Node.js** installed on your computer. 
- Go to [nodejs.org](https://nodejs.org/) and download the **LTS (Long Term Support)** version.
- Run the installer and click through the prompts.

### Step 2: Open the Project Folder
- Open your terminal, command prompt (CMD), or PowerShell.
- Navigate to this project folder. For example, in Command Prompt:
  ```bash
  cd "C:\Users\YourUsername\Desktop\Learning\cold email"
  ```

### Step 3: Install Dependencies
Install all the required code packages (dependencies) with:
```bash
npm install
```
*(This creates a `node_modules` folder and downloads the building blocks for the app)*

### Step 4: Run the App in Development Mode
Start the local server by running:
```bash
npm run dev
```
Once it starts, you will see a local web address in your terminal (usually `http://localhost:5173`). Open this link in your web browser to use JobReach!

---

## ⚙️ Configuration Setup

To enable AI features and email sending, configure the settings in the **Settings** tab of the dashboard:

### 1. Google Gemini API Key (Required for AI features)
JobReach uses Gemini to parse resumes, analyze ATS compatibility, and write emails.
- Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
- Click **Create API Key**.
- Copy the key and paste it into the **Google Gemini API Key** card under the **Settings** tab.
- *Note: Your API key is stored safely inside your local browser memory (`localStorage`) and is never sent to any third party other than Google.*

### 2. SMTP Credentials (Required to send emails)
To send emails directly from the dashboard:
- **Host**: `smtp.gmail.com` (if you are using Gmail).
- **Port**: `465` (SSL).
- **Username**: Your full Gmail address (e.g., `alex@gmail.com`).
- **Password / App Password**: 
  - If you use Gmail, you **cannot** use your regular account password due to security settings.
  - Enable **2-Step Verification** in your [Google Account Settings](https://myaccount.google.com/).
  - Search for **App Passwords** or go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
  - Create a new app password (e.g., call it "JobReach") and copy the 16-character code.
  - Enter this 16-character code as your password in Settings.

---

## 🚀 How to Launch Your First Campaign

1. **Set Up Your Profile**: 
   Go to **Settings** > **Profile & Resume** tab and upload your PDF resume. Verify the details extracted by the parser.
2. **Add Your Recipients**:
   Go to the **Outreach Hub** > **Bulk Campaign** tab. Under **Step 1**, paste a list of recruiter contacts (e.g., from Excel or raw text) and click **Parse Contacts**.
3. **Choose Sending Options**:
   Select **SMTP Direct** to send emails through your configured email account. Upload/select your resume PDF so it attaches to each email.
4. **Draft the Template**:
   Compose your subject and message templates. You can use dynamic tags like `{{name}}`, `{{company}}`, `{{sender_linkedin}}`, and `{{sender_github}}`.
5. **Preview & Launch**:
   Review the live preview on the right (which dynamically replaces placeholders for the first contact). Click **Launch Campaign** to send! You can monitor progress, pause, or cancel the campaign in real-time.

---

## 📦 Technology Stack

- **Frontend Framework**: [React](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: Modern CSS (featuring responsive layout grids, HSL color themes, and custom animations)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (local, persisted state)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Extraction**: [PDF.js](https://mozilla.github.io/pdf.js/) (extracts text from PDF documents in-browser)
- **SMTP Backend**: [Nodemailer](https://nodemailer.com/) (runs on a custom server route inside Vite development middleware)

---

## 🤝 Support & Feedback

If you have any questions or run into trouble, make sure:
- Your Gemini API Key is valid and active.
- Your SMTP credentials are using an App Password rather than your standard login password.
- You are running the project inside the correct directory.

Happy job hunting! 🚀
