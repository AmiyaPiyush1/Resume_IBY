**System Design Document: AI Resume Agent**
1. Architecture
The application is built on a standard Client-Server Architecture. This design separates the user interface (client) from the business logic and data processing (server), which is ideal for a web application that needs to perform heavy computations.

[System Design Diagram](https://drive.google.com/file/d/1aYBn0ZHfMgaGmE-eoar0vcerU9ru2qER/view?usp=drivesdk)


**Diagram of Flow:**
[User's Browser (React Frontend)] <--> [REST API (Node.js/Express Backend)] <--> [External Services (Google Gemini & JSearch API)]

**Client (Frontend):** A React single-page application that runs in the user's browser. It is responsible for all UI rendering, user input, and communicating with the backend via REST API calls.

**Server (Backend):** A Node.js application that exposes a REST API. It contains all the core logic, orchestrates the multi-agent workflow, communicates with external APIs (like Google Gemini), and handles tasks like PDF generation.

**Reason for this choice:** This architecture is highly scalable and maintainable. The frontend and backend can be developed, deployed, and scaled independently. It also secures sensitive information, like API keys, by keeping them on the server-side, never exposing them to the client.

**2. Data Design**
The primary data format is JSON.

**Data Schemas**
Resume JSON (Output of Extractor Agent): This is the core structured data object representing the user's resume.

JSON

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "linkedin": "string",
  "summary": "string",
  "skills": ["string", "string", ...],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "period": "string",
      "description": ["string", "string", ...]
    }
  ],
  "education": {
    "degree": "string",
    "university": "string",
    "period": "string"
  }
}


**Planner Agent Output:** The strategic plan created by the Planner.

JSON

{
  "extractedSkills": ["string", "string", ...],
  "skillGap": ["string", "string", ...],
  "rewritePlan": "string"
}
Final API Response (/api/process): The comprehensive object sent from the backend to the frontend.

JSON

{
  "tailoredResume": { /* See Resume JSON schema above */ },
  "analysis": { /* See Planner Agent Output schema above */ },
  "suggestedJobs": [ /* Array of job objects from JSearch API */ ],
  "jobSearchQuery": "string"
}



**Data Flow**
**Input:** The system receives unstructured data from the user: resumeText (string) and jobDescription (string).

**Extraction:** The Extractor Agent processes the resumeText and converts it into the structured Resume JSON format.

**Planning:** The Planner Agent takes the Resume JSON and jobDescription as input to produce the Planner Agent Output (the plan).

**Execution:** The Executor Agent uses the original Resume JSON and the rewritePlan from the planner's output to generate new summary and experience sections.

**Aggregation:** The backend combines the original resume data with the rewritten sections to form the tailoredResume object. It then bundles this with the analysis and suggestedJobs into the Final API Response and sends it to the frontend.



**3. Component Breakdown**
Backend Components (server.js)
Express Server: The foundation of the backend, responsible for routing API requests.

**API Endpoints:**

POST /api/process: The main controller that orchestrates the entire agent workflow.

GET /api/search-jobs: A dedicated endpoint for job search pagination.

POST /api/generate-pdf: An endpoint for converting HTML to a PDF file.

**AI Agents (Logical Components):**

**Extractor Agent:** Takes raw text and outputs structured Resume JSON.

**Planner Agent:** Takes Resume JSON and a job description and outputs a strategic plan.

**Executor Agent:** Takes Resume JSON and a plan and outputs a rewritten resume.

**Service Modules:**

axios: Used for making HTTP requests to external APIs (Gemini, JSearch).

pdf-parse: A utility to extract text from uploaded PDF files.

puppeteer: A headless browser tool used for high-fidelity PDF generation.

**Frontend Components (App.jsx)**
App: The main component that holds the application state and logic.

Input Forms: Text areas and file upload zones for the user to provide their resume and the job description.

ResumeViewer: A component that displays the final tailored resume, including the skills analysis. It makes use of the EditableField component.

EditableField: A reusable component that allows any text on the screen to be clicked and edited in place.

SuggestedJobs: A component that displays the list of jobs returned from the server and handles the pagination controls.


**4. Chosen Technologies & Reasons for the Choices**
**React (Frontend Framework):** Its component-based architecture is perfect for building a complex and reusable UI. The vast ecosystem and strong community support make it a reliable choice for creating dynamic single-page applications.



**Node.js & Express.js (Backend):** Node.js's non-blocking, event-driven architecture is highly efficient for I/O-heavy applications like this one, which involves many API calls. Express.js is a minimal and flexible framework that simplifies the process of building a robust REST API.




**Google Gemini (LLM):** Chosen for its advanced reasoning and instruction-following capabilities, which are essential for the multi-agent (Extractor, Planner, Executor) system. The gemini-1.5-flash model provides a great balance of speed and performance for a real-time user experience.



**Puppeteer (PDF Generation):** It provides the highest fidelity for converting HTML and CSS to a PDF. By rendering the content in a real headless Chrome browser, it ensures that the downloaded PDF looks exactly like the resume displayed on the screen, preserving all styling.



**Tailwind CSS (Styling):** A utility-first CSS framework that allows for rapid UI development without writing custom CSS. It's highly customizable and helps maintain a consistent design system throughout the application.



**JSearch API (External Tool)**: Integrating an external job search tool adds significant value for the user with minimal development effort. It makes the application a more complete "one-stop-shop" for job seekers.
