# AI-First CRM (HCP Module)

This is a web-based CRM (Customer Relationship Management) project designed specifically for representatives in the pharmaceutical sector (Medical Representatives). With this application, representatives can easily keep a record of their meetings, calls, and other interactions with Healthcare Professionals (HCPs).

The unique feature of this project is that along with traditional form-based data entry, it also includes a powerful AI-driven chat interface, allowing users to log entries by communicating in natural language.

## 🚀 Features

- **Log via Structured Form:** Log entries traditionally by filling in the HCP's name, interaction type, and summary.
- **AI Chat Interface:** Log entries through an AI agent by giving commands in natural language (e.g., "Log a call with Dr. Rohan").
- **View and Edit Logs:** View, edit, or delete all entries in a professional table.
- **Schedule Follow-ups:** Set the date and time for the next meeting or call for each entry.
- **View HCP History:** See the entire history of past interactions with any HCP in a pop-up by clicking on their name.
- **Search Product Information:** Quickly find information about medicines (e.g., usage, side effects).
- **Modern UI:** Excellent user experience with skeleton loading and an attractive modal view.

## 🛠️ Tech Stack

- **Frontend:**
  - React.js
  - Redux Toolkit (for State Management)
  - Axios (for API Calls)
  - CSS3 (for Styling)

- **Backend:**
  - Python
  - FastAPI (API Framework)
  - SQLAlchemy (for Database Communication)

- **AI/LLM:**
  - LangChain & LangGraph (for creating the AI agent)
  - Groq (for LLM Service - Llama 3.1)

- **Database:**
  - SQLite

## 📂 Project Structure

```
ai_crm_project/
├── backend/         # सर्व Python आणि FastAPI कोड
│   ├── agent.py     # LangGraph AI एजंट
│   ├── main.py      # FastAPI API एंडपॉइंट्स
│   ├── database.py  # डेटाबेस सेटअप आणि मॉडेल
│   └── crm.db       # SQLite डेटाबेस फाइल
│
└── frontend/        # सर्व React.js कोड
    ├── src/
    │   ├── App.js   # मुख्य UI घटक
    │   ├── App.css  # स्टायलिंग
    │   └── store/   # Redux स्लाइस
    └── ...
```

## ⚙️ सेटअप आणि इन्स्टॉलेशन (Setup and Installation)

हा प्रकल्प चालवण्यासाठी खालील पायऱ्या फॉलो करा:

### पूर्वतयारी (Prerequisites)
- Node.js आणि npm (फ्रंटएंडसाठी)
- Python 3.8+ आणि pip (बॅकएंडसाठी)

### १. बॅकएंड सेटअप (Backend Setup)

```bash
# 1. backend फोल्डरमध्ये जा
cd backend

# 2. आवश्यक लायब्ररी इन्स्टॉल करा
pip install -r requirements.txt

# 3. Groq API की सेट करा
# agent.py फाइलमध्ये तुमची Groq API की टाका.
# os.environ["GROQ_API_KEY"] = "तुमची_GROQ_API_की"

# 4. बॅकएंड सर्व्हर सुरू करा
python main.py
```
बॅकएंड सर्व्हर `http://127.0.0.1:8000` वर सुरू होईल.

### २. फ्रंटएंड सेटअप (Frontend Setup)

नवीन टर्मिनल उघडा आणि खालील कमांड्स चालवा:

```bash
# 1. frontend फोल्डरमध्ये जा
cd frontend

# 2. आवश्यक पॅकेजेस इन्स्टॉल करा
npm install

# 3. React ॲप्लिकेशन सुरू करा
npm start
```
फ्रंटएंड `http://localhost:3000` वर सुरू होईल आणि आपोआप तुमच्या ब्राउझरमध्ये उघडेल.

## वापर कसा करावा (How to Use)

1.  **फॉर्मद्वारे नोंद:** "Log via Structured Form" या विभागातील फॉर्म भरा आणि "Submit Form" बटणावर क्लिक करा.
2.  **AI चॅटद्वारे नोंद:** "Chat with AI Agent" या विभागातील चॅट बॉक्समध्ये नैसर्गिक भाषेत कमांड लिहा (उदा. "Log a phone call with Dr. Rohan saying he liked CardioFlex") आणि "Send to AI" बटणावर क्लिक करा.
3.  **इतर क्रिया:** "Logged Interactions" टेबलमध्ये तुम्ही नोंदी पाहू शकता, तसेच प्रत्येक नोंदीसमोरील बटन्स वापरून **Schedule**, **Edit**, किंवा **Delete** करू शकता.