document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const messagesList = document.getElementById('messages-list');
    const chatContainer = document.getElementById('chat-container');
    const attachToggleBtn = document.getElementById('attach-toggle-btn');
    const attachmentPopup = document.getElementById('attachment-popup');
    const hiddenFileInput = document.getElementById('hidden-file-input');
    const mediaPreview = document.getElementById('media-preview');
    const previewText = document.getElementById('preview-text');
    const removeMedia = document.getElementById('remove-media');
    const micBtn = document.getElementById('mic-btn');
    const newChatBtn = document.getElementById('new-chat-btn');

    let attachedFile = null;

    // 1. Textarea Auto-Height Logic
    if (userInput) {
        userInput.addEventListener('input', () => {
            userInput.style.height = 'auto';
            userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
        });
    }

    // 2. Attachment Popup Toggle
    if (attachToggleBtn) {
        attachToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (attachmentPopup.style.display === 'none') {
                attachmentPopup.style.display = 'flex';
            } else {
                attachmentPopup.style.display = 'none';
            }
        });
    }

    // Hide popup on outside click
    document.addEventListener('click', () => {
        if (attachmentPopup) attachmentPopup.style.display = 'none';
    });

    // 3. Media Selection Options
    document.getElementById('btn-photo').addEventListener('click', () => {
        hiddenFileInput.accept = 'image/*';
        hiddenFileInput.click();
    });

    document.getElementById('btn-video').addEventListener('click', () => {
        hiddenFileInput.accept = 'video/*';
        hiddenFileInput.click();
    });

    document.getElementById('btn-doc').addEventListener('click', () => {
        hiddenFileInput.accept = '.pdf,.txt,.doc,.docx';
        hiddenFileInput.click();
    });

    hiddenFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            attachedFile = file;
            previewText.innerText = `📎 ${file.name}`;
            mediaPreview.style.display = 'flex';
        }
    });

    removeMedia.addEventListener('click', () => {
        attachedFile = null;
        hiddenFileInput.value = '';
        mediaPreview.style.display = 'none';
    });

    // 4. Mic Button Click Simulation
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            alert("🎤 Voice recording feature ready!");
        });
    }

    // 5. New Chat Button Refresh
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            messagesList.innerHTML = '';
            if (welcomeScreen) welcomeScreen.style.display = 'block';
        });
    }

    // 6. Message Send Function
    function sendMessage() {
        const text = userInput.value.trim();
        if (!text && !attachedFile) return;

        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }

        let fullText = text;
        if (attachedFile) {
            fullText += `\n[Attached: ${attachedFile.name}]`;
        }

        appendMessage(fullText, 'user');

        // Reset inputs
        userInput.value = '';
        userInput.style.height = '28px';
        attachedFile = null;
        mediaPreview.style.display = 'none';
        hiddenFileInput.value = '';

        // AI Demo Response with Speaker & Copy buttons
        setTimeout(() => {
            appendMessage(`Main ULJHAN AI hoon! Aapne kaha: "${text || 'Media file'}"`, 'bot');
        }, 500);
    }

    function appendMessage(text, sender) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;

        const msgBubble = document.createElement('div');
        msgBubble.className = 'msg-bubble';
        msgBubble.innerText = text;
        wrapper.appendChild(msgBubble);

        // Add Action buttons (Copy & Speaker for Bot / Copy for User)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'msg-actions';

        // Copy Button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'msg-action-btn';
        copyBtn.innerText = '📋 Copy';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerText = '✓ Copied';
            setTimeout(() => copyBtn.innerText = '📋 Copy', 2000);
        };
        actionsDiv.appendChild(copyBtn);

        // Speaker Button (Only for Bot)
        if (sender === 'bot' && 'speechSynthesis' in window) {
            const speakBtn = document.createElement('button');
            speakBtn.className = 'msg-action-btn';
            speakBtn.innerText = '🔊 Listen';
            speakBtn.onclick = () => {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterance);
            };
            actionsDiv.appendChild(speakBtn);
        }

        wrapper.appendChild(actionsDiv);
        messagesList.appendChild(wrapper);

        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (userInput) {
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});
