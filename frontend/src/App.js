import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage, setRecentLogs, removeLog } from './store/crmSlice';
import { FaUserCircle, FaMicrophone, FaEdit, FaTrash, FaCalendarAlt, FaStethoscope } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { FaWandMagicSparkles as FaSparkles } from 'react-icons/fa6';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000/api';

const Header = () => (
    <header className="app-header">
        <div className="logo">
            <FaStethoscope />
        </div>
        <h1>AI-First CRM (HCP Module)</h1>
    </header>
);

function App() {
    // --- Redux State and Dispatch ---
    const dispatch = useDispatch();
    const { chatHistory, recentLogs } = useSelector((state) => state.crm);

    // --- Browser API Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    // --- Component State Management ---
    // State for the structured form and editing mode
    const [formData, setFormData] = useState({ hcp_name: '', interaction_type: 'In-Person', summary: '' });
    const [editingId, setEditingId] = useState(null);
    // State for the HCP history modal
    const [selectedHcpHistory, setSelectedHcpHistory] = useState(null);
    // State for the date inputs in the interaction table
    const [followUpDates, setFollowUpDates] = useState({});
    // State for the main table's initial loading skeleton
    const [isLoading, setIsLoading] = useState(true);
    // State for chat input, voice recognition, and UI feedback
    const [isListening, setIsListening] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [rateLimitInfo, setRateLimitInfo] = useState(null);
    const [isAiTyping, setIsAiTyping] = useState(false);

    // --- Data Fetching Effect ---
    // On initial component mount, fetch all interaction logs from the database.
    useEffect(() => {
        setIsLoading(true);
        axios.get(`${API_BASE}/interactions`)
            .then(res => dispatch(setRecentLogs(res.data)))
            .catch(err => console.log(err))
            .finally(() => setIsLoading(false));
    }, [dispatch]);

    // --- Speech Recognition Configuration ---
    // Configure the speech recognition instance if the browser supports it.
    if (recognition) {
        recognition.continuous = false; // Recording will stop when speech ends
        recognition.lang = 'en-US';    // For English language (because our LLM understands English)
        recognition.interimResults = false; // Will only show final results
    }

    // --- Event Handlers ---
    const handleVoiceInput = () => {
        if (!recognition) {
            alert("Your browser does not support voice recording. Please use Google Chrome!");
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            setIsListening(true);
            recognition.start();

            recognition.onresult = (event) => {
                const speechToText = event.results[0][0].transcript;
                setChatInput(speechToText); // This text will go directly into the input box
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };
        }
    };

    // Handles submission of the structured form for both creating and updating interactions.
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        // 🛑 Validation
        if (!formData.hcp_name.trim()) {
            alert("Please enter HCP / Doctor Name!");
            return;
        }
        if (!formData.summary.trim()) {
            alert("Please do not leave the Interaction Summary empty!");
            return;
        }

        try {
            if (editingId) {
                // If an `editingId` exists, we are in update mode.
                await axios.put(`${API_BASE}/interactions/${editingId}`, formData); // Using API_BASE
                setEditingId(null); // FOR CLOSE TO EDIT MORE
                alert("Interaction Successfully Stored In DB");

            } else {
                // Otherwise, we are in create mode.
                await axios.post(`${API_BASE}/form-log`, formData); // Using API_BASE
                alert("Interaction Successfully Stored in DB");
            }

            // After any successful submission, refresh the entire log list to keep the UI in sync.
            const refreshedLogs = await axios.get(`${API_BASE}/interactions`); // Using API_BASE
            dispatch(setRecentLogs(refreshedLogs.data));

            // Clear the form fields for the next entry.
            setFormData({ hcp_name: '', interaction_type: 'In-Person Meeting', summary: '' });

        } catch (err) {
            // 🚨 CATCH BLOCK: ERROR HANDLEING
            console.error("Submission process failed:", err);
            alert("⚠️ UPDATE AND CREATION FAILED. SEE TERMINAL");
        }
    };

    // Fetches and displays the interaction history for a specific HCP in a modal.
    const handleViewHistory = async (hcpName) => {
        try {
            const res = await axios.get(`${API_BASE}/interactions/history/${hcpName}`); // Using API_BASE
            setSelectedHcpHistory({ name: hcpName, logs: res.data });
        } catch (err) {
            alert(`No previous history found for ${hcpName}`);
            setSelectedHcpHistory(null);
        }
    };

    // Populates the structured form with data from an existing log to prepare for editing.
    const handleEditClick = (log) => {
        setEditingId(log.id); // Save the ID of the row being edited
        setFormData({
            hcp_name: log.hcp_name || '',
            interaction_type: log.interaction_type || 'In-Person Meeting',
            summary: log.summary || ''
        });

        // Scroll the screen up to the form (optional but user-friendly)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Deletes an interaction after a user confirmation.
    const handleDelete = async (interactionId) => {
        if (window.confirm(`Are you sure you want to delete interaction ID ${interactionId}? This action cannot be undone.`)) {
            try {
                await axios.delete(`${API_BASE}/interactions/${interactionId}`);
                dispatch(removeLog(interactionId)); // Remove from Redux state
                alert('Interaction deleted successfully.');
            } catch (err) {
                console.error("Delete failed:", err);
                alert("⚠️ Delete failed. See console for details.");
            }
        }
    };

    // Handles sending a user's message from the chatbox to the AI agent backend.
    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const currentInput = chatInput;
        dispatch(addMessage({ sender: 'user', text: currentInput }));
        setChatInput('');
        setIsAiTyping(true); // Start loader

        try {
            // 1. Send the user's message to the backend.
            const res = await axios.post(`${API_BASE}/chat`, { message: currentInput });

            // 2. Update the token rate limit info displayed in the UI.
            if (res.data.rate_limit && res.data.rate_limit.limit) {
                setRateLimitInfo(res.data.rate_limit);
            }

            // 3. Add the AI's response to the chat history.
            dispatch(addMessage({
                sender: 'ai',
                text: res.data.response
            }));

            // 4. Refresh the interaction logs table in case the AI performed an action.
            const refreshedLogs = await axios.get(`${API_BASE}/interactions`); // Using API_BASE
            dispatch(setRecentLogs(refreshedLogs.data));

        } catch (err) {
            console.error("Error sending message to AI:", err);

            // Check if the error is a rate limit error from the backend's detailed message.
            if (err.response && err.response.data && err.response.data.detail && err.response.data.detail.includes('rate_limit_exceeded')) {
                // If it's a rate limit error, show a specific message
                dispatch(addMessage({ sender: 'ai', text: "API rate limit reached. Please try again later." }));
            } else {
                // For all other errors, show a generic error message
                dispatch(addMessage({ sender: 'ai', text: "Sorry, an unexpected error occurred." }));
            }
        } finally {
            setIsAiTyping(false); // Stop loader
        }
    };

    // Handles scheduling a follow-up for a specific interaction using the date from the table.
    const handleScheduleFollowUp = async (interactionId, hcpName) => {
        const selectedDate = followUpDates[interactionId];
        if (!selectedDate) {
            alert("Please choose a date and time before proceeding.");
            return;
        }

        try {
            // Send the selected date to the backend to update the database.
            await axios.put(`${API_BASE}/interactions/schedule/${interactionId}`, { // Using API_BASE
                next_follow_up: selectedDate
            });

            alert(`Follow-up with Dr. ${hcpName} has been scheduled for ${selectedDate}!`);

            // Refresh the logs to show the newly scheduled date in the table.
            const refreshedLogs = await axios.get(`${API_BASE}/interactions`); // Using API_BASE
            dispatch(setRecentLogs(refreshedLogs.data));
        } catch (err) {
            console.error("Scheduling failed:", err);
        }
    };

    return (
        <div>
            <Header />
            <main className="main-content">
                {/* Left side: Structured Form */}
                <div className="container">
                    <div className="card">
                        <h2>Log via Structured Form</h2>
                        <form onSubmit={handleFormSubmit}>
                            <label>HCP / Doctor Name</label>
                            <input type="text" value={formData.hcp_name} onChange={(e) => setFormData({ ...formData, hcp_name: e.target.value })} placeholder="Dr. Smith" />

                            <label>Interaction Type</label>
                            <select value={formData.interaction_type} onChange={(e) => setFormData({ ...formData, interaction_type: e.target.value })}>
                                <option value="In-Person">In-Person Meeting</option>
                                <option value="Call">Phone Call</option>
                                <option value="Email">Email Follow-up</option>
                            </select>

                            <label>Interaction Summary</label>
                            <textarea rows="4" value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Discussed CardioFlex 10mg. Doctor requested samples..."></textarea>

                            <button type="submit" className="btn btn-primary">
                                {editingId ? 'Update Interaction' : 'Submit Form'}
                            </button>
                        </form>
                    </div>

                    {/* Right side: Conversational Chat Interface */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2>Chat with AI Agent</h2>
                                {rateLimitInfo && (
                                    <div className="rate-limit-info">
                                        Tokens: {rateLimitInfo.remaining} / {rateLimitInfo.limit}

                                    </div>
                                )}
                            </div>
                            <p style={{ fontSize: '13px', color: '#666' }}>Try typing: *"Log a phone call with Dr. Rohan saying he liked CardioFlex"*</p>
                            <div className="chat-box">
                                {chatHistory.map((msg, index) => (
                                    <div key={index} className={`msg-wrapper ${msg.sender}-wrapper`}>
                                        <div className="msg-icon">
                                            {msg.sender === 'user' ? (
                                                <FaUserCircle />
                                            ) : (
                                                <FaSparkles />
                                            )}
                                        </div>
                                        <div className="msg">
                                            <div className="msg-sender">
                                                {msg.sender === 'user' ? 'You' : 'CRM Agent'}
                                            </div>
                                            <div className="msg-text">{msg.text}</div>
                                        </div>
                                    </div>
                                ))}
                                {isAiTyping && (
                                    <div className="msg-wrapper ai-wrapper">
                                        <div className="msg-icon"><FaSparkles /></div>
                                        <div className="msg">
                                            <div className="msg-sender">CRM Agent</div>
                                            <div className="skeleton skeleton-text" style={{ width: '80px', marginBottom: '10px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '120px' }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="chat-input-area">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type interaction or tool command..."
                                className="chat-input-field"
                            />
                            <button onClick={handleSendMessage} className="send-ai-btn" title="Send">
                                <IoSend />
                            </button>
                            <button
                                type="button"
                                onClick={handleVoiceInput}
                                className={`mic-btn ${isListening ? 'listening' : ''}`}
                                title="Use Voice"
                            >
                                <FaMicrophone />
                            </button>
                        </div>
                    </div>
                </div>

                {/* DATABASE LOG INTERACTION */}
                <div className="card full-width-card">
                    <h2>Logged Interactions</h2>
                    <div className="table-container">
                        {isLoading ? (
                            <table className="interactions-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>HCP Name</th>
                                        <th>Type</th>
                                        <th>Summary</th>
                                        <th>Next Follow-up</th>
                                        <th className="actions-column">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(3)].map((_, index) => (
                                        <tr key={index}>
                                            <td><div className="skeleton skeleton-text" style={{ width: '30px' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                                            <td><div className="skeleton skeleton-text"></div><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ height: '30px', width: '280px' }}></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : recentLogs.length === 0 ? <p>No logs found.</p> : (
                            <table className="interactions-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>HCP Name</th>
                                        <th>Type</th>
                                        <th>Summary</th>
                                        <th>Next Follow-up</th>
                                        <th className="actions-column">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentLogs && recentLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td data-label="ID">{log.id}</td>
                                            <td data-label="HCP Name">
                                                <button onClick={() => handleViewHistory(log.hcp_name)} className="link-button">
                                                    {log.hcp_name}
                                                </button>
                                            </td>
                                            <td data-label="Type">{log.interaction_type}</td>
                                            <td data-label="Summary" className="summary-cell">{log.summary}</td>
                                            <td data-label="Next Follow-up">
                                                {log.next_follow_up
                                                    ? new Date(log.next_follow_up).toLocaleString()
                                                    : 'Not Scheduled'}
                                            </td>
                                            <td data-label="Actions">
                                                <div className="actions-cell">
                                                    <input
                                                        type="datetime-local"
                                                        className="action-input"
                                                        value={followUpDates[log.id] || ''}
                                                        onChange={(e) => setFollowUpDates({ ...followUpDates, [log.id]: e.target.value })}
                                                    />
                                                    <button onClick={() => handleScheduleFollowUp(log.id, log.hcp_name)} className="action-btn schedule-btn"
                                                        title="Schedule">
                                                        <FaCalendarAlt />
                                                    </button>
                                                    <button onClick={() => handleEditClick(log)} className="action-btn edit-btn" title="Edit">
                                                        <FaEdit />
                                                    </button>
                                                    <button onClick={() => handleDelete(log.id)} className="action-btn delete-btn" title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* HCP History Modal */}
                    {selectedHcpHistory && (
                        <div className="modal-overlay" onClick={() => setSelectedHcpHistory(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Interaction History for {selectedHcpHistory.name}</h3>
                                    <button onClick={() => setSelectedHcpHistory(null)} className="modal-close-btn">&times;</button>
                                </div>
                                <div className="modal-body">
                                    {selectedHcpHistory.logs.length > 0 ? (
                                        <ul className="history-list">
                                            {selectedHcpHistory.logs.map((hLog) => (
                                                <li key={hLog.id} className="history-item">
                                                    <div className="history-item-header"><strong>Type: {hLog.interaction_type}</strong><span>ID: {hLog.id}</span></div>
                                                    <p>{hLog.summary}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p>No history found.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div >
    );
}

export default App;