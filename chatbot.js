/**
 * Barangay Tibungco Smart Portal - Chat System
 * Dual Mode: FAQ Bot for guests, Live Chat for logged-in users
 */

document.addEventListener('DOMContentLoaded', () => {
    // Don't show on admin dashboard
    if (window.location.pathname.includes('dashboard.html') && !window.location.pathname.includes('resident')) return;

    // 1. Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #brgy-chatbot-container {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
            font-family: 'Inter', sans-serif;
        }
        #brgy-chatbot-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0f4c81, #1b64a5);
            color: white;
            border: none;
            box-shadow: 0 4px 20px rgba(15,76,129,0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: transform 0.3s ease, box-shadow 0.3s;
            position: relative;
        }
        #brgy-chatbot-btn:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 25px rgba(15,76,129,0.5);
        }
        #brgy-chatbot-btn .chat-unread {
            position: absolute;
            top: -2px;
            right: -2px;
            background: #dc3545;
            color: #fff;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 11px;
            display: none;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        #brgy-chatbot-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 370px;
            height: 500px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.18);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0);
            transform-origin: bottom right;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
            opacity: 0;
        }
        #brgy-chatbot-window.open {
            transform: scale(1);
            opacity: 1;
        }
        #brgy-chatbot-header {
            background: linear-gradient(135deg, #0f4c81, #1b64a5);
            color: white;
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        #brgy-chatbot-header h6 {
            margin: 0;
            font-weight: 600;
            font-size: 15px;
        }
        #brgy-chatbot-header small {
            font-size: 10px;
            opacity: 0.8;
        }
        #brgy-chatbot-close {
            background: rgba(255,255,255,0.15);
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        #brgy-chatbot-close:hover { background: rgba(255,255,255,0.3); }
        #brgy-chatbot-body {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background-color: #f0f2f5;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .chat-msg {
            max-width: 82%;
            padding: 10px 14px;
            border-radius: 18px;
            font-size: 13px;
            line-height: 1.4;
            animation: chatFadeIn 0.3s ease;
        }
        .chat-msg.bot, .chat-msg.admin {
            background-color: #fff;
            color: #212529;
            align-self: flex-start;
            border-bottom-left-radius: 5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .chat-msg.admin { border-left: 3px solid #ffc107; }
        .chat-msg.user {
            background: linear-gradient(135deg, #0f4c81, #1b64a5);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 5px;
        }
        .chat-msg .chat-time {
            font-size: 10px;
            opacity: 0.6;
            text-align: right;
            margin-top: 3px;
        }
        .chat-msg .chat-sender {
            font-size: 10px;
            font-weight: 600;
            opacity: 0.7;
            margin-bottom: 2px;
        }
        .chat-seen {
            font-size: 10px;
            color: rgba(255,255,255,0.7);
            text-align: right;
            margin-top: 2px;
        }
        /* Reply & Reaction Styles */
        .msg-actions {
            display: none;
            position: absolute;
            top: -22px;
            gap: 6px;
            z-index: 1000;
            padding: 5px;
        }
        .chat-msg.user .msg-actions { right: 5px; }
        .chat-msg.admin .msg-actions { left: 5px; }
        .chat-msg:hover .msg-actions, .msg-actions.active { display: flex; }
        
        .action-btn {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #fff;
            border: 1px solid #dee2e6;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #6c757d;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .action-btn:hover { background: #0f4c81; color: #fff; transform: scale(1.1); }

        .reply-preview-bar {
            display: none;
            background: #f8f9fa;
            border-left: 3px solid #0f4c81;
            padding: 6px 12px;
            position: relative;
            border-top: 1px solid #e8e8e8;
        }
        .reply-preview-content {
            font-size: 11px;
            color: #495057;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-right: 20px;
        }
        .reply-close {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #6c757d;
            font-size: 12px;
        }

        .replied-message {
            background: rgba(0,0,0,0.05);
            border-left: 2px solid rgba(0,0,0,0.2);
            padding: 3px 6px;
            margin-bottom: 4px;
            border-radius: 4px;
            font-size: 10px;
            opacity: 0.8;
            max-width: 100%;
        }
        .chat-msg.user .replied-message {
            background: rgba(255,255,255,0.1);
            border-left-color: rgba(255,255,255,0.3);
            color: #fff;
        }

        .reaction-container {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            margin-top: 4px;
        }
        .reaction-badge {
            background: rgba(0,0,0,0.05);
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 10px;
            padding: 1px 6px;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 3px;
            transition: all 0.2s;
        }
        .reaction-badge:hover { background: rgba(0,0,0,0.1); }
        .reaction-badge.active { background: #e7f3ff; border-color: #0084ff; }
        .chat-msg.user .reaction-badge { background: rgba(255,255,255,0.15); border-color: transparent; color: #fff; }

        .emoji-popover {
            display: none;
            position: absolute;
            bottom: 28px;
            left: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 18px;
            padding: 4px 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            white-space: nowrap;
        }
        .emoji-popover span {
            font-size: 16px;
            cursor: pointer;
            padding: 0 3px;
            transition: transform 0.2s;
            display: inline-block;
        }
        .emoji-popover span:hover { transform: scale(1.3); }
        #brgy-chatbot-input-area {
            display: flex;
            padding: 10px 12px;
            background: white;
            border-top: 1px solid #e8e8e8;
            gap: 8px;
        }
        #brgy-chatbot-input {
            flex: 1;
            border: 1px solid #ddd;
            border-radius: 22px;
            padding: 9px 16px;
            outline: none;
            font-size: 13px;
            transition: border-color 0.2s;
        }
        #brgy-chatbot-input:focus { border-color: #0f4c81; }
        #brgy-chatbot-send {
            background: #0f4c81;
            border: none;
            color: white;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        #brgy-chatbot-send:hover { background: #1b64a5; }
        .typing-indicator {
            display: none;
            align-self: flex-start;
            background-color: #fff;
            padding: 10px 15px;
            border-radius: 18px;
            border-bottom-left-radius: 5px;
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
        @keyframes chatFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .chat-choices {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 4px;
        }
        .chat-choice-btn {
            background-color: transparent;
            border: 1px solid #0f4c81;
            color: #0f4c81;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            animation: chatFadeIn 0.4s ease;
        }
        .chat-choice-btn:hover {
            background-color: #0f4c81;
            color: white;
        }
        .chat-mode-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 9px;
            padding: 2px 8px;
            border-radius: 10px;
            background: rgba(255,255,255,0.2);
        }
        #brgy-chatbot-emoji-btn {
            background: none;
            border: none;
            color: #6c757d;
            font-size: 18px;
            cursor: pointer;
            padding: 0 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }
        #brgy-chatbot-emoji-btn:hover { color: #0f4c81; }
        #chatbotEmojiContainer {
            display: none;
            position: absolute;
            bottom: 60px;
            right: 15px;
            z-index: 10000;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            border-radius: 8px;
            overflow: hidden;
        }
        emoji-picker {
            --num-columns: 6;
            --emoji-size: 1.2rem;
            width: 280px;
            height: 300px;
        }
    `;
    document.head.appendChild(style);

    // Load emoji picker script if not present
    if (!document.querySelector('script[src*="emoji-picker-element"]')) {
        const emojiScript = document.createElement('script');
        emojiScript.type = 'module';
        emojiScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@1.21.3/index.js';
        document.head.appendChild(emojiScript);
    }

    // 2. Inject HTML
    const container = document.createElement('div');
    container.id = 'brgy-chatbot-container';
    container.innerHTML = `
        <div id="brgy-chatbot-window">
            <div id="brgy-chatbot-header">
                <div>
                    <h6><i class="fa-solid fa-comments me-2"></i>Brgy Chat</h6>
                    <small id="chatModeLabel">FAQ Assistant</small>
                </div>
                <button id="brgy-chatbot-close"><i class="fa-solid fa-times"></i></button>
            </div>
            <div id="brgy-chatbot-body"></div>
            <div class="typing-indicator" id="typing-indicator">
                <span></span><span></span><span></span>
            </div>
            <div id="chatbotReplyPreview" class="reply-preview-bar">
                <div id="chatbotReplyContent" class="reply-preview-content"></div>
                <i class="fa-solid fa-xmark reply-close" onclick="cancelChatbotReply()"></i>
            </div>
            <div id="chatbotEmojiContainer">
                <emoji-picker></emoji-picker>
            </div>
            <div id="brgy-chatbot-input-area">
                <button id="brgy-chatbot-emoji-btn"><i class="fa-regular fa-face-smile"></i></button>
                <input type="text" id="brgy-chatbot-input" placeholder="Type your message..." autocomplete="off">
                <button id="brgy-chatbot-send"><i class="fa-solid fa-paper-plane" style="font-size:14px;"></i></button>
            </div>
        </div>
        <button id="brgy-chatbot-btn">
            <i class="fa-solid fa-comment-dots"></i>
            <span class="chat-unread" id="chatUnreadBadge">0</span>
        </button>
    `;
    document.body.appendChild(container);

    // 3. Elements
    const btn = document.getElementById('brgy-chatbot-btn');
    const windowEl = document.getElementById('brgy-chatbot-window');
    const closeBtn = document.getElementById('brgy-chatbot-close');
    const input = document.getElementById('brgy-chatbot-input');
    const sendBtn = document.getElementById('brgy-chatbot-send');
    const body = document.getElementById('brgy-chatbot-body');
    const typingIndicator = document.getElementById('typing-indicator');
    const modeLabel = document.getElementById('chatModeLabel');
    
    // Emoji Elements
    const emojiBtn = document.getElementById('brgy-chatbot-emoji-btn');
    const emojiContainer = document.getElementById('chatbotEmojiContainer');
    const emojiPicker = document.querySelector('#chatbotEmojiContainer emoji-picker');

    emojiBtn.addEventListener('click', () => {
        emojiContainer.style.display = emojiContainer.style.display === 'none' ? 'block' : 'none';
    });

    emojiPicker.addEventListener('emoji-click', event => {
        input.value += event.detail.unicode;
        input.focus();
    });

    document.addEventListener('click', (e) => {
        if (!emojiBtn.contains(e.target) && !emojiContainer.contains(e.target)) {
            emojiContainer.style.display = 'none';
        }
    });

    let isLiveMode = false;
    let currentUser = null;
    let currentProfile = null;
    let adminId = null;
    let liveChatSub = null;
    let replyingToMsgId = null;

    window.setChatbotReply = function(msgId, text, senderName) {
        replyingToMsgId = msgId;
        const bar = document.getElementById('chatbotReplyPreview');
        const content = document.getElementById('chatbotReplyContent');
        content.innerHTML = `<strong>Replying to ${senderName}:</strong> ${text}`;
        bar.style.display = 'block';
        document.getElementById('brgy-chatbot-input').focus();
    };

    window.cancelChatbotReply = function() {
        replyingToMsgId = null;
        document.getElementById('chatbotReplyPreview').style.display = 'none';
    };

    window.toggleChatbotReaction = async function(msgId, emoji) {
        if (!currentUser) return;
        
        // Optimistic UI update: Find current message
        const msgEl = document.querySelector(`.chat-msg[data-id="${msgId}"]`);
        if (!msgEl) return;

        const { data: msg } = await supabaseClient.from('messages').select('reactions').eq('id', msgId).single();
        let reactions = msg.reactions || {};
        
        if (!reactions[emoji]) reactions[emoji] = [];
        const index = reactions[emoji].indexOf(currentUser.id);
        
        if (index > -1) {
            reactions[emoji].splice(index, 1);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            reactions[emoji].push(currentUser.id);
        }
        
        await supabaseClient.from('messages').update({ reactions }).eq('id', msgId);
        
        // Refresh JUST this message's reactions in the UI
        let container = msgEl.querySelector('.reaction-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'reaction-container';
            msgEl.appendChild(container);
        }
        
        container.innerHTML = '';
        for (const [emo, users] of Object.entries(reactions)) {
            const active = users.includes(currentUser.id) ? 'active' : '';
            container.insertAdjacentHTML('beforeend', `<div class="reaction-badge ${active}" onclick="toggleChatbotReaction('${msgId}', '${emo}')">${emo} <span>${users.length}</span></div>`);
        }
        if (Object.keys(reactions).length === 0) container.remove();
    };

    window.showChatbotEmojiPopover = function(btn, msgId) {
        const popover = btn.nextElementSibling;
        const isVisible = popover.style.display === 'block';
        
        // Close other popovers
        document.querySelectorAll('.emoji-popover').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.msg-actions').forEach(a => a.classList.remove('active'));

        if (!isVisible) {
            popover.style.display = 'block';
            btn.closest('.msg-actions').classList.add('active');
        }

        popover.onclick = (e) => {
            if (e.target.tagName === 'SPAN') {
                toggleChatbotReaction(msgId, e.target.textContent);
                popover.style.display = 'none';
                btn.closest('.msg-actions').classList.remove('active');
            }
        };
    };

    // 4. Initialize - Check if user is logged in
    async function initChat() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                currentUser = session.user;
                const { data: profile } = await supabaseClient.from('profiles').select('full_name, avatar_url, role').eq('id', currentUser.id).single();
                currentProfile = profile;

                // If user is admin, tell them to use the dashboard for live chat
                if (profile?.role === 'admin') {
                    isLiveMode = false;
                    modeLabel.innerHTML = '<span class="chat-mode-badge"><i class="fa-solid fa-user-shield text-warning" style="font-size:8px;"></i> Admin Mode</span>';
                    input.disabled = true;
                    input.placeholder = 'Use dashboard to chat...';
                    addMessage("👋 <strong>Hello Admin!</strong><br><br>To read and reply to resident messages, please go to the <strong>Admin Dashboard</strong> and click on <strong>Live Chat</strong> in the sidebar.", 'bot');
                    return;
                }

                isLiveMode = true;
                modeLabel.innerHTML = '<span class="chat-mode-badge"><i class="fa-solid fa-circle" style="color:#28a745;font-size:6px;"></i> Live Chat with Admin</span>';
                input.placeholder = 'Message the admin...';

                // Find admin user - try multiple approaches
                try {
                    // Approach 1: RPC function (bypasses RLS)
                    const { data: rpcId } = await supabaseClient.rpc('get_admin_id');
                    if (rpcId) adminId = rpcId;
                } catch(e) {}

                // Approach 2: Direct query fallback
                if (!adminId) {
                    try {
                        const { data: admins } = await supabaseClient.from('profiles').select('id').eq('role', 'admin').limit(1);
                        if (admins && admins.length > 0) adminId = admins[0].id;
                    } catch(e) {}
                }

                // Approach 3: Check existing messages for admin sender
                if (!adminId) {
                    try {
                        const { data: adminMsgs } = await supabaseClient.from('messages').select('sender_id').eq('sender_role', 'admin').limit(1);
                        if (adminMsgs && adminMsgs.length > 0) adminId = adminMsgs[0].sender_id;
                    } catch(e) {}
                }

                // Subscribe to live messages
                subscribeLiveChat();
            } else {
                showFAQMode();
            }
        } catch (e) {
            showFAQMode();
        }
    }

    function showFAQMode() {
        isLiveMode = false;
        modeLabel.innerHTML = '<span class="chat-mode-badge"><i class="fa-solid fa-robot" style="font-size:8px;"></i> FAQ Assistant</span>';
        input.placeholder = 'Type your question here...';
        addMessage("Hello! I am the Barangay Tibungco Assistant. How can I help you today?", 'bot');
    }

    // 5. Toggle Window
    btn.addEventListener('click', async () => {
        const isOpening = !windowEl.classList.contains('open');
        windowEl.classList.toggle('open');
        if (isOpening) {
            input.focus();
            if (isLiveMode && body.children.length === 0) {
                await loadChatHistory();
            } else if (!isLiveMode && body.children.length === 0) {
                showFAQMode();
                const initialResponse = getBotResponse("hello");
                showChoices(initialResponse.choices);
            }
            // Reset unread
            document.getElementById('chatUnreadBadge').style.display = 'none';
        }
    });
    closeBtn.addEventListener('click', () => windowEl.classList.remove('open'));

    // 6. Send Message
    let seenCheckInterval = null;
    let lastSentMsgId = null;

    function startSeenPolling(msgId) {
        if (msgId) lastSentMsgId = msgId;
        if (seenCheckInterval) clearInterval(seenCheckInterval);
        if (!lastSentMsgId) return;

        console.log("Chatbot: Starting Seen polling for msg:", lastSentMsgId);
        seenCheckInterval = setInterval(async () => {
            if (!lastSentMsgId) { clearInterval(seenCheckInterval); return; }
            try {
                const { data: msg, error } = await supabaseClient
                    .from('messages')
                    .select('id, is_read')
                    .eq('id', lastSentMsgId)
                    .maybeSingle();
                
                if (error) {
                    console.error("Chatbot: Polling error:", error);
                    return;
                }

                if (msg && msg.is_read) {
                    console.log("Chatbot: Message seen!", msg.id);
                    clearInterval(seenCheckInterval);
                    seenCheckInterval = null;
                    lastSentMsgId = null;
                    markMessageSeen(msg.id);
                }
            } catch (err) {
                console.error("Chatbot: Polling catch error:", err);
            }
        }, 3000);
    }

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;
        input.value = '';

        if (isLiveMode) {
            // Live mode - send to Supabase
            addMessage(text, 'user');

            if (!adminId) {
                addMessage("No admin is currently available. Please try again later.", 'bot');
                return;
            }

            const { data: inserted, error } = await supabaseClient.from('messages').insert({
                sender_id: currentUser.id,
                receiver_id: adminId,
                sender_name: currentProfile?.full_name || currentUser.email,
                sender_avatar: currentProfile?.avatar_url || null,
                content: text,
                sender_role: 'resident',
                reply_to_id: replyingToMsgId
            }).select('id').single();

            if (error) console.error("Chatbot: Send error:", error);

            // Clear reply
            cancelChatbotReply();

            // Start polling for Seen
            if (inserted?.id) {
                console.log("Chatbot: Message sent, ID:", inserted.id);
                lastSentMsgId = inserted.id;
                // Assign ID to the last sent message element so we can find it later
                const allUserMsgs = document.querySelectorAll('.chat-msg.user');
                if (allUserMsgs.length > 0) {
                    allUserMsgs[allUserMsgs.length - 1].setAttribute('data-id', inserted.id);
                }
                startSeenPolling();
            }
        } else {
            // FAQ mode
            addMessage(text, 'user');
            body.appendChild(typingIndicator);
            typingIndicator.style.display = 'block';
            scrollToBottom();

            setTimeout(() => {
                typingIndicator.style.display = 'none';
                const responseObj = getBotResponse(text);
                addMessage(responseObj.text, 'bot');
                showChoices(responseObj.choices);
            }, 800 + Math.random() * 800);
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    // 7. Live Chat Functions
    async function loadChatHistory() {
        if (!currentUser || !adminId) {
            addMessage("Welcome! Send a message to start chatting with the Barangay admin.", 'bot');
            return;
        }

        const { data: msgs } = await supabaseClient
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: true })
            .limit(50);

        if (!msgs || msgs.length === 0) {
            addMessage("👋 Welcome! Send a message and the admin will reply here.", 'bot');
            return;
        }

        // Collect unread messages from admin to mark as read
        const unreadIds = msgs.filter(m => m.sender_role === 'admin' && m.receiver_id === currentUser.id && !m.is_read).map(m => m.id);

        msgs.forEach(m => {
            const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (m.sender_role === 'resident' || m.sender_id === currentUser.id) {
                addMessage(m.content, 'user', time, null, m.id, m.is_read, m.reply_to_id, m.reactions);
            } else if (m.sender_role === 'admin') {
                addMessage(m.content, 'admin', time, m.sender_name, m.id, m.is_read, m.reply_to_id, m.reactions);
            }
        });

        // Start polling for last sent user message if unread
        const lastUserMsg = msgs.filter(m => m.sender_id === currentUser.id).pop();
        if (lastUserMsg && !lastUserMsg.is_read) {
            startSeenPolling(lastUserMsg.id);
        } else if (seenCheckInterval) {
            clearInterval(seenCheckInterval);
            seenCheckInterval = null;
        }

        // Mark admin messages as read
        if (unreadIds.length > 0) {
            console.log("Chatbot: Marking admin messages as read:", unreadIds);
            const { error } = await supabaseClient.from('messages').update({ is_read: true }).in('id', unreadIds);
            if (error) console.error("Chatbot: Error marking as read:", error);
        }
    }

    function subscribeLiveChat() {
        if (liveChatSub || !currentUser) return;

        liveChatSub = supabaseClient.channel('user-live-chat')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
                const msg = payload.new;
                // Only show messages relevant to this conversation
                if (msg.sender_id === currentUser.id || msg.receiver_id === currentUser.id) {

                    if (msg.sender_role === 'admin' && msg.receiver_id === currentUser.id) {
                        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        addMessage(msg.content, 'admin', time, msg.sender_name, msg.id, false, msg.reply_to_id, msg.reactions);

                        // Always play sound when receiving a message
                        if (typeof App !== 'undefined') {
                            App.playNotificationSound('resident');
                        }

                        // If window is open, mark as read immediately
                        if (windowEl.classList.contains('open')) {
                            console.log("Chatbot: Marking new msg as read immediately:", msg.id);
                            const { error } = await supabaseClient.from('messages').update({ is_read: true }).eq('id', msg.id);
                            if (error) console.error("Chatbot: Error marking as read:", error);
                        } else {
                            const badge = document.getElementById('chatUnreadBadge');
                            const count = parseInt(badge.textContent) || 0;
                            badge.textContent = count + 1;
                            badge.style.display = 'flex';
                        }
                    }
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, async (payload) => {
                const updatedMsg = payload.new;
                if (updatedMsg.sender_id === currentUser.id || updatedMsg.receiver_id === currentUser.id) {
                    const msgEl = document.querySelector(`.chat-msg[data-id="${updatedMsg.id}"]`);
                    if (msgEl) {
                        // Update Reactions
                        let reactCont = msgEl.querySelector('.reaction-container');
                        const reactions = updatedMsg.reactions || {};
                        
                        if (Object.keys(reactions).length > 0) {
                            if (!reactCont) {
                                reactCont = document.createElement('div');
                                reactCont.className = 'reaction-container';
                                msgEl.appendChild(reactCont);
                            }
                            reactCont.innerHTML = '';
                            for (const [emo, users] of Object.entries(reactions)) {
                                const active = users.includes(currentUser.id) ? 'active' : '';
                                reactCont.insertAdjacentHTML('beforeend', `<div class="reaction-badge ${active}" onclick="toggleChatbotReaction('${updatedMsg.id}', '${emo}')">${emo} <span>${users.length}</span></div>`);
                            }
                        } else if (reactCont) {
                            reactCont.remove();
                        }

                        // Update Seen status
                        if (updatedMsg.is_read && updatedMsg.sender_id === currentUser.id) {
                            markMessageSeen(updatedMsg.id);
                        }
                    }
                }
            })
            .subscribe();
    }

    function markMessageSeen(msgId) {
        // Remove seen from all previous user messages first
        document.querySelectorAll('.chat-seen').forEach(el => el.remove());
        // Find the message element and add seen label
        const msgEl = document.querySelector(`.chat-msg[data-id="${msgId}"]`);
        if (msgEl) {
            const seen = document.createElement('div');
            seen.className = 'chat-seen';
            seen.innerHTML = '✓✓ Seen';
            msgEl.appendChild(seen);
        } else {
            // If not found specifically, add to the last user message
            const allUserMsgs = document.querySelectorAll('.chat-msg.user');
            if (allUserMsgs.length > 0) {
                const lastMsg = allUserMsgs[allUserMsgs.length - 1];
                const seen = document.createElement('div');
                seen.className = 'chat-seen';
                seen.innerHTML = '✓✓ Seen';
                lastMsg.appendChild(seen);
            }
        }
    }

    // 8. Helper Functions
    function addMessage(text, sender, time, senderName, msgId, isRead, replyToId, reactionsObj) {
        const msg = document.createElement('div');
        msg.className = `chat-msg ${sender}`;
        msg.style.position = 'relative';
        if (msgId) msg.setAttribute('data-id', msgId);
        
        // Handle Reply Preview inside bubble
        let replyHtml = '';
        if (replyToId) {
            const original = document.querySelector(`.chat-msg[data-id="${replyToId}"]`);
            const preview = original ? original.textContent.replace(/✓✓ Seen|\d+:\d+ [APM]+/g, '').trim() : "Original message";
            replyHtml = `<div class="replied-message text-truncate">
                <i class="fa-solid fa-reply fa-flip-horizontal me-1"></i>${preview}
            </div>`;
        }

        let html = '';
        if (sender === 'admin') {
            html += `<div class="chat-sender"><i class="fa-solid fa-shield-halved me-1" style="font-size:8px;"></i>Barangay Admin</div>`;
        }

        // Action Buttons on Hover
        const actionsHtml = (sender === 'admin' || sender === 'user') ? `
            <div class="msg-actions">
                <button class="action-btn" onclick="setChatbotReply('${msgId}', '${text.replace(/'/g, "\\'")}', '${sender === 'admin' ? 'Admin' : 'You'}')">
                    <i class="fa-solid fa-reply fa-flip-horizontal"></i>
                </button>
                <div style="position:relative; display:inline-block;">
                    <button class="action-btn" onclick="showChatbotEmojiPopover(this, '${msgId}')">
                        <i class="fa-regular fa-face-smile"></i>
                    </button>
                    <div class="emoji-popover">
                        <span>❤️</span><span>👍</span><span>😂</span><span>😮</span><span>😢</span><span>🔥</span>
                    </div>
                </div>
            </div>
        ` : '';

        // Reactions Display
        let reactionsHtml = '';
        if (reactionsObj && Object.keys(reactionsObj).length > 0) {
            reactionsHtml = `<div class="reaction-container">`;
            for (const [emoji, users] of Object.entries(reactionsObj)) {
                const active = currentUser && users.includes(currentUser.id) ? 'active' : '';
                reactionsHtml += `<div class="reaction-badge ${active}" onclick="toggleChatbotReaction('${msgId}', '${emoji}')">${emoji} <span>${users.length}</span></div>`;
            }
            reactionsHtml += `</div>`;
        }

        html += replyHtml + text;
        if (time) html += `<div class="chat-time">${time}</div>`;
        msg.innerHTML = actionsHtml + html + reactionsHtml;

        // If this is our sent message and it's already been read, show Seen
        if (sender === 'user' && isRead) {
            // Remove seen from older messages
            document.querySelectorAll('.chat-seen').forEach(el => el.remove());
            const seen = document.createElement('div');
            seen.className = 'chat-seen';
            seen.innerHTML = '✓✓ Seen';
            msg.appendChild(seen);
        }

        body.appendChild(msg);
        scrollToBottom();
    }

    const showChoices = (choices) => {
        const existing = document.getElementById('chat-choices-container');
        if (existing) existing.remove();
        if (!choices || choices.length === 0) return;
        const cont = document.createElement('div');
        cont.className = 'chat-choices';
        cont.id = 'chat-choices-container';
        choices.forEach(choice => {
            const b = document.createElement('button');
            b.className = 'chat-choice-btn';
            b.textContent = choice.label;
            b.addEventListener('click', () => {
                input.value = choice.query;
                sendMessage();
                cont.remove();
            });
            cont.appendChild(b);
        });
        body.appendChild(cont);
        scrollToBottom();
    };

    const scrollToBottom = () => { body.scrollTop = body.scrollHeight; };

    // 9. FAQ Knowledge Base
    const getBotResponse = (query) => {
        const q = query.toLowerCase();
        const mainMenuChoices = [
            { label: "Get Clearance", query: "clearance" },
            { label: "Report Incident", query: "report" },
            { label: "Payment Info", query: "payment" },
            { label: "Location", query: "location" }
        ];

        if (q.match(/\b(hi|hello|hey|good morning|good afternoon|menu|main menu)\b/)) {
            return { text: "Here are the main topics I can help you with today:", choices: mainMenuChoices };
        }
        if (q.match(/\b(clearance|certificate|document|request|paper|cedula)\b/)) {
            return { text: "To request a document like a Barangay Clearance or Certificate, please log in and go to the <strong>E-Services</strong> tab.", choices: [{ label: "Requirements?", query: "requirements" }, { label: "Fee?", query: "fee" }, { label: "Main Menu", query: "menu" }] };
        }
        if (q.match(/\b(require|requirements|need)\b/)) {
            return { text: "For a Barangay Clearance, you typically need: <br>1. Valid ID<br>2. Cedula<br>3. Proof of residency.", choices: [{ label: "Fee?", query: "fee" }, { label: "Main Menu", query: "menu" }] };
        }
        if (q.match(/\b(report|incident|complaint|issue|problem|emergency|police)\b/)) {
            return { text: "To report an incident, go to the <strong>Report Issue</strong> tab. You can provide location, description, and a photo.", choices: [{ label: "What can I report?", query: "what to report" }, { label: "Main Menu", query: "menu" }] };
        }
        if (q.match(/\b(what to report|what can i report)\b/)) {
            return { text: "You can report noise complaints, stray animals, garbage issues, broken streetlights, or disputes.", choices: [{ label: "Main Menu", query: "menu" }] };
        }
        if (q.match(/\b(register|account|sign up|create|login|sign in|password)\b/)) {
            return { text: "Click <strong>Login</strong> or <strong>Register</strong> at the top of the page to create your account.", choices: [{ label: "Main Menu", query: "menu" }] };
        }
        if (q.match(/\b(pay|payment|gcash|paymaya|cash|fee|cost)\b/)) {
            return { text: "Standard fee is ₱50.00. We accept <strong>GCash</strong>, <strong>PayMaya</strong>, and <strong>QRPH</strong>.", choices: [{ label: "Get Clearance", query: "clearance" }, { label: "Main Menu", query: "menu" }] };
        }
        if (q.match(/\b(news|announcement|event|update)\b/)) {
            return { text: "View latest news and events on the <strong>Announcements</strong> page.", choices: [{ label: "Main Menu", query: "menu" }] };
        }
        if (q.match(/\b(where|location|address|contact|phone)\b/)) {
            return { text: "Barangay Tibungco Hall: Tibungco, Davao City. Contact details are in the About Us section.", choices: [{ label: "Main Menu", query: "menu" }] };
        }
        return { text: "I can only answer questions about the Barangay Smart Portal. Please ask a system-related question.", choices: mainMenuChoices };
    };

    // 10. Initialize
    initChat();
});
