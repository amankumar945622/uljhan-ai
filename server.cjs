const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;
const HISTORY_FILE = path.join(__dirname, 'chat_history.json');

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load History
function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }
    } catch (e) {
        console.error("Error loading history", e);
    }
    return [];
}

// Save History
function saveHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    } catch (e) {
        console.error("Error saving history", e);
    }
}

let chatHistoryLog = loadHistory();

app.use(express.static(__dirname));

app.get('/api/history', (req, res) => {
    res.json(chatHistoryLog);
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, media } = req.body;
        chatHistoryLog.push({ role: 'user', text: message, media: media });

        let contents = message;
        if (media) {
            const base64Data = media.split(';base64,').pop();
            const mimeType = media.split(';')[0].split(':')[1];
            contents = [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                message || "Describe or analyze this file."
            ];
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
        });

        const replyText = response.text || "Mujhe samajh nahi aaya, kripya dobara puchein.";
        chatHistoryLog.push({ role: 'bot', text: replyText });
        saveHistory(chatHistoryLog);

        res.json({ reply: replyText });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ reply: "Server error, kripya API key ya network check karein." });
    }
});

app.post('/api/clear', (req, res) => {
    chatHistoryLog = [];
    if (fs.existsSync(HISTORY_FILE)) {
        fs.unlinkSync(HISTORY_FILE);
    }
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
