/* =========================================================
   SKYLINE INBOX
   ========================================================= */

(() => {

    "use strict";


    /* =============================================
       DATA
    ============================================= */

    const DEFAULT_CONVERSATIONS = [

        {
            id: "sarah",
            name: "Sarah Johnson",
            username: "@sarahjohnson",
            avatar: "img/dondire.jpeg",
            online: true,
            unread: 2,
            messages: [
                {
                    id: "m1",
                    sender: "them",
                    text: "Hey! Are you available?",
                    time: "10:40 AM",
                    date: "Today",
                    read: true
                },
                {
                    id: "m2",
                    sender: "me",
                    text: "Yes, I'm here. What's up?",
                    time: "10:41 AM",
                    date: "Today",
                    read: true
                },
                {
                    id: "m3",
                    sender: "them",
                    text: "I wanted to ask you about the new SkyLine app.",
                    time: "10:42 AM",
                    date: "Today",
                    read: true
                }
            ]
        },

        {
            id: "michael",
            name: "Michael James",
            username: "@michaeljames",
            avatar: "img/dondire.jpeg",
            online: false,
            unread: 0,
            messages: [
                {
                    id: "m4",
                    sender: "them",
                    text: "Payment received ✓",
                    time: "9:18 AM",
                    date: "Today",
                    read: true
                }
            ]
        },

        {
            id: "support",
            name: "SkyLine Support",
            username: "@skylinesupport",
            avatar: "img/dondire.jpeg",
            online: true,
            unread: 1,
            messages: [
                {
                    id: "m5",
                    sender: "them",
                    text: "Welcome to SkyLine! How can we help you?",
                    time: "Yesterday",
                    date: "Yesterday",
                    read: true
                }
            ]
        }

    ];


    /* =============================================
       ELEMENTS
    ============================================= */

    const conversationList =
        document.getElementById("conversationList");

    const conversationSearch =
        document.getElementById("conversationSearch");

    const conversationPanel =
        document.getElementById("conversationPanel");

    const chatPanel =
        document.getElementById("chatPanel");

    const messagesContainer =
        document.getElementById("messages");

    const chatUserName =
        document.getElementById("chatUserName");

    const chatStatus =
        document.getElementById("chatStatus");

    const chatAvatar =
        document.getElementById("chatAvatar");

    const chatOnlineDot =
        document.getElementById("chatOnlineDot");

    const messageForm =
        document.getElementById("messageForm");

    const messageInput =
        document.getElementById("messageInput");

    const attachmentInput =
        document.getElementById("attachmentInput");

    const attachmentPreview =
        document.getElementById("attachmentPreview");

    const attachmentPreviewContent =
        document.getElementById(
            "attachmentPreviewContent"
        );

    const removeAttachment =
        document.getElementById(
            "removeAttachment"
        );

    const emojiBtn =
        document.getElementById("emojiBtn");

    const emojiPanel =
        document.getElementById("emojiPanel");

    const newMessageBtn =
        document.getElementById(
            "newMessageBtn"
        );

    const newMessageModal =
        document.getElementById(
            "newMessageModal"
        );

    const closeNewMessage =
        document.getElementById(
            "closeNewMessage"
        );

    const startConversation =
        document.getElementById(
            "startConversation"
        );

    const recipientAccount =
        document.getElementById(
            "recipientAccount"
        );

    const backToInbox =
        document.getElementById("backToInbox");

    const audioCallBtn =
        document.getElementById(
            "audioCallBtn"
        );

    const videoCallBtn =
        document.getElementById(
            "videoCallBtn"
        );

    const chatMenuBtn =
        document.getElementById(
            "chatMenuBtn"
        );

    const chatDropdown =
        document.getElementById(
            "chatDropdown"
        );

    const clearChatBtn =
        document.getElementById(
            "clearChatBtn"
        );

    const closeChatMenu =
        document.getElementById(
            "closeChatMenu"
        );

    const logoutLink =
        document.getElementById(
            "logoutLink"
        );

    const inboxCount =
        document.getElementById(
            "inboxCount"
        );

const payChatBtn =
    document.getElementById("payChatBtn");

const moneyModal =
    document.getElementById("moneyModal");

const closeMoneyModal =
    document.getElementById("closeMoneyModal");

const moneyRecipientAvatar =
    document.getElementById(
        "moneyRecipientAvatar"
    );

const moneyRecipientName =
    document.getElementById(
        "moneyRecipientName"
    );

const moneyRecipientUsername =
    document.getElementById(
        "moneyRecipientUsername"
    );

const moneyAmount =
    document.getElementById("moneyAmount");

const moneyNote =
    document.getElementById("moneyNote");

const moneySubmitBtn =
    document.getElementById(
        "moneySubmitBtn"
    );

const moneyTabs =
    document.querySelectorAll(".money-tab");

const quickAmountButtons =
    document.querySelectorAll(
        ".quick-amounts button"
    );

let moneyMode = "send";
    /* =============================================
       STATE
    ============================================= */

    let conversations = loadConversations();

    let activeConversationId = null;

    let selectedAttachment = null;


    /* =============================================
       STORAGE
    ============================================= */

    function loadConversations() {

        try {

            const stored =
                localStorage.getItem(
                    "skylineConversations"
                );

            if (stored) {

                const parsed =
                    JSON.parse(stored);

                if (Array.isArray(parsed)) {
                    return parsed;
                }

            }

        } catch (error) {

            console.error(
                "Could not load conversations:",
                error
            );

        }


        if (typeof structuredClone === "function") {
            return structuredClone(DEFAULT_CONVERSATIONS);
        }

        return JSON.parse(
            JSON.stringify(DEFAULT_CONVERSATIONS)
        );

    }


    function saveConversations() {

        try {

            localStorage.setItem(
                "skylineConversations",
                JSON.stringify(conversations)
            );

        } catch (error) {

            console.error(
                "Could not save conversations:",
                error
            );

        }

    }


    /* =============================================
       HELPERS
    ============================================= */

    function getActiveConversation() {

        return conversations.find(
            conversation =>
                conversation.id ===
                activeConversationId
        );

    }


    function getCurrentTime() {

        return new Date()
            .toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );

    }


    function escapeHTML(value) {

        const element =
            document.createElement("div");

        element.textContent = value;

        return element.innerHTML;

    }


   function scrollToBottom() {

    requestAnimationFrame(() => {

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;

    });

    }


    /* =============================================
       RENDER CONVERSATIONS
    ============================================= */

    function renderConversations(
        searchValue = ""
    ) {

        conversationList.innerHTML = "";

        const search =
            searchValue
                .trim()
                .toLowerCase();


        const filtered =
            conversations.filter(
                conversation => {

                    return (
                        conversation.name
                            .toLowerCase()
                            .includes(search) ||

                        conversation.username
                            .toLowerCase()
                            .includes(search)
                    );

                }
            );


        if (!filtered.length) {

            conversationList.innerHTML = `

                <div class="no-conversations">

                    <div>🔎</div>

                    <p>
                        No conversations found.
                    </p>

                </div>

            `;

            updateInboxCount();

            return;

        }


        filtered.forEach(
            conversation => {

                const button =
                    document.createElement("button");

                button.type = "button";

                button.className =
                    "conversation";

                if (
                    conversation.id ===
                    activeConversationId
                ) {

                    button.classList.add("active");

                }


                const lastMessage =
                    conversation.messages[
                        conversation.messages.length - 1
                    ];


                const preview =
                    lastMessage
                        ? lastMessage.text
                        : "No messages yet";


                button.innerHTML = `

                    <div class="conversation-avatar">

                        <img
                            src="${escapeHTML(conversation.avatar)}"
                            alt="${escapeHTML(conversation.name)}">

                        ${
                            conversation.online
                                ? `<span class="online-dot"></span>`
                                : ""
                        }

                    </div>


                    <div class="conversation-info">

                        <strong>
                            ${escapeHTML(conversation.name)}
                        </strong>

                        <p>
                            ${escapeHTML(preview)}
                        </p>

                    </div>


                    <div class="conversation-meta">

                        <small>
                            ${
                                lastMessage
                                    ? escapeHTML(lastMessage.time)
                                    : ""
                            }
                        </small>

                        ${
                            conversation.unread > 0
                                ? `
                                    <span class="unread-badge">
                                        ${conversation.unread}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                `;


                button.addEventListener(
                    "click",
                    () => {

                        openConversation(
                            conversation.id
                        );

                    }
                );


                conversationList.appendChild(
                    button
                );

            }
        );


        updateInboxCount();

    }


    /* =============================================
       INBOX COUNT
    ============================================= */

    function updateInboxCount() {

        const count =
            conversations.reduce(
                (total, conversation) =>
                    total +
                    Number(
                        conversation.unread || 0
                    ),
                0
            );


        inboxCount.textContent =
            count === 1
                ? "1 unread message"
                : `${count} unread messages`;

    }


    /* =============================================
       OPEN CONVERSATION
    ============================================= */

    function openConversation(id) {

        const conversation =
            conversations.find(
                item => item.id === id
            );


        if (!conversation) return;


        activeConversationId = id;


        conversation.unread = 0;

        saveConversations();


        renderConversations(
            conversationSearch.value
        );


        chatUserName.textContent =
            conversation.name;


        chatStatus.textContent =
            conversation.online
                ? "Online"
                : "Offline";


        chatStatus.className =
            conversation.online
                ? "online-status"
                : "offline-status";


        chatAvatar.src =
            conversation.avatar;


        chatAvatar.alt =
            conversation.name;


        chatOnlineDot.style.display =
            conversation.online
                ? "block"
                : "none";


        renderMessages(
            conversation
        );


        /* Mobile */

        if (
            window.innerWidth <= 750
        ) {

            conversationPanel.classList.add(
                "mobile-hidden"
            );

            chatPanel.classList.add(
                "mobile-visible"
            );

        }

    }


    /* =============================================
       RENDER MESSAGES
    ============================================= */

    function renderMessages(
        conversation
    ) {

        if (!conversation.messages.length) {

            messagesContainer.innerHTML = `

                <div class="empty-chat">

                    <div class="empty-chat-icon">
                        💬
                    </div>

                    <h2>
                        Start a conversation
                    </h2>

                    <p>
                        Send a message to
                        ${escapeHTML(conversation.name)}.
                    </p>

                </div>

            `;

            return;

        }


        messagesContainer.innerHTML = "";


        conversation.messages.forEach(
            message => {

                const wrapper =
                    document.createElement("div");

                wrapper.className =
                    `message ${
                        message.sender === "me"
                            ? "sent"
                            : "received"
                    }`;


                let attachmentHTML = "";


                if (message.attachment) {

                    if (
                        message.attachment.type
                            .startsWith("image/")
                    ) {

                        attachmentHTML = `

                            <div class="message-attachment">

                                <img
                                    src="${message.attachment.data}"
                                    alt="Attachment">

                            </div>

                        `;

                    } else {

                        attachmentHTML = `

                            <div class="file-message">

                                📎

                                <span>
                                    ${escapeHTML(
                                        message.attachment.name
                                    )}
                                </span>

                            </div>

                        `;

                    }

                }


                wrapper.innerHTML = `

                    ${attachmentHTML}

                    ${
                        message.text
                            ? `
                                <p>
                                    ${escapeHTML(
                                        message.text
                                    )}
                                </p>
                              `
                            : ""
                    }

                    <small>

                        ${escapeHTML(message.time)}

                        ${
                            message.sender === "me"
                                ? `
                                    <span
                                        class="message-status">
                                        ✓✓
                                    </span>
                                  `
                                : ""
                        }

                    </small>

                `;


                messagesContainer.appendChild(
                    wrapper
                );

            }
        );


        scrollToBottom();

    }


    /* =============================================
       SEND MESSAGE
    ============================================= */

    messageForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const conversation =
                getActiveConversation();


            if (!conversation) {

                alert(
                    "Select a conversation first."
                );

                return;

            }


            const text =
                messageInput.value.trim();


            if (
                !text &&
                !selectedAttachment
            ) {

                return;

            }


            const message = {

                id:
                    `message-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2, 8)}`,

                sender: "me",

                text,

                time:
                    getCurrentTime(),

                date: "Today",

                read: false

            };


            if (selectedAttachment) {

                message.attachment = {

                    name:
                        selectedAttachment.name,

                    type:
                        selectedAttachment.type,

                    data:
                        selectedAttachment.data

                };

            }


            conversation.messages.push(
                message
            );


            saveConversations();


            messageInput.value = "";

            clearAttachment();

            renderMessages(
                conversation
            );


            renderConversations(
                conversationSearch.value
            );


            /*
                DEMO RESPONSE

                This simulates the recipient
                replying. The backend will replace
                this once real-time messaging exists.
            */

            scheduleDemoReply(
                conversation
            );

        }
    );


    /* =============================================
       DEMO REPLY
    ============================================= */

    function scheduleDemoReply(
        conversation
    ) {

        setTimeout(() => {

            if (
                conversation.id !==
                activeConversationId
            ) {
                conversation.unread += 1;
            }


            conversation.messages.push({

                id:
                    `reply-${Date.now()}`,

                sender: "them",

                text:
                    "Got your message 👍",

                time:
                    getCurrentTime(),

                date: "Today",

                read: false

            });


            saveConversations();


            if (
                conversation.id ===
                activeConversationId
            ) {

                renderMessages(
                    conversation
                );

            }


            renderConversations(
                conversationSearch.value
            );

        }, 1400);

    }


    /* =============================================
       SEARCH
    ============================================= */

    conversationSearch.addEventListener(
        "input",
        function () {

            renderConversations(
                this.value
            );

        }
    );


    /* =============================================
       EMOJI
    ============================================= */

    emojiBtn.addEventListener(
        "click",
        function () {

            emojiPanel.classList.toggle(
                "show"
            );

        }
    );


    emojiPanel
        .querySelectorAll("button")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    messageInput.value +=
                        this.textContent;

                    messageInput.focus();

                    emojiPanel.classList.remove(
                        "show"
                    );

                }
            );

        });


    /* =============================================
       ATTACHMENT
    ============================================= */

    attachmentInput.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];


            if (!file) return;


            if (
                file.size >
                10 * 1024 * 1024
            ) {

                alert(
                    "Please select a file smaller than 10 MB."
                );

                this.value = "";

                return;

            }


            const reader =
                new FileReader();


            reader.onload = function (event) {

                selectedAttachment = {

                    name:
                        file.name,

                    type:
                        file.type ||
                        "application/octet-stream",

                    data:
                        event.target.result

                };


                renderAttachmentPreview();

            };


            reader.readAsDataURL(file);

        }
    );


    function renderAttachmentPreview() {

        if (!selectedAttachment) {

            clearAttachment();

            return;

        }


        attachmentPreview.classList.add(
            "show"
        );


        if (
            selectedAttachment.type
                .startsWith("image/")
        ) {

            attachmentPreviewContent.innerHTML = `

                <img
                    src="${selectedAttachment.data}"
                    alt="Attachment preview">

                <span>
                    ${escapeHTML(
                        selectedAttachment.name
                    )}
                </span>

            `;

        } else {

            attachmentPreviewContent.innerHTML = `

                📎

                <span>
                    ${escapeHTML(
                        selectedAttachment.name
                    )}
                </span>

            `;

        }

    }


    function clearAttachment() {

        selectedAttachment = null;

        attachmentInput.value = "";

        attachmentPreview.classList.remove(
            "show"
        );

        attachmentPreviewContent.innerHTML =
            "";

    }


    removeAttachment.addEventListener(
        "click",
        clearAttachment
    );


    /* =============================================
       NEW CONVERSATION
    ============================================= */

    newMessageBtn.addEventListener(
        "click",
        function () {

            newMessageModal.classList.add(
                "show"
            );

            recipientAccount.focus();

        }
    );


    closeNewMessage.addEventListener(
        "click",
        function () {

            closeNewConversation();

        }
    );


    function closeNewConversation() {

        newMessageModal.classList.remove(
            "show"
        );

        recipientAccount.value = "";

    }


    startConversation.addEventListener(
        "click",
        function () {

            const recipient =
                recipientAccount.value
                    .trim();


            if (!recipient) {

                recipientAccount.focus();

                return;

            }


            const displayName =
                recipient.startsWith("@")
                    ? recipient.substring(1)
                    : `User ${recipient}`;


            const id =
                `user-${Date.now()}`;


            conversations.unshift({

                id,

                name:
                    displayName,

                username:
                    recipient.startsWith("@")
                        ? recipient
                        : `@${recipient}`,

                avatar:
                    "img/dondire.jpeg",

                online:
                    true,

                unread:
                    0,

                messages: []

            });


            saveConversations();


            closeNewConversation();


            renderConversations();


            openConversation(id);

        }
    );


    /* =============================================
       CALL BUTTONS
    ============================================= */

    audioCallBtn.addEventListener(
        "click",
        function () {

            const conversation =
                getActiveConversation();


            if (!conversation) return;


            alert(
                `Voice calling ${conversation.name} will be connected to the calling service by the backend.`
            );

        }
    );


    videoCallBtn.addEventListener(
        "click",
        function () {

            const conversation =
                getActiveConversation();


            if (!conversation) return;


            alert(
                `Video calling ${conversation.name} will be connected to the calling service by the backend.`
            );

        }
    );


    /* =============================================
       CHAT MENU
    ============================================= */

    chatMenuBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            chatDropdown.classList.toggle(
                "show"
            );

        }
    );


    closeChatMenu.addEventListener(
        "click",
        function () {

            chatDropdown.classList.remove(
                "show"
            );

        }
    );


    clearChatBtn.addEventListener(
        "click",
        function () {

            const conversation =
                getActiveConversation();


            if (!conversation) return;


            const confirmed =
                window.confirm(
                    `Clear the conversation with ${conversation.name}?`
                );


            if (!confirmed) return;


            conversation.messages = [];

            saveConversations();

            renderMessages(
                conversation
            );

            chatDropdown.classList.remove(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        function () {

            chatDropdown.classList.remove(
                "show"
            );

            emojiPanel.classList.remove(
                "show"
            );

        }
    );


    emojiPanel.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );


    /* =============================================
       MOBILE
    ============================================= */

    backToInbox.addEventListener(
        "click",
        function () {

            conversationPanel.classList.remove(
                "mobile-hidden"
            );

            chatPanel.classList.remove(
                "mobile-visible"
            );

        }
    );


    /* =============================================
       LOGOUT
    ============================================= */

    if (logoutLink) {

        logoutLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (
                    typeof window.skylineLogout ===
                    "function"
                ) {

                    window.skylineLogout();

                }

            }
        );

    }

    /* =============================================
   PAY / REQUEST MONEY
============================================= */

function updateMoneyButton() {

    const amount =
        Number(
            moneyAmount.value || 0
        );


    const formatted =
        amount.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );


    moneySubmitBtn.textContent =
        moneyMode === "send"
            ? `Send ₦${formatted}`
            : `Request ₦${formatted}`;

}


function openMoneyModal() {

    const conversation =
        getActiveConversation();


    if (!conversation) {

        alert(
            "Select a conversation first."
        );

        return;

    }


    moneyRecipientName.textContent =
        conversation.name;


    moneyRecipientUsername.textContent =
        conversation.username;


    moneyRecipientAvatar.src =
        conversation.avatar;


    moneyRecipientAvatar.alt =
        conversation.name;


    moneyAmount.value = "";

    moneyNote.value = "";

    moneyMode = "send";


    moneyTabs.forEach(tab => {

        tab.classList.toggle(
            "active",
            tab.dataset.mode === "send"
        );

    });


    moneyModal.classList.remove(
        "request-mode"
    );


    updateMoneyButton();


    moneyModal.classList.add(
        "show"
    );


    setTimeout(() => {

        moneyAmount.focus();

    }, 100);

}


function closeMoney() {

    moneyModal.classList.remove(
        "show"
    );

}


if (payChatBtn) {

    payChatBtn.addEventListener(
        "click",
        openMoneyModal
    );

}


if (closeMoneyModal) {

    closeMoneyModal.addEventListener(
        "click",
        closeMoney
    );

}


/* SEND / REQUEST */

moneyTabs.forEach(tab => {

    tab.addEventListener(
        "click",
        function () {

            moneyMode =
                this.dataset.mode;


            moneyTabs.forEach(item => {

                item.classList.toggle(
                    "active",
                    item === this
                );

            });


            moneyModal.classList.toggle(
                "request-mode",
                moneyMode === "request"
            );


            updateMoneyButton();

        }
    );

});


/* QUICK AMOUNTS */

quickAmountButtons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            moneyAmount.value =
                this.dataset.amount;

            updateMoneyButton();

        }
    );

});


/* AMOUNT CHANGE */

moneyAmount.addEventListener(
    "input",
    updateMoneyButton
);


/* SUBMIT */

moneySubmitBtn.addEventListener(
    "click",
    function () {

        const conversation =
            getActiveConversation();


        const amount =
            Number(
                moneyAmount.value
            );


        if (!conversation) {

            return;

        }


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Enter a valid amount."
            );

            moneyAmount.focus();

            return;

        }


        const note =
            moneyNote.value.trim();


        const action =
            moneyMode === "send"
                ? "payment"
                : "money request";


        const transaction = {

            id:
                `tx-${Date.now()}`,

            type:
                moneyMode,

            recipient:
                conversation.username,

            recipientName:
                conversation.name,

            amount,

            note,

            status:
                "demo-pending",

            createdAt:
                new Date().toISOString()

        };


        saveDemoTransaction(
            transaction
        );


        addMoneyMessage(
            conversation,
            transaction
        );


        closeMoney();


        renderMessages(
            conversation
        );


        renderConversations(
            conversationSearch.value
        );


        alert(
            moneyMode === "send"
                ? `Demo payment of ₦${amount.toLocaleString("en-NG")} prepared for ${conversation.name}.`
                : `Demo money request of ₦${amount.toLocaleString("en-NG")} prepared for ${conversation.name}.`
        );

    }
);


function saveDemoTransaction(
    transaction
) {

    let transactions = [];


    try {

        const existing =
            localStorage.getItem(
                "skylineDemoTransactions"
            );


        if (existing) {

            transactions =
                JSON.parse(existing);

        }

    } catch (error) {

        transactions = [];

    }


    transactions.push(
        transaction
    );


    localStorage.setItem(
        "skylineDemoTransactions",
        JSON.stringify(
            transactions
        )
    );

}


function addMoneyMessage(
    conversation,
    transaction
) {

    const formattedAmount =
        transaction.amount.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2
            }
        );


    const text =
        transaction.type === "send"

            ? `💳 Sent ₦${formattedAmount}${transaction.note ? ` — ${transaction.note}` : ""}`

            : `💰 Requested ₦${formattedAmount}${transaction.note ? ` — ${transaction.note}` : ""}`;


    conversation.messages.push({

        id:
            `money-${Date.now()}`,

        sender:
            "me",

        text,

        time:
            getCurrentTime(),

        date:
            "Today",

        read:
            false,

        moneyTransaction:
            transaction

    });


    saveConversations();

}
    /* =============================================
       INITIALIZE
    ============================================= */

    renderConversations();


    /*
        Automatically open first conversation
        on desktop.
    */

    if (
        window.innerWidth > 750 &&
        conversations.length
    ) {

        openConversation(
            conversations[0].id
        );

    }
})();