import { useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DocumentTextIcon, ArrowUpOnSquareIcon, ArrowDownTrayIcon, LightBulbIcon, 
    ExclamationTriangleIcon, PencilIcon, SparklesIcon, CloudArrowUpIcon, 
    ChevronLeftIcon, ChevronRightIcon, LinkIcon, MapPinIcon
} from '@heroicons/react/24/outline';

const API_URL = 'http://localhost:5001';

const defaultText = {
    resume: `John Doe
Email: john.doe@example.com | Phone: +1-555-1234 | LinkedIn: linkedin.com/in/johndoe

SUMMARY
Highly motivated Computer Science student with hands-on experience in web development (React, Node.js) and algorithms. Seeking a Software Development Intern role to contribute to innovative projects at IBY.

SKILLS
JavaScript, Python, Java, React, Node.js, Express, Git, GitHub, Data Structures & Algorithms

EXPERIENCE
Software Development Intern | XYZ Solutions | Jun 2024 - Aug 2024
- Developed a full-stack web application using React and Node.js to track user metrics.
- Collaborated with a team of 5 engineers to implement new features, improving user engagement by 15%.
- Participated in daily stand-ups, code reviews, and debugging sessions to maintain code quality.

EDUCATION
B.Tech in Computer Science | IIT Bhubaneswar | 2021 - 2025`,
    jobDesc: `We are looking for a highly motivated Software Development Intern to join our engineering team at IBY. Responsibilities include writing clean and efficient code, collaborating with cross-functional teams, participating in code reviews, and contributing to the design and development of software solutions. Skills required: Proficiency in JavaScript, Python, or Java; understanding of data structures and algorithms; familiarity with version control systems like Git; strong problem-solving skills.`
};

