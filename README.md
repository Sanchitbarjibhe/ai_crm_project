AI-First CRM (HCP Module)
This is a web-based CRM (Customer Relationship Management) project designed specifically for Medical Representatives (MRs) in the pharmaceutical sector. With this application, representatives can easily maintain a detailed record of their meetings, calls, and other interactions with Healthcare Professionals (HCPs).

The standout feature of this project is its powerful AI-driven chat interface alongside traditional form-based data entry, allowing users to log entries seamlessly by communicating in natural language.

🚀 Features
Log via Structured Form: Log interactions conventionally by filling in the HCP's name, interaction type, and summary.

AI Chat Interface: Log entries through an AI agent using natural language commands (e.g., "Log a call with Dr. Rohan").

View and Edit Logs: View, edit, or delete all entries easily within a professional data table.

Schedule Follow-ups: Instantly set the specific date and time for the next meeting or call for each interaction.

View HCP History: Access the complete timeline of past interactions with any specific doctor by simply clicking on their name.

Search Product Information: Instantly fetch standard drug information (such as usage, indications, and side effects) using a quick search bar.

Modern UI: Provides a smooth user experience complete with skeleton loaders and clean modal transitions.

🛠️ Tech Stack
Frontend:

React.js

Redux Toolkit (for global state management)

Axios (for REST API communication)

CSS3 (for responsive styling)

Backend:

Python

FastAPI (high-performance asynchronous API framework)

SQLAlchemy (ORM for relational database mapping)

AI/LLM Layer:

LangChain & LangGraph (for orchestrating the AI agent logic)

Groq Cloud (for ultra-fast LLM inference using Llama 3.1)

Database:

SQLite

📂 Project Structure
ai_crm_project/
├── backend/         # All Python and FastAPI source code
│   ├── agent.py     # LangGraph AI Agent core logic
│   ├── main.py      # FastAPI routing and endpoints
│   ├── database.py  # SQLAlchemy database setup and models
│   └── crm.db       # Local SQLite database file
│
└── frontend/        # All React.js web assets
    ├── src/
    │   ├── App.js   # Main layout and components
    │   ├── App.css  # Application style sheets
    │   └── store/   # Redux slice configurations
    └── ...
⚙️ Setup and Installation
Follow the steps below to set up and run the application locally:

Prerequisites
Node.js and npm installed (for the Frontend)

Python 3.8+ and pip installed (for the Backend)

1. Backend Setup
Bash
# 1. Navigate to the backend directory
cd backend

# 2. Install the required Python dependencies
pip install -r requirements.txt

# 3. Configure the Groq API Key
# Set your environment variable inside a .env file or dynamically in agent.py:
# os.environ["GROQ_API_KEY"] = "your_actual_groq_api_key_here"

# 4. Fire up the development backend server
python main.py
The FastAPI backend server will start running locally at [http://127.0.0.1:8000](http://127.0.0.1:8000).

2. Frontend Setup
Open a separate terminal window and execute the following commands:

Bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install the necessary node packages
npm install

# 3. Start the React development server
npm start
The frontend user interface will spin up at http://localhost:3000 and should open automatically in your web browser.

💡 How to Use
Logging via Form: Fill out the fields in the "Log via Structured Form" panel and hit the submit button to directly add data.

Logging via AI Chat: Go to the "Chat with AI Agent" interface, type out your interaction in plain English (e.g., "Log a phone call with Dr. Rohan saying he liked CardioFlex"), and click Send to AI.

Managing Logs: Monitor all entries instantly inside the "Logged Interactions" table. You can use the inline context buttons to Schedule follow-ups, Edit past descriptions, or Delete an entry entirely.