import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdf from 'pdf-parse';
import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
const upload = multer({ storage: multer.memoryStorage() }); // For handling file uploads in memory

// --- GEMINI AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- PROMPT TEMPLATES ---

const extractorPromptTemplate = `
You are an expert AI data extractor. Your task is to analyze the raw text of a resume and convert it into a structured JSON object.
The JSON object must follow this exact schema: {name, email, phone, linkedin, summary, skills (array of strings), experience (array of objects with company, role, period, description (array of strings)), education (object with degree, university, period)}.

Raw Resume Text:
\`\`\`
{rawResumeText}
\`\`\`

Based on the text above, generate the JSON object. Be accurate and handle missing information gracefully by using empty strings or arrays.
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

Output strictly in JSON format:
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

Output strictly in JSON format:
`;


// --- MAIN API ENDPOINT ---

app.post('/api/process', upload.single('resumeFile'), async (req, res) => {
    try {
        console.log('Processing request...');
        const { resumeText, jobDescription } = req.body;
        const resumeFile = req.file;

        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required.' });
        }
        if (!resumeText && !resumeFile) {
            return res.status(400).json({ error: 'Resume text or PDF file is required.' });
        }

        let rawResumeText = resumeText;
        if (resumeFile) {
            console.log('Parsing PDF file...');
            const data = await pdf(resumeFile.buffer);
            rawResumeText = data.text;
        }

        // --- 1. Extractor Agent ---
        console.log('Executing Extractor Agent...');
        const extractorPrompt = extractorPromptTemplate.replace('{rawResumeText}', rawResumeText);
        const extractorResult = await model.generateContent(extractorPrompt);
        const extractorResponseText = extractorResult.response.text().replace(/```json/g, '').replace(/```/g, '');
        const resumeData = JSON.parse(extractorResponseText);
        console.log('Extractor Agent finished.');

        // --- 2. Planner Agent ---
        console.log('Executing Planner Agent...');
        const plannerPrompt = plannerPromptTemplate
            .replace('{resumeData}', JSON.stringify(resumeData, null, 2))
            .replace('{jobDescription}', jobDescription);
        const plannerResult = await model.generateContent(plannerPrompt);
        const plannerResponseText = plannerResult.response.text().replace(/```json/g, '').replace(/```/g, '');
        const plan = JSON.parse(plannerResponseText);
        console.log('Planner Agent finished.');

        // --- 3. Executor Agent ---
        console.log('Executing Executor Agent...');
        const executorPrompt = executorPromptTemplate
            .replace('{resumeData}', JSON.stringify(resumeData, null, 2))
            .replace('{rewritePlan}', plan.rewritePlan);
        const executorResult = await model.generateContent(executorPrompt);
        const executorResponseText = executorResult.response.text().replace(/```json/g, '').replace(/```/g, '');
        const tailoredSections = JSON.parse(executorResponseText);
        console.log('Executor Agent finished.');

        // --- Combine and Respond ---
        const finalResume = {
            ...resumeData,
            summary: tailoredSections.tailoredSummary,
            experience: tailoredSections.tailoredExperience,
        };

        res.json({
            tailoredResume: finalResume,
            analysis: {
                extractedSkills: plan.extractedSkills,
                skillGap: plan.skillGap,
            }
        });

    } catch (error) {
        console.error('Error in /api/process:', error);
        res.status(500).json({ error: 'An error occurred during processing. Please check the backend console.' });
    }
});


// --- PDF GENERATION ENDPOINT ---
app.post('/api/generate-pdf', async (req, res) => {
    console.log('Received request to generate PDF...');
    try {
        const { htmlContent } = req.body;
        if (!htmlContent) {
            return res.status(400).json({ error: 'HTML content is required.' });
        }
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
        await browser.close();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Tailored-Resume.pdf');
        res.send(pdfBuffer);
        console.log('PDF generated and sent successfully.');
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});