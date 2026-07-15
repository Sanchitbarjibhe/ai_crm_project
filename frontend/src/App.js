import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage, addLog, setRecentLogs, removeLog } from './store/crmSlice';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000/api';

function App() {
    const dispatch = useDispatch();
    const { chatHistory, recentLogs } = useSelector((state) => state.crm);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;



    // Form State
    const [formData, setFormData] = useState({ hcp_name: '', interaction_type: 'In-Person', summary: '' });
    // Chat Input State
    const [editingId, setEditingId] = useState(null); // Which Log ID going to edit
    const [selectedHcpHistory, setSelectedHcpHistory] = useState(null);
    const [followUpDates, setFollowUpDates] = useState({});
    const [isLoading, setIsLoading] = useState(true); // New state for loading skeleton
    const [productQuery, setProductQuery] = useState('');
    const [productResult, setProductResult] = useState('');
    //Mic SpeechRecognition state
    const [isListening, setIsListening] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false); // State for AI typing loader

    // DB operation to fetch stored log interactions
    useEffect(() => {
        setIsLoading(true);
        axios.get(`${API_BASE}/interactions`)
            .then(res => dispatch(setRecentLogs(res.data)))
            .catch(err => console.log(err))
            .finally(() => setIsLoading(false));
    }, [dispatch]);




    if (recognition) {
        recognition.continuous = false; // Recording will stop when speech ends
        recognition.lang = 'en-US';    // For English language (because our LLM understands English)
        recognition.interimResults = false; // Will only show final results
    }

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
                await axios.put(`http://localhost:8000/api/interactions/${editingId}`, formData);

                const refreshedLogs = await axios.get('http://localhost:8000/api/interactions');
                dispatch(setRecentLogs(refreshedLogs.data));

                setEditingId(null); // FOR CLOSE TO EDIT MORE
                alert("Interaction Successfully Stored In DB");

            } else {
                // ➕ CREATE MODE: For new data save
                const response = await axios.post('http://localhost:8000/api/form-log', formData);


                dispatch(addLog(response.data));

                alert("Interaction Successfully Stored in DB");
            }

            // 🧹 FOR CLEARING FORM AFTER STORED IN DB
            setFormData({ hcp_name: '', interaction_type: 'In-Person Meeting', summary: '' });

        } catch (err) {
            // 🚨 CATCH BLOCK: ERROR HANDLEING
            console.error("Submission process failed:", err);
            alert("⚠️ UPDATE AND CREATION FAILED. SEE TERMINAL");
        }
    };

    const handleViewHistory = async (hcpName) => {
        try {
            const res = await axios.get(`http://localhost:8000/api/interactions/history/${hcpName}`);
            setSelectedHcpHistory({ name: hcpName, logs: res.data });
        } catch (err) {
            alert(`No previous history found for ${hcpName}`);
            setSelectedHcpHistory(null);
        }
    };

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

    // 2. Conversational Chat Sending To DB (LangGraph Agent) 
    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userMsg = { sender: 'user', text: chatInput };
        dispatch(addMessage(userMsg));
        const currentInput = chatInput;
        setChatInput('');
        setIsAiTyping(true); // Start loader

        try {
            const res = await axios.post(`${API_BASE}/chat`, { message: currentInput });
            dispatch(addMessage({ sender: 'ai', text: res.data.response }));

            //REFRESH CHATBOX AFTER AI MESSAGE DONE IN CHATBOX
            const refreshedLogs = await axios.get(`${API_BASE}/interactions`);
            dispatch(setRecentLogs(refreshedLogs.data));

        } catch (err) {
            dispatch(addMessage({ sender: 'ai', text: "Sorry, there was an error connecting to the server." }));
            console.error("Error sending message to AI:", err);
        } finally {
            setIsAiTyping(false); // Stop loader
        }
    };

    const handleScheduleFollowUp = async (interactionId, hcpName) => {
        const selectedDate = followUpDates[interactionId];
        if (!selectedDate) {
            alert("Please choose a date and time before proceeding.");
            return;
        }

        try {
            //BACKEND DB UPDATE
            await axios.put(`http://localhost:8000/api/interactions/schedule/${interactionId}`, {
                next_follow_up: selectedDate
            });

            alert(`Follow-up with Dr. ${hcpName} has been scheduled for ${selectedDate}!`);

            //FOR TABLE UPDATE
            const refreshedLogs = await axios.get('http://localhost:8000/api/interactions');
            dispatch(setRecentLogs(refreshedLogs.data));
        } catch (err) {
            console.error("Scheduling failed:", err);
        }
    };

    return (
        <div>
            <h1 style={{ textAlign: 'center', marginBottom: '40px', fontWeight: '700' }}>AI-First CRM (HCP Module)</h1>

            <div className="container">
                {/* Left side: Structured Form */}
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
                        <h2>Chat with AI Agent</h2>
                        <p style={{ fontSize: '13px', color: '#666' }}>Try typing: *"Log a phone call with Dr. Rohan saying he liked CardioFlex"*</p>
                        <div className="chat-box">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`msg ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'}`}>
                                    <strong>{msg.sender === 'user' ? 'You' : 'CRM Agent'}:</strong> {msg.text}
                                </div>
                            ))}
                            {isAiTyping && (
                                <div className="msg ai-msg typing-indicator">
                                    <strong>CRM Agent:</strong> <span></span><span></span><span></span>
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
                        <button
                            type="button"
                            onClick={handleVoiceInput}
                            className={`mic-btn ${isListening ? 'listening' : ''}`}
                            title="Use Voice"
                        >
                            {isListening ? '🔴' : '🎙️'}
                        </button>
                        <button onClick={handleSendMessage} className="send-ai-btn">
                            Send to AI
                        </button>
                    </div>
                </div>
            </div>

            {/* DATABASE LOG INTERACTION */}
            < div className="card" style={{ marginTop: '30px', maxWidth: '1200px', margin: '30px auto' }}>
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
                                    <th style={{ width: '320px' }}>Scheduled</th>
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
                                    <th style={{ width: '320px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs && recentLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{log.id}</td>
                                        <td>
                                            <button onClick={() => handleViewHistory(log.hcp_name)} className="link-button">
                                                {log.hcp_name}
                                            </button>
                                        </td>
                                        <td>{log.interaction_type}</td>
                                        <td className="summary-cell">{log.summary}</td>
                                        <td>
                                            {log.next_follow_up
                                                ? new Date(log.next_follow_up).toLocaleString()
                                                : 'Not Scheduled'}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <input
                                                    type="datetime-local"
                                                    className="action-input"
                                                    value={followUpDates[log.id] || ''}
                                                    onChange={(e) => setFollowUpDates({ ...followUpDates, [log.id]: e.target.value })}
                                                />
                                                <button onClick={() => handleScheduleFollowUp(log.id, log.hcp_name)} className="action-btn schedule-btn" title="Schedule">
                                                    Schedule
                                                </button>
                                                <button onClick={() => handleEditClick(log)} className="action-btn edit-btn" title="Edit">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(log.id)} className="action-btn delete-btn" title="Delete">
                                                    Delete
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
            </div >
        </div >
    );
}

export default App;