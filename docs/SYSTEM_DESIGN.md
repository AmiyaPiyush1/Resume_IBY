# System Design Document: AI Resume Agent

---

## 1. Architecture

The application is built on a standard **Client-Server Architecture**. This design separates the **user interface (client)** from the **business logic and data processing (server)**, which is ideal for a web application that needs to perform heavy computations.

**Diagram of Flow:**  
`[User's Browser (React Frontend)] <--> [REST API (Node.js/Express Backend)] <--> [External Services (Google Gemini & JSearch API)]`

**Client (Frontend):**  
A React single-page application that runs in the user's browser. Responsible for all **UI rendering, user input**, and communicating with the backend via REST API calls.

**Server (Backend):**  
A Node.js application that exposes a **REST API**. It contains all the **core logic**, orchestrates the **multi-agent workflow**, communicates with external APIs (like Google Gemini), and handles tasks like **PDF generation**.

**Reason for this choice:**  
This architecture is **highly scalable and maintainable**. Frontend and backend can be developed, deployed, and scaled independently. It also **secures sensitive information**, like API keys, by keeping them server-side, never exposing them to the client.

---

## 2. Data Design

This section outlines the structure of data as it moves through the system. The primary data format is **JSON**.

### Data Schemas

**Resume JSON (Output of Extractor Agent):** This is the core structured data object representing the user's resume.

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "linkedin": "string",
  "summary": "string",
  "skills": ["string", "string", "..."],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "period": "string",
      "description": ["string", "string", "..."]
    }
  ],
  "education": {
    "degree": "string",
    "university": "string",
    "period": "string"
  }
}

Planner Agent Output: The strategic plan created by the Planner.

{
  "extractedSkills": ["string", "string", "..."],
  "skillGap": ["string", "string", "..."],
  "rewritePlan": "string"
}


Final API Response (/api/process): The comprehensive object sent from the backend to the frontend.


{
  "tailoredResume": { /* See Resume JSON schema above */ },
  "analysis": { /* See Planner Agent Output schema above */ },
  "suggestedJobs": [ /* Array of job objects from JSearch API */ ],
  "jobSearchQuery": "string"
}

## Data Flow

- **Input:** The system receives unstructured data from the user: `resumeText` (string) and `jobDescription` (string).  
- **Extraction:** The **Extractor Agent** processes the `resumeText` and converts it into the structured **Resume JSON** format.  
- **Planning:** The **Planner Agent** takes the Resume JSON and `jobDescription` as input to produce the **Planner Agent Output** (the plan).  
- **Execution:** The **Executor Agent** uses the original Resume JSON and the `rewritePlan` from the planner's output to generate new summary and experience sections.  
- **Aggregation:** The backend combines the original resume data with the rewritten sections to form the `tailoredResume` object. It then bundles this with the `analysis` and `suggestedJobs` into the **Final API Response** and sends it to the frontend.

---

## 3. Component Breakdown

### Backend Components (`server.js`)

- **Express Server:** Responsible for routing API requests.

- **API Endpoints:**
  - `POST /api/process` → Main controller that orchestrates the entire agent workflow  
  - `GET /api/search-jobs` → Dedicated endpoint for job search pagination  
  - `POST /api/generate-pdf` → Converts HTML to a PDF file  

- **AI Agents (Logical Components):**
  - **Extractor Agent:** Takes raw text and outputs structured **Resume JSON**  
  - **Planner Agent:** Takes **Resume JSON** and a job description and outputs a **strategic plan**  
  - **Executor Agent:** Takes **Resume JSON** and a plan and outputs a **rewritten resume**

- **Service Modules:**
  - `axios` → For making HTTP requests to external APIs (**Gemini, JSearch**)  
  - `pdf-parse` → Utility to extract text from uploaded PDF files  
  - `puppeteer` → Headless browser tool for **high-fidelity PDF generation**

---

### Frontend Components (`App.jsx`)

- **App:** Main component holding the **application state** and logic  
- **Input Forms:** Text areas and file upload zones for user input (`resume` and `jobDescription`)  
- **ResumeViewer:** Displays the final **tailored resume**, including **skills analysis**; uses **EditableField**  
- **EditableField:** Reusable component allowing any text to be clicked and **edited in place**  
- **SuggestedJobs:** Displays the list of jobs returned from the server and handles **pagination controls**

---

## 4. Chosen Technologies & Reasons

- **React (Frontend Framework):**  
  - Component-based architecture ideal for building **complex and reusable UI**  
  - Vast ecosystem and strong community support  

- **Node.js & Express.js (Backend):**  
  - Non-blocking, **event-driven architecture** efficient for I/O-heavy applications  
  - Express.js simplifies building a **robust REST API**  

- **Google Gemini (LLM):**  
  - Advanced reasoning and **instruction-following capabilities** essential for the multi-agent system  
  - `gemini-1.5-flash` provides a good balance of **speed and performance** for real-time experience  

- **Puppeteer (PDF Generation):**  
  - Converts **HTML/CSS → PDF** with high fidelity  
  - Ensures the downloaded PDF matches the **on-screen resume** exactly  

- **Tailwind CSS (Styling):**  
  - **Utility-first CSS framework** for rapid UI development  
  - Maintains a **consistent design system** throughout the application  

- **JSearch API (External Tool):**  
  - Provides **suggested jobs** feature with minimal development effort  
  - Completes the application as a **one-stop-shop for job seekers**
