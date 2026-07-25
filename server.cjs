const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Google Server API Key (Yahan apni Google Gemini API Key dalein)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'YAHAN_APNI_GOOGLE_API_KEY_DALEN';

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    console.log("User ka message aaya:", userMessage);

    try {
        if (GOOGLE_API_KEY === 'YAHAN_APNI_GOOGLE_API_KEY_DALEN') {
            return res.json({ 
                reply: "Google Server Error: Kripya server.cjs mein apni valid Google API Key set karein." 
            });
        }

        // Seedha Google ke official server par request bhej rahe hain
        const fetch = (await import('node-fetch')).default;
        const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await googleResponse.json();

        // Google server ke response se text nikalna
        let googleReply = "Google server se koi response nahi mila.";
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            googleReply = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            googleReply = `Google Server Error: ${data.error.message}`;
        }

        res.json({ reply: googleReply });

    } catch (error) {
        console.error("Connection Error:", error);
        res.json({ reply: "Google server se connect hone mein samasya aa rahi hai." });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pure Google Connected Server is running on port ${PORT}`);
});
