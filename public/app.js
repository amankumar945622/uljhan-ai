 document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const messagesList = document.getElementById('messages-list');
    const attachToggleBtn = document.getElementById('attach-toggle-btn');
    const attachmentPopup = document.getElementById('attachment-popup');
    const hiddenFileInput = document.getElementById('hidden-file-input');
    const mediaPreview = document.getElementById('media-preview');
    const previewText = document.getElementById('preview-text');
    const removeMedia = document.getElementById('remove-media');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const clearHistoryOption = document.getElementById('clear-history-option');

    let attachedImageBase64 = null;

    async function loadChatHistory() {
        try {
            const res = await fetch('/api/history');
            const history = await res.json();
            messagesList.innerHTML = '';
            if (history && history.length > 0) {
                if (welcomeScreen) welcomeScreen.style.display = 'none';
                history.forEach(msg => {
                    const text = msg.parts && msg.parts[0] ? (msg.parts[0].text || "[Image Attached]") : '';
                    appendMessage(msg.role === 'user' ? 'user' : 'ai', text);
                });
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }

    loadChatHistory();

    // Menu Toggle for History Option
    if (menuToggleBtn && sidebarMenu) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarMenu.style.display = sidebarMenu.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', () => {
            sidebarMenu.style.display = 'none';
        });
    }

    // Clear History Logic
    if (clearHistoryOption) {
        clearHistoryOption.addEventListener('click', async () => {
            if (confirm("Kya aap saari chat history clear karna chahte hain?")) {
                try {
                    const res = await fetch('/api/clear', { method: 'POST' });
                    const data = await res.json();
                    if (data.success) {
                        messagesList.innerHTML = '';
                        if (welcomeScreen) welcomeScreen.style.display = 'flex';
                    }
                } catch (e) {
                    console.error("Failed to clear history", e);
                }
            }
        });
    }

    // Attachment Popup Toggle
    if (attachToggleBtn) {
        attachToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            attachmentPopup.style.display = attachmentPopup.style.display === 'none' ? 'flex' : 'none';
        });
    }

    document.addEventListener('click', () => {
        if (attachmentPopup) attachmentPopup.style.display = 'none';
    });

    document.getElementById('btn-photo').addEventListener('click', () => {
        hiddenFileInput.click();
    });

    hiddenFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(uploadEvent) {
                attachedImageBase64 = uploadEvent.target.result;
                previewText.innerText = `📷 ${file.name}`;
                mediaPreview.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        }
    });

    removeMedia.addEventListener('click', () => {
        attachedImageBase64 = null;
        mediaPreview.style.display = 'none';
        hiddenFileInput.value = '';
    });

    function appendMessage(sender, text) {
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'user-message-container' : 'ai-message-container';
        
        let actionButtons = '';
        if (sender === 'ai') {
            actionButtons = `
                <div style="margin-top: 6px; display: flex; gap: 10px; font-size: 14px;">
                    <button class="copy-btn" style="background:none; border:none; cursor:pointer;" title="Copy">📋 Copy</button>
                    <button class="speak-btn" style="background:none; border:none; cursor:pointer;" title="Speak">🔊 Listen</button>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-bubble" style="padding: 10px 14px; margin: 8px 0; border-radius: 12px; max-width: 80%; word-break: break-word; ${sender === 'user' ? 'background: #dbeafe; margin-left: auto;' : 'background: #ffffff; border: 1px solid #e5e7eb; margin-right: auto;'}">
                <p style="margin: 0; font-size: 15px; color: #1f2937; white-space: pre-wrap;">${text}</p>
                ${actionButtons}
            </div>
        `;

        if (sender === 'ai') {
            const copyBtn = messageDiv.querySelector('.copy-btn');
            const speakBtn = messageDiv.querySelector('.speak-btn');

            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(text);
                alert("Text copied!");
            });

            speakBtn.addEventListener('click', () => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'hi-IN';
                window.speechSynthesis.speak(utterance);
            });
        }
        
        messagesList.appendChild(messageDiv);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    async function handleSendMessage() {
        const text = userInput.value.trim();
        if (!text && !attachedImageBase64) return;

        const messageText = text;
        const imagePayload = attachedImageBase64;

        userInput.value = '';
        userInput.style.height = 'auto';
        attachedImageBase64 = null;
        mediaPreview.style.display = 'none';
        hiddenFileInput.value = '';

        appendMessage('user', messageText + (imagePayload ? " [Image Attached]" : ""));

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText, image: imagePayload })
            });

            const data = await response.json();
            if (data.reply) {
                appendMessage('ai', data.reply);
            } else if (data.error) {
                appendMessage('ai', `Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Network Error:", error);
            appendMessage('ai', "Server se connect karne mein pareshani aa rahi hai.");
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    if (userInput) {
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
});