const EditableField = ({ value, onSave, multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value);

    const handleSave = () => {
        onSave(text);
        setIsEditing(false);
    };
    const inputClasses = "w-full p-1 border-2 border-indigo-400 rounded-md bg-white/80 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";

    if (isEditing) {
        return multiline ? (
            <textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={handleSave} autoFocus className={`${inputClasses} min-h-[60px]`} />
        ) : (
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus className={inputClasses} />
        );
    }
    return (
        <div onClick={() => setIsEditing(true)} className="hover:bg-indigo-50/80 p-1 cursor-pointer rounded-md group relative transition-colors duration-200">
            {multiline ? <p className="text-sm whitespace-pre-wrap leading-relaxed">{value || " "}</p> : <span className="text-sm">{value || " "}</span>}
            <PencilIcon className="h-3.5 w-3.5 absolute top-1 right-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

const ResumeViewer = ({ resume, analysis, updateField, downloadPdf }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
        {analysis && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg">
                <div>
                    <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-2"><LightBulbIcon className="h-5 w-5 mr-2 text-green-400"/> Key Skills</h3>
                    <div className="flex flex-wrap gap-2">{analysis.extractedSkills.map(s => <span key={s} className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">{s}</span>)}</div>
                </div>
                <div>
                    <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-2"><ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-400"/> Skill Gap</h3>
                    <div className="flex flex-wrap gap-2">{analysis.skillGap.map(s => <span key={s} className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">{s}</span>)}</div>
                </div>
            </motion.div>
        )}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Editable Result</h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={downloadPdf} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all">
                <ArrowDownTrayIcon className="h-5 w-5"/> Download PDF
            </motion.button>
        </div>
        <div id="resume-viewer" className="space-y-6 text-gray-700 bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
            <div className='text-center'>
                <h1 className='text-2xl font-bold'><EditableField value={resume.name} onSave={v => updateField(['name'], v)} /></h1>
                <div className="flex justify-center items-center gap-x-2 text-gray-500 text-xs mt-1">
                    <EditableField value={resume.email} onSave={v => updateField(['email'], v)} /> |
                    <EditableField value={resume.phone} onSave={v => updateField(['phone'], v)} /> |
                    <EditableField value={resume.linkedin} onSave={v => updateField(['linkedin'], v)} />
                </div>
            </div>
            {['summary', 'experience', 'education', 'skills'].map(section => {
                if (!resume[section]) return null;
                const title = section.charAt(0).toUpperCase() + section.slice(1);
                return (
                    <div key={section}>
                        <h3 className="text-sm font-extrabold text-indigo-700 border-b-2 border-indigo-200 pb-1 mb-3 uppercase tracking-wider">{title}</h3>
                        {section === 'summary' && <EditableField value={resume.summary} onSave={v => updateField(['summary'], v)} multiline />}
                        {section === 'skills' && (<div className="flex flex-wrap gap-2">{resume.skills.map((skill, i) => (<span key={i} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-3 py-1 rounded-full"><EditableField value={skill} onSave={v => updateField(['skills', i], v)} /></span>))}</div>)}
                        {section === 'experience' && resume.experience.map((exp, index) => (
                            <div key={index} className="mt-2 relative pl-4 before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-gray-200">
                                <div className='absolute left-[-3.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-600'></div>
                                <h4 className="font-semibold text-base text-gray-900"><EditableField value={exp.role} onSave={v => updateField(['experience', index, 'role'], v)} /></h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <EditableField value={exp.company} onSave={v => updateField(['experience', index, 'company'], v)} /> | <EditableField value={exp.period} onSave={v => updateField(['experience', index, 'period'], v)} />
                                </div>
                                <ul className="list-disc mt-2 pl-5 space-y-1">{exp.description.map((d, i) => (<li key={i} className="text-sm"><EditableField value={d} onSave={v => updateField(['experience', index, 'description', i], v)} /></li>))}</ul>
                            </div>
                        ))}
                        {section === 'education' && resume.education && (
                            <div className="mt-2">
                                <h4 className="font-semibold text-base text-gray-900"><EditableField value={resume.education.degree} onSave={v => updateField(['education', 'degree'], v)} /></h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <EditableField value={resume.education.university} onSave={v => updateField(['education', 'university'], v)} /> | <EditableField value={resume.education.period} onSave={v => updateField(['education', 'period'], v)} />
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    </motion.div>
);

const SuggestedJobs = ({ jobs, page, onPageChange, loading }) => {
    if (!jobs || jobs.length === 0) {
        return (
            <div className="mt-10 text-center bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-700">No Jobs Found</h2>
                <p className="text-gray-500 mt-2">Try adjusting your resume details or the job role.</p>
            </div>
        );
    }
    return (
        <div className="mt-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Relevant Job Openings</h2>
            <div className={`space-y-4 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                {jobs.map((job) => (
                    <div key={job.job_id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-indigo-700">{job.job_title}</h3>
                                <p className="text-sm font-semibold text-gray-700">{job.employer_name}</p>
                                <p className="text-xs text-gray-500 flex items-center mt-1"><MapPinIcon className="h-3 w-3 mr-1"/> {job.job_city}, {job.job_state}</p>
                            </div>
                            <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm bg-indigo-500 text-white font-semibold py-1.5 px-3 rounded-md hover:bg-indigo-600 transition-colors">
                                <LinkIcon className="h-4 w-4 mr-1.5"/> Apply
                            </a>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-6">
                <button onClick={() => onPageChange('prev')} disabled={page <= 1 || loading} className="flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <ChevronLeftIcon className="h-5 w-5"/> Previous
                </button>
                <span className="font-semibold">Page {page}</span>
                <button onClick={() => onPageChange('next')} disabled={loading} className="flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    Next <ChevronRightIcon className="h-5 w-5"/>
                </button>
            </div>
        </div>
    );
};

export default function App() {
    const [inputMode, setInputMode] = useState('text');
    const [resumeText, setResumeText] = useState(defaultText.resume);
    const [resumeFile, setResumeFile] = useState(null);
    const [jobDesc, setJobDesc] = useState(defaultText.jobDesc);
    const [result, setResult] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    const [jobs, setJobs] = useState([]);
    const [query, setQuery] = useState('');
    const [jobPage, setJobPage] = useState(1);
    const [jobsLoading, setJobsLoading] = useState(false);

    const generate = async () => {
        if (!jobDesc.trim()) return toast.error('Job description is required.');
        if (inputMode === 'text' && !resumeText.trim()) return toast.error('Resume text is required.');
        if (inputMode === 'pdf' && !resumeFile) return toast.error('Please select a PDF file.');

        setLoading(true);
        setResult(null);
        setAnalysis(null);
        setJobs([]);
        const toastId = toast.loading('Processing...');

        const formData = new FormData();
        formData.append('jobDescription', jobDesc);
        if (inputMode === 'pdf') {
            formData.append('resumeFile', resumeFile);
        } else {
            formData.append('resumeText', resumeText);
        }

        try {
            const res = await axios.post(`${API_URL}/api/process`, formData);
            toast.success('Done!', { id: toastId });
            setResult(res.data.tailoredResume);
            setAnalysis(res.data.analysis);
            setJobs(res.data.suggestedJobs || []);
            setQuery(res.data.jobSearchQuery || '');
            setJobPage(1);
        } catch (error) {
            toast.error(error.response?.data?.error || 'An error occurred.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const changeJobPage = async (direction) => {
        const newPage = direction === 'next' ? jobPage + 1 : jobPage - 1;
        if (newPage < 1) return;

        setJobsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/search-jobs`, { params: { query, page: newPage } });
            if (res.data?.length > 0) {
                setJobs(res.data);
                setJobPage(newPage);
            } else {
                toast('No more jobs found.');
            }
        } catch (error) {
            toast.error('Could not fetch jobs.');
        } finally {
            setJobsLoading(false);
        }
    };

    const updateField = (path, value) => {
        setResult(prev => {
            const newResult = JSON.parse(JSON.stringify(prev));
            let current = newResult;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newResult;
        });
    };

    const downloadPdf = async () => {
        const resumeEl = document.getElementById('resume-viewer');
        if (!resumeEl) return;
        toast.loading('Generating PDF...');
        
        const tailwindCssUrl = 'https://cdn.tailwindcss.com/3.4.1';
        const htmlContent = `
            <html>
                <head>
                    <script src="${tailwindCssUrl}"></script>
                    <style>
                        body { font-family: 'Inter', sans-serif; }
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                        ul { list-style-position: inside; }
                        .group:hover .group-hover\\:opacity-100 { opacity: 0 !important; }
                    </style>
                </head>
                <body class="p-8 bg-white">${resumeEl.innerHTML}</body>
            </html>`;
        
        try {
            const res = await axios.post(`${API_URL}/api/generate-pdf`, { htmlContent }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Resume_${result.name.replace(' ', '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success('PDF downloaded!');
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to generate PDF.');
        }
    };

    const handleFileChange = (e) => {
        setResumeFile(e.target.files[0]);
        setIsDragging(false);
    }
    
    const handleDragEvents = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
    }
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            setResumeFile(e.dataTransfer.files[0]);
        }
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            <motion.header initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">AI Resume Agent</span> 🤖
                </h1>
                <p className="text-lg text-gray-400 mt-3 max-w-2xl mx-auto">Paste your resume and a job description to get a tailored result.</p>
            </motion.header>
            
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">1. Your Resume</h2>
                        <div className="flex bg-gray-900/50 p-1 rounded-lg">
                            <button onClick={() => setInputMode('text')} className={`w-1/2 rounded-md py-2 font-semibold transition-colors ${inputMode === 'text' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/10'}`}><PencilIcon className="h-5 w-5 inline-block mr-2"/>Paste Text</button>
                            <button onClick={() => setInputMode('pdf')} className={`w-1/2 rounded-md py-2 font-semibold transition-colors ${inputMode === 'pdf' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/10'}`}><ArrowUpOnSquareIcon className="h-5 w-5 inline-block mr-2"/>Upload PDF</button>
                        </div>
                        <div className="mt-4">
                            <AnimatePresence mode="wait">
                                <motion.div key={inputMode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                    {inputMode === 'text' ? (
                                        <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="w-full h-48 p-3 bg-gray-900/50 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:bg-gray-900 focus:outline-none transition-all" placeholder="Paste your resume here." />
                                    ) : (
                                        <div onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-gray-500'}`}>
                                            <input type="file" id="resumeFile" accept=".pdf" className="hidden" onChange={handleFileChange} />
                                            <label htmlFor="resumeFile" className="cursor-pointer">
                                                <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mx-auto mb-2"/>
                                                <span className="font-semibold text-indigo-400">{resumeFile ? `Selected: ${resumeFile.name}` : 'Choose a file or drag it here'}</span>
                                                <p className="text-xs text-gray-500 mt-1">PDF format only</p>
                                            </label>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">2. Job Description</h2>
                        <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} className="w-full h-48 p-3 bg-gray-900/50 rounded-lg border-2 border-transparent focus:border-indigo-500 focus:bg-gray-900 focus:outline-none transition-all" placeholder="Paste the job description here." />
                    </div>
                    <motion.button onClick={generate} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center gap-2">
                        {loading ? 'Working...' : <><SparklesIcon className="h-6 w-6"/> Generate</>}
                    </motion.button>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="bg-gray-200 p-6 rounded-2xl shadow-2xl min-h-[500px] text-gray-800">
                    <AnimatePresence mode="wait">
                        {!result && !loading && (
                            <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center">
                                <DocumentTextIcon className="h-20 w-20 text-gray-400 mb-4" />
                                <h3 className="text-2xl font-bold text-gray-700">Results will show here</h3>
                                <p className="text-gray-500 mt-2 max-w-sm">Fill in the details on the left and click Generate.</p>
                            </motion.div>
                        )}
                        {loading && (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full">
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>
                                <p className="text-xl font-semibold text-gray-700 mt-4">Crafting your resume...</p>
                            </motion.div>
                        )}
                        {result && (
                            <motion.div key="result">
                               <ResumeViewer resume={result} analysis={analysis} updateField={updateField} downloadPdf={downloadPdf} />
                               {(jobs.length > 0 || jobsLoading) && <SuggestedJobs jobs={jobs} page={jobPage} onPageChange={changeJobPage} loading={jobsLoading} />}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>
        </div>
    );
}