# Intern Application Repository

## About Me

- **Name:** Amiya Piyush  
- **University:** IIT Bhubaneswar  
- **Department:** Civil Engineering  

This repository is associated with my intern application.




AI Resume Agent - Quick Local Setup
This guide provides the steps to get the application running on your local machine for development and testing.

## ⚙️ Prerequisites
Make sure you have the following installed on your system:

Node.js (v18.x or higher)

npm (usually comes with Node.js)

Git

## 🚀 Installation & Setup
1. Clone the Repository
Open your terminal and run the following command to clone the project:

Bash

git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
2. Install Dependencies
Install all the necessary npm packages for both the server and the client from the root directory:

Bash

npm install
3. Set Up Environment Variables
The project requires API keys to connect to external services.

First, create a .env file by copying the example file:

Bash

cp .env.example .env
Next, open the newly created .env file in a text editor and add your secret API keys:

# .env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
<br>
SEARCH_API_KEY="YOUR_JSEARCH_RAPIDAPI_KEY_HERE"
## ▶️ Running the Application
1. Start the Server
Once the setup is complete, you can start the backend server by running:

Bash

npm start
You should see a confirmation message in your terminal:
Server running on http://localhost:{port}

2. Access the App
Open your web browser and navigate to the following address:
http://localhost:{port}
