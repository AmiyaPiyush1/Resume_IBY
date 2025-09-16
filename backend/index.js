import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { createRequire } from 'module';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const app = express();
const port = process.env.PORT || 5001;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const jsearchConfig = {
    headers: {
        'x-rapidapi-key': process.env.SEARCH_API_KEY,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
    url: 'https://jsearch.p.rapidapi.com/search',
};

const extractorPromptTemplate = `
You are an expert AI data extractor. Your task is to analyze the raw text of a resume and convert it into a structured JSON object.
The JSON object must follow this exact schema: {name, email, phone, linkedin, summary, skills (array of strings), experience (array of objects with company, role, period, description (array of strings)), education (object with degree, university, period)}.
Raw Resume Text:
\`\`\`
{rawResumeText}
\`\`\`
Output ONLY the JSON object.
`;

const plannerPromptTemplate = `
You are an AI career strategist (Planner Agent). Analyze the user's structured resume and a job description to create a strategic tailoring plan.
User's Resume JSON:
\`\`\`json
{resumeData}
\`\`\`
Job Description:
\`\`\`text
{jobDescription}
\`\`\`
Generate a JSON object with a strategic plan containing three keys:
1. "extractedSkills": An array of the top 5-7 critical skills from the job description.
2. "skillGap": An array of key skills from the job description missing from the user's resume.
3. "rewritePlan": A concise, high-level action plan for the Executor Agent to rewrite the summary and work experience.
Output strictly in JSON format.
`;

const executorPromptTemplate = `
You are an AI resume writer (Executor Agent). Rewrite a user's resume based on the provided strategic plan.
User's Original Resume JSON:
\`\`\`json
{resumeData}
\`\`\`
Strategic Plan from Planner Agent:
\`\`\`text
{rewritePlan}
\`\`\`
Your Task: Rewrite the "summary" and "experience" sections.
- Follow the plan exactly.
- Incorporate relevant skills naturally.
- Do NOT invent new experiences. Only rephrase existing details.
- Return ONLY a JSON object with two keys: "tailoredSummary" and "tailoredExperience". The "tailoredExperience" should be an array of objects, maintaining the original structure.
Output strictly in JSON format.
`;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
const upload = multer({ storage: multer.memoryStorage() });

const runAgent = async (prompt) => {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(cleanedText);
};

const fetchJobs = async (query, page = 1) => {
    try {
        const options = {
            ...jsearchConfig,
            params: { query, page: page.toString(), num_pages: '1' },
        };
        const res = await axios.request(options);
        return res.data?.data || [];
    } catch (err) {
        console.error('JSearch API fetch failed:', err.message);
        return [];
    }
};

app.post('/api/process', upload.single('resumeFile'), async (req, res) => {
    console.log('New request received...');
    try {
        const { resumeText, jobDescription } = req.body;
        const resumeFile = req.file;

        if (!jobDescription) return res.status(400).json({ error: 'Job description is required.' });
        if (!resumeText && !resumeFile) return res.status(400).json({ error: 'Resume is required.' });

        let rawText = resumeText;
        if (resumeFile) {
            const data = await pdf(resumeFile.buffer);
            rawText = data.text;
        }

        const extractorPrompt = extractorPromptTemplate.replace('{rawResumeText}', rawText);
        const resumeJSON = await runAgent(extractorPrompt);

        const plannerPrompt = plannerPromptTemplate
            .replace('{resumeData}', JSON.stringify(resumeJSON, null, 2))
            .replace('{jobDescription}', jobDescription);
        const plan = await runAgent(plannerPrompt);

        const executorPrompt = executorPromptTemplate
            .replace('{resumeData}', JSON.stringify(resumeJSON, null, 2))
            .replace('{rewritePlan}', plan.rewritePlan);
        const newSections = await runAgent(executorPrompt);

        const tailoredResume = {
            ...resumeJSON,
            summary: newSections.tailoredSummary,
            experience: newSections.tailoredExperience,
        };

        const role = tailoredResume.experience?.[0]?.role || 'Software Developer';
        const skills = tailoredResume.skills?.slice(0, 5).join(', ') || '';
        const searchQuery = `${role} ${skills}`;
        const jobs = await fetchJobs(searchQuery, 1);

        res.json({
            tailoredResume,
            analysis: {
                extractedSkills: plan.extractedSkills,
                skillGap: plan.skillGap,
            },
            suggestedJobs: jobs,
            jobSearchQuery: searchQuery,
        });

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ error: 'An error occurred during processing.' });
    }
});

app.get('/api/search-jobs', async (req, res) => {
    const { query, page } = req.query;
    if (!query || !page) {
        return res.status(400).json({ error: 'Query and page are required.' });
    }
    const jobs = await fetchJobs(query, page);
    res.json(jobs);
});

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { htmlContent } = req.body;
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
        await browser.close();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Tailored-Resume.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});