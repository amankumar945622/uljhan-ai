const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', (req, res) => {
    const userMessage = req.body.message;
    console.log("User ka message aaya:", userMessage);
    const aiResponse = `Google Server Active! Aapne bheja: "${userMessage}"`;
    res.json({ reply: aiResponse });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
