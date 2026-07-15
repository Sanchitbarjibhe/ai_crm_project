# AI-First CRM (HCP Module)

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Redux](https://img.shields.io/badge/State_Management-Redux-764ABC?style=flat-square&logo=redux)](https://redux-toolkit.js.org/)
[![Groq](https://img.shields.io/badge/LLM_Inference-Groq-orange?style=flat-square)](https://groq.com/)

A modern, web-based Customer Relationship Management (CRM) application tailored specifically for **Medical Representatives (MRs)** in the pharmaceutical sector. This application enables representatives to maintain detailed records of meetings, phone calls, and interactions with **Healthcare Professionals (HCPs)**.

The core strength of this system is its dual-input design: it combines a highly structured data-entry form with an **AI-driven chat interface**, allowing users to log records using natural language.

---

## 🚀 Key Features

*   **Log via Structured Form:** Register interactions by manually completing fields for HCP name, interaction type, and summary.
*   **AI Chat Interface:** Talk naturally to a conversational AI agent (powered by Llama 3.1) to log entries instantly (e.g., *"Log a call with Dr. Rohan"*).
*   **Interactive Log Table:** View, edit, or delete logged interactions inside a clean, modern data table.
*   **Inline Follow-up Scheduling:** Choose dates and times directly from the table to schedule future interactions with HCPs.
*   **HCP Timeline History:** Click an HCP's name to display a timeline modal summarizing all historical interactions with that particular doctor.
*   **Quick Product Search:** Retrieve critical drug information (e.g., usages, active ingredients, side effects) via a fast search utility.
*   **Refined UX:** Features modern UI components, smooth transitions, skeleton loaders, and responsive alignment.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React.js** | Interactive user interface |
| | **Redux Toolkit** | Centralized global state management |
| | **Axios** | Efficient API requests |
| | **CSS3** | Responsive, modern grid & layout design |
| **Backend** | **Python & FastAPI** | Ultra-fast, asynchronous API endpoints |
| | **SQLAlchemy** | Object-Relational Mapping (ORM) |
| **AI / LLM** | **LangChain & LangGraph** | AI agent workflow orchestration |
| | **Groq Cloud** | High-speed Llama 3.1 model inference |
| **Database** | **SQLite** | Lightweight, file-based relational storage |

---

## 📂 Project Structure

```text
ai_crm_project/
├── backend/         # Python FastAPI backend service
│   ├── agent.py     # AI agent core logic (LangGraph)
│   ├── main.py      # FastAPI routing & API endpoints
│   ├── database.py  # SQLAlchemy models & DB connection
│   └── crm.db       # Local SQLite database file
│
└── frontend/        # React web application
    ├── src/
    │   ├── App.js   # Main application component & layouts
    │   ├── App.css  # Global styles & layout customization
    │   └── store/   # Redux Toolkit state & slices
    └── ...

⚙️ Setup and Installation
Follow these steps to run the frontend and backend servers locally:

Prerequisites
Node.js & npm (for the frontend React app)

Python 3.8+ & pip (for the backend service)

1. Backend Setup
Open your terminal, navigate to the backend folder, install dependencies, and run the FastAPI server:

Bash
# Navigate to backend directory
cd backend

# Install the required Python dependencies
pip install -r requirements.txt

# Configure your Groq API Key
# Create a .env file inside the backend folder or set it in agent.py:
# os.environ["GROQ_API_KEY"] = "your_actual_groq_api_key_here"

# Start the local development server
python main.py
🌐 The backend API service will run locally at http://127.0.0.1:8000.

2. Frontend Setup
Open a separate terminal window, navigate to the frontend directory, and spin up the web app:

Bash
# Navigate to frontend directory
cd frontend

# Install the necessary npm packages
npm install

# Start the React local development server
npm start
🖥️ The frontend user interface will spin up at http://localhost:3000 and automatically load in your browser.

💡 How to Use
Form-Based Logging: Navigate to the "Log via Structured Form" panel, enter your interaction details, and click Submit Form.

AI-Agent Logging: Go to the "Chat with AI Agent" box, type out what happened in plain English (e.g., "Log a phone call with Dr. Rohan saying he liked CardioFlex"), and hit Send to AI.

Managing Records: Check the "Logged Interactions" list. Here, you can:

Click Schedule to quickly save a follow-up appointment.

Click Edit to modify details inline.

Click the HCP Name directly to review that specific physician's past logs.
