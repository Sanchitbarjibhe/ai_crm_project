import { createSlice } from '@reduxjs/toolkit';

const crmSlice = createSlice({
    name: 'crm',
    initialState: {
        chatHistory: [{ sender: 'ai', text: 'Hello! I am your AI CRM Assistant. How can I help you manage HCP interactions today?' }],
        recentLogs: []
    },
    reducers: {
        addMessage: (state, action) => {
            // action.payload can now include { sender, text, rateLimit }
            state.chatHistory.push(action.payload);
        },
        setRecentLogs: (state, action) => {
            state.recentLogs = action.payload;
        },
        removeLog: (state, action) => {
            state.recentLogs = state.recentLogs.filter(log => log.id !== action.payload);
        }
    }
});

export const { addMessage, setRecentLogs, removeLog } = crmSlice.actions;
export default crmSlice.reducer;