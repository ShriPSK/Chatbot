/*
 * Trinom Digital Pvt Ltd ("COMPANY") CONFIDENTIAL                             *
 * Copyright (c) 2025 Trinom Digital Pvt Ltd, All rights reserved              *
 *                                                                             *
 * NOTICE:  All information contained herein is, and remains the property      *
 * of COMPANY. The intellectual and technical concepts contained herein are    *
 * proprietary to COMPANY and may be covered by Indian and Foreign Patents,    *
 * patents in process, and are protected by trade secret or copyright law.     *
 * Dissemination of this information or reproduction of this material is       *
 * strictly forbidden unless prior written permission is obtained from         *
 * COMPANY. Access to the source code contained herein is hereby forbidden     *
 * to anyone except current COMPANY employees, managers or contractors who     *
 * have executed Confidentiality and Non-disclosure agreements explicitly      *
 * covering such access.                                                       *
 *                                                                             *
 * The copyright notice above does not evidence any actual or intended         *
 * publication or disclosure of this source code, which includes               *
 * information that is confidential and/or proprietary, and is a trade secret, *
 * of COMPANY. ANY REPRODUCTION, MODIFICATION, DISTRIBUTION, PUBLIC            *
 * PERFORMANCE, OR PUBLIC DISPLAY OF OR THROUGH USE OF THIS SOURCE CODE        *
 * WITHOUT THE EXPRESS WRITTEN CONSENT OF COMPANY IS STRICTLY PROHIBITED,      *
 * AND IN VIOLATION OF APPLICABLE LAWS AND INTERNATIONAL TREATIES. THE         *
 * RECEIPT OR POSSESSION OF THIS SOURCE CODE AND/OR RELATED INFORMATION DOES   *
 * NOT CONVEY OR IMPLY ANY RIGHTS TO REPRODUCE, DISCLOSE OR DISTRIBUTE ITS     *
 * CONTENTS, OR TO MANUFACTURE, USE, OR SELL ANYTHING THAT IT MAY DESCRIBE,    *
 * IN WHOLE OR IN PART.                                                        *
 *                                                                             *
 * File: \index.js                                                             *
 * Project: Chatbot                                                            *
 * Created Date: Thursday, March 20th 2025, 10:22:12 pm                        *
 * Author: Shri Kaanth <shrikaanth@codestax.ai>                                *
 * -----                                                                       *
 * Last Modified: March 21st 2025, 8:22:46 pm                                  *
 * Modified By: Shri Kaanth                                                    *
 * -----                                                                       *
 * Any app that can be written in JavaScript,                                  *
 *     will eventually be written in JavaScript !!                             *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date         By  Comments                                                   *
 * --------------------------------------------------------------------------- *
 */

function initializeChat(config) {
    let socket;
    let botMessageElement;
    let inactivityTimer;
    let aiMessageElement;
    const inactivityDuration = 5 * 60 * 1000;

    const chatWindow = document.getElementById('chat-window');
    const chatBody = document.getElementById('chatBody');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    if (config.showInitialMessage && config.messageTimer) {
        setTimeout(() => {
            if (chatBody.querySelectorAll('.user-message').length === 0) {
                addMessage(config.message, 'bot-message');
            }
        }, config.messageTimer);
    }

    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !sendButton.disabled) {
            event.preventDefault();
            sendMessage();
        }
        resetInactivityTimer();
    });

    messageInput.addEventListener('input', resetInactivityTimer);

    sendButton.addEventListener('click', () => {
        sendMessage();
        resetInactivityTimer();
    });

    async function sendMessage() {
        sendButton.disabled = true;
        
        const message = messageInput.value.trim();
        addMessage(message, 'user-message');
        messageInput.value = '';
        
        addLoader();
        if (message !== '') {
            const apiKey = "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";
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: message }],
                    stream: true  // Enable streaming
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiMessageElement = addMessage('', 'bot-message');
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    sendButton.disabled = false;
                    aiMessageElement = null;
                    break;
                };
                removeLoader();
                const chunk = decoder.decode(value, { stream: true });

                // Extract actual message from the stream response
                chunk.split("\n").forEach(line => {
                    if (line.startsWith("data: ")) {
                        try {
                            const json = JSON.parse(line.replace("data: ", ""));
                            if (json.choices?.[0]?.delta?.content) {
                                aiMessageElement.innerHTML += formatBotMessageText(json.choices[0].delta.content); // Append text in real-time
                            }
                        } catch (e) {
                            console.error("Error parsing JSON:", e);
                        }
                    }
                });
            }
        }
    }

    function addMessage(message, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.innerHTML = message;
        if (type === 'user-message') {
            messageElement.style.backgroundColor = config.headerBackgroundColor;
            messageElement.style.color = config.headerTitleColor;
        }
        chatBody.appendChild(messageElement);
        chatBody.scrollTop = chatBody.scrollHeight;
        return messageElement;
    }

    function addLoader() {
        const loaderContainer = document.createElement('div');
        loaderContainer.classList.add('message', 'bot-message');
        loaderContainer.innerHTML = `
            <div class="loader">
                <div class="typing-loader">
                    <div class="dot">.</div>
                    <div class="dot">.</div>
                    <div class="dot">.</div>
                </div>
            </div>`;
        chatBody.appendChild(loaderContainer);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeLoader() {
        const loaders = chatBody.querySelectorAll('.loader');
        loaders.forEach(loader => loader.parentElement.remove());
    }

    function formatBotMessageText(text) {
        return text
            .replace(/^data:\s*/, '')
            .replace(/data\s+"/g, '')
            .replace(/:\s*nn/g, ' ')
            .replace(/\\bn\\b/g, '<br>')
            .replace(/[#-]/g, '')
            .replace(/["]/g, '')
            .replace(/[-\/\\^$*+()[\]{}|]/g, ' ')
            .replace(/【\d+:\d+†source】/g, ' ')
            .replace(/\n/g, '<br>')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\s{2,}/g, ' ');
    }

    function startInactivityTimer() {
        inactivityTimer = setTimeout(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                addMessage('Your Current Chat is Closed Please Start a New Chat.', 'bot-message');
                socket.close();
            }
        }, inactivityDuration);
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        startInactivityTimer();
    }

    // Apply initial styling based on position
    chatWindow.style.position = 'fixed';
    switch (config.position) {
        case 'top-left':
            chatWindow.style.top = '25px';
            chatWindow.style.left = '25px';
            break;
        case 'top-right':
            chatWindow.style.top = '25px';
            chatWindow.style.right = '25px';
            break;
        case 'bottom-left':
            chatWindow.style.bottom = '25px';
            chatWindow.style.left = '25px';
            break;
        case 'bottom-right':
            chatWindow.style.bottom = '25px';
            chatWindow.style.right = '25px';
            break;
    }

    // Start the inactivity timer
    startInactivityTimer();
}