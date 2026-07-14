import { createSlice } from '@reduxjs/toolkit';

const crmSlice = createSlice({
    name: 'crm',
    initialState: {
        chatHistory: [{ sender: 'ai', text: 'Hello! I am your AI CRM Assistant. How can I help you manage HCP interactions today?' }],
        recentLogs: []
    },
    reducers: {
        addMessage: (state, action) => {
            state.chatHistory.push(action.payload);
        },
        setRecentLogs: (state, action) => {
            state.recentLogs = action.payload;
        },
        addLog: (state, action) => {
            state.recentLogs.push(action.payload);
        },
        removeLog: (state, action) => {
            state.recentLogs = state.recentLogs.filter(log => log.id !== action.payload);
        }
    }
});

export const { addMessage, setRecentLogs, addLog, removeLog } = crmSlice.actions;
export default crmSlice.reducer;