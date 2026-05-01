/**
 * Barangay Tibungco Smart Portal - Chatbot System
 * A rule-based chatbot that only answers system-related queries.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Chatbot CSS
    const style = document.createElement('style');
    style.innerHTML = `
        /* Chatbot Container */
        #brgy-chatbot-container {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
            font-family: 'Inter', sans-serif;
        }

        /* Chat Button */
        #brgy-chatbot-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: var(--primary-color, #0d6efd);
            color: white;
            border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: transform 0.3s ease, background-color 0.3s;
        }
        #brgy-chatbot-btn:hover {
            transform: scale(1.05);
            background-color: #0b5ed7;
        }

        /* Chat Window */
        #brgy-chatbot-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 450px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0);
            transform-origin: bottom right;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0;
        }
        #brgy-chatbot-window.open {
            transform: scale(1);
            opacity: 1;
        }

        /* Chat Header */
        #brgy-chatbot-header {
            background-color: var(--primary-color, #0d6efd);
            color: white;
            padding: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        #brgy-chatbot-header h6 {
            margin: 0;
            font-weight: 600;
            font-size: 16px;
        }
        #brgy-chatbot-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }

        /* Chat Body */
        #brgy-chatbot-body {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background-color: #f8f9fa;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        /* Messages */
        .chat-msg {
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 15px;
            font-size: 14px;
            line-height: 1.4;
            animation: fadeIn 0.3s ease;
        }
        .chat-msg.bot {
            background-color: #e9ecef;
            color: #212529;
            align-self: flex-start;
            border-bottom-left-radius: 5px;
        }
        .chat-msg.user {
            background-color: var(--primary-color, #0d6efd);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 5px;
        }

        /* Chat Input Area */
        #brgy-chatbot-input-area {
            display: flex;
            padding: 10px;
            background: white;
            border-top: 1px solid #dee2e6;
        }
        #brgy-chatbot-input {
            flex: 1;
            border: 1px solid #ced4da;
            border-radius: 20px;
            padding: 8px 15px;
            outline: none;
            font-size: 14px;
            transition: border-color 0.2s;
        }
        #brgy-chatbot-input:focus {
            border-color: var(--primary-color, #0d6efd);
        }
        #brgy-chatbot-send {
            background: none;
            border: none;
            color: var(--primary-color, #0d6efd);
            font-size: 20px;
            padding: 0 10px;
            cursor: pointer;
            margin-left: 5px;
        }

        /* Typing Indicator */
        .typing-indicator {
            display: none;
            align-self: flex-start;
            background-color: #e9ecef;
            padding: 10px 15px;
            border-radius: 15px;
            border-bottom-left-radius: 5px;
            margin-bottom: 10px;
        }
        .typing-indicator span {
            display: inline-block;
            width: 6px;
            height: 6px;
            background-color: #6c757d;
            border-radius: 50%;
            margin: 0 2px;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Choice Buttons */
        .chat-choices {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .chat-choice-btn {
            background-color: transparent;
            border: 1px solid var(--primary-color, #0d6efd);
            color: var(--primary-color, #0d6efd);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            animation: fadeIn 0.4s ease;
        }
        .chat-choice-btn:hover {
            background-color: var(--primary-color, #0d6efd);
            color: white;
        }
    `;
    document.head.appendChild(style);

    // 2. Inject Chatbot HTML
    const container = document.createElement('div');
    container.id = 'brgy-chatbot-container';
    container.innerHTML = `
        <div id="brgy-chatbot-window">
            <div id="brgy-chatbot-header">
                <h6><i class="fa-solid fa-robot me-2"></i>Brgy Assistant</h6>
                <button id="brgy-chatbot-close"><i class="fa-solid fa-times"></i></button>
            </div>
            <div id="brgy-chatbot-body">
                <div class="chat-msg bot">Hello! I am the Barangay Tibungco Assistant. How can I help you today?</div>
            </div>
            <div class="typing-indicator" id="typing-indicator">
                <span></span><span></span><span></span>
            </div>
            <div id="brgy-chatbot-input-area">
                <input type="text" id="brgy-chatbot-input" placeholder="Type your question here..." autocomplete="off">
                <button id="brgy-chatbot-send"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
        <button id="brgy-chatbot-btn">
            <i class="fa-solid fa-comment-dots"></i>
        </button>
    `;
    document.body.appendChild(container);

    // 3. Logic Setup
    const btn = document.getElementById('brgy-chatbot-btn');
    const windowEl = document.getElementById('brgy-chatbot-window');
    const closeBtn = document.getElementById('brgy-chatbot-close');
    const input = document.getElementById('brgy-chatbot-input');
    const sendBtn = document.getElementById('brgy-chatbot-send');
    const body = document.getElementById('brgy-chatbot-body');
    const typingIndicator = document.getElementById('typing-indicator');

    // Toggle Window
    btn.addEventListener('click', () => {
        const isOpening = !windowEl.classList.contains('open');
        windowEl.classList.toggle('open');
        if (isOpening) {
            input.focus();
            // Show initial choices if none exist
            if (!document.getElementById('chat-choices-container')) {
                const initialResponse = getBotResponse("hello");
                showChoices(initialResponse.choices);
            }
        }
    });
    closeBtn.addEventListener('click', () => windowEl.classList.remove('open'));

    // Send Message Event
    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        // Add User Message
        addMessage(text, 'user');
        input.value = '';

        // Show Typing Indicator
        body.appendChild(typingIndicator); // Move to bottom
        typingIndicator.style.display = 'block';
        scrollToBottom();

        // Process Bot Response
        setTimeout(() => {
            typingIndicator.style.display = 'none';
            const responseObj = getBotResponse(text);
            addMessage(responseObj.text, 'bot');
            showChoices(responseObj.choices);
        }, 1000 + Math.random() * 1000); // Simulate thinking time (1-2s)
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Dynamic Choice Generator
    const showChoices = (choices) => {
        // Remove existing choices
        const existing = document.getElementById('chat-choices-container');
        if (existing) existing.remove();

        if (!choices || choices.length === 0) return;

        const container = document.createElement('div');
        container.className = 'chat-choices';
        container.id = 'chat-choices-container';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'chat-choice-btn';
            btn.textContent = choice.label;
            btn.addEventListener('click', () => {
                input.value = choice.query;
                sendMessage();
                container.remove();
            });
            container.appendChild(btn);
        });

        body.appendChild(container);
        scrollToBottom();
    };

    const addMessage = (text, sender) => {
        const msg = document.createElement('div');
        msg.className = `chat-msg ${sender}`;
        msg.innerHTML = text;
        body.appendChild(msg);
        scrollToBottom();
    };

    const scrollToBottom = () => {
        body.scrollTop = body.scrollHeight;
    };

    // 4. Chatbot Knowledge Base (Rule-Based Decision Tree)
    const getBotResponse = (query) => {
        const q = query.toLowerCase();

        const mainMenuChoices = [
            { label: "Get Clearance", query: "clearance" },
            { label: "Report Incident", query: "report" },
            { label: "Payment Info", query: "payment" },
            { label: "Location", query: "location" }
        ];

        // Greeting / Main Menu
        if (q.match(/\b(hi|hello|hey|good morning|good afternoon|menu|main menu)\b/)) {
            return {
                text: "Here are the main topics I can help you with today:",
                choices: mainMenuChoices
            };
        }

        // Documents / Clearance
        if (q.match(/\b(clearance|certificate|document|request|paper|cedula)\b/)) {
            return {
                text: "To request a document like a Barangay Clearance or Certificate, please log in and go to the <strong>E-Services</strong> tab. Fill out the online form and choose your pickup date.",
                choices: [
                    { label: "What are the requirements?", query: "requirements" },
                    { label: "How much is the fee?", query: "fee" },
                    { label: "Main Menu", query: "menu" }
                ]
            };
        }

        if (q.match(/\b(require|requirements|need)\b/)) {
            return {
                text: "For a Barangay Clearance, you typically need: <br>1. Valid ID<br>2. Cedula (Community Tax Certificate)<br>3. Proof of residency.",
                choices: [
                    { label: "How much is the fee?", query: "fee" },
                    { label: "Main Menu", query: "menu" }
                ]
            };
        }

        // Complaints / Reporting
        if (q.match(/\b(report|incident|complaint|issue|problem|emergency|police)\b/)) {
            return {
                text: "To report an incident or community issue, please go to the <strong>Report Issue</strong> tab. You can provide the location, description, and upload a photo of the incident.",
                choices: [
                    { label: "What can I report?", query: "what to report" },
                    { label: "Main Menu", query: "menu" }
                ]
            };
        }

        if (q.match(/\b(what to report|what can i report)\b/)) {
            return {
                text: "You can report things like noise complaints, stray animals, garbage issues, broken streetlights, or minor disputes.",
                choices: [
                    { label: "Main Menu", query: "menu" }
                ]
            };
        }

        // Accounts / Registration / Login
        if (q.match(/\b(register|account|sign up|create|login|sign in|password)\b/)) {
            return {
                text: "To access our services, you need a resident account. You can click <strong>Login</strong> or <strong>Register</strong> at the top of the page. If you are registering, please wait for admin approval if required.",
                choices: [
                    { label: "Main Menu", query: "menu" }
                ]
            };
        }

        // Payments
        if (q.match(/\b(pay|payment|gcash|paymaya|cash|fee|cost)\b/)) {
            return {
                text: "For E-Services, the standard fee is ₱50.00. We accept online payments like <strong>QRPH</strong>, <strong>GCash</strong>, and <strong>PayMaya</strong>. You will be provided a QR code to scan when you select a payment method.",
                choices: [
                    { label: "Get Clearance", query: "clearance" },
                    { label: "Main Menu", query: "menu" }
                ]
            };
        }

        // Announcements
        if (q.match(/\b(news|announcement|event|update)\b/)) {
            return {
                text: "You can view all the latest barangay news, advisories, and events on the <strong>Announcements</strong> page.",
                choices: [
                    { label: "Main Menu", query: "menu" }
                ]
            };
        }
        
        // Location / Contact
        if (q.match(/\b(where|location|address|contact|phone)\b/)) {
            return {
                text: "Barangay Tibungco Hall is located at Tibungco, Davao City. You can contact us through the portal or via our official phone lines listed in the About Us section.",
                choices: [
                    { label: "Main Menu", query: "menu" }
                ]
            };
        }

        // FALLBACK (Blocking unrelated questions)
        return {
            text: "I am the Barangay Tibungco Assistant. <strong>I can only answer questions related to the Barangay Smart Portal, E-Services, Incident Reporting, and Announcements.</strong> Please ask a system-related question.",
            choices: mainMenuChoices
        };
    };
});
