// --- UI Elements ---
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const homeContainer = document.getElementById('home-container');
const optionButtons = document.querySelectorAll('.option-button');

// --- Helper Functions ---

// 1. Home screen hide karke chat area dikhata hai
function showChatUI() {
    homeContainer.style.display = 'none';
    chatMessages.style.display = 'flex';
}

// 2. Message HTML banata hai (User ya AI)
function createMessageElement(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    const textP = document.createElement('p');
    textP.textContent = text;
    messageDiv.appendChild(textP);

    // Agar AI message hai, toh niche buttons add karein
    if (sender === 'ai') {
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('ai-message-actions');

        const copyBtn = createActionButton('fa-copy', 'Copy Text', () => copyText(text));
        const speakBtn = createActionButton('fa-volume-up', 'Speak Text', () => speakText(text));
        
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(speakBtn);
        
        messageDiv.appendChild(actionsDiv);
    }

    return messageDiv;
}

// Helper to create action buttons (Copy/Speaker)
function createActionButton(iconClass, title, onClick) {
    const btn = document.createElement('button');
    btn.classList.add('action-btn');
    btn.title = title;
    btn.onclick = onClick;
    btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
    return btn;
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Action Functions ---

async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // UI Update: Chat dikhayein, input clear karein, disable karein
    showChatUI();
    userInput.value = '';
    sendButton.disabled = true;

    // User message add karein
    chatMessages.appendChild(createMessageElement(text, 'user'));
    scrollToBottom();

    // Server ko request bhejein
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
        });

        if (!response.ok) throw new Error('Server Error');

        const data = await response.json();
        const botResponse = data.response || 'No response from AI.';
        
        // AI message add karein (buttons ke sath)
        chatMessages.appendChild(createMessageElement(botResponse, 'ai'));
        scrollToBottom();

    } catch (error) {
        console.error('Error:', error);
        chatMessages.appendChild(createMessageElement('Server error, kripya thodi der baad koshish karein.', 'ai'));
        scrollToBottom();
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

// --- Utility Functions ---
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Optional: Add a visual cue that text was copied
        console.log('Text copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function speakText(text) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

// --- Event Listeners ---

// Send Button Click
sendButton.addEventListener('click', handleSendMessage);

// Enter Key in Input
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

// Clickable options on home screen
optionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const promptText = button.querySelector('span').textContent.trim();
        userInput.value = promptText;
        handleSendMessage(); // Auto send the prompt
    });
});

// Focus on input on load
userInput.focus();
