const http = require('http');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6KxMhbDeVFGgowVCv_TBebwP9qRnFZKYwdbgBpbJtvSZw" });
const MODEL_NAME = 'gemini-1.5-flash';

const HISTORY_FILE = path.join(__dirname, 'chat_history.json');
const ARCHIVE_FILE = path.join(__dirname, 'saved_chats.json');

function loadFile(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (e) {
        console.error("Error loading file", e);
    }
    return [];
}

function saveFile(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error saving file", e);
    }
}

let chatHistory = loadFile(HISTORY_FILE);

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Get active chat history
    if (req.url === '/api/history' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(chatHistory));
        return;
    }

    // Get saved archive history
    if (req.url === '/api/saved-history' && req.method === 'GET') {
        const archives = loadFile(ARCHIVE_FILE);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(archives));
        return;
    }

    // Save current session to permanent archive
    if (req.url === '/api/save-session' && req.method === 'POST') {
        if (chatHistory.length > 0) {
            let archives = loadFile(ARCHIVE_FILE);
            archives.push({
                id: Date.now(),
                date: new Date().toLocaleString(),
                chats: chatHistory
            });
            saveFile(ARCHIVE_FILE, archives);
            chatHistory = [];
            saveFile(HISTORY_FILE, chatHistory);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Session saved successfully' }));
        return;
    }

    // Clear history manually
    if (req.url === '/api/clear' && req.method === 'POST') {
        chatHistory = [];
        saveFile(HISTORY_FILE, chatHistory);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // Handle chat message request
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body);
                const userMessage = parsed.message;

                if (!userMessage) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Message is required' }));
                    return;
                }

                // Call Gemini API with natural response instructions
                const response = await ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: userMessage,
                    config: {
                        systemInstruction: "You are ULJHAN AI, a personal AI assistant. Reply naturally, intelligently, and directly like a human friend in chat. Do not unnecessarily repeat your name or say 'You said: ...'. Keep answers concise, accurate, and fast."
                    }
                });

                const botReply = response.text || "Mujhe samajh nahi aaya, kripya dobara kahein.";
                const timestamp = new Date().toISOString();

                chatHistory.push({ role: 'user', text: userMessage, time: timestamp });
                chatHistory.push({ role: 'model', text: botReply, time: timestamp });
                saveFile(HISTORY_FILE, chatHistory);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: botReply }));
            } catch (error) {
                console.error('API Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: "Server error, kripya thodi der baad koshish karein." }));
            }
        });
        return;
    }

    // Serve static frontend files (HTML, CSS, JS)
    let filePath = path.join(__dirname, req.url === '/' ? 'public/index.html' : path.join('public', req.url));
    let extname = path.extname(filePath);
    let contentType = 'text/html';
    
    if (extname === '.js') contentType = 'text/javascript';
    else if (extname === '.css') contentType = 'text/css';
    else if (extname === '.json') contentType = 'application/json';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contqype });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
