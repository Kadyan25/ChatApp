let stompClient = null;
let users = [];
let currentPeerId = null;
let unreadByUser = {};
let userQuery = '';
let pendingOwnPrivateMessages = [];

function getAuth() {
    return {
        userId: Number(localStorage.getItem('userId')),
        username: localStorage.getItem('username'),
        token: localStorage.getItem('token')
    };
}

function toggleSidebar() {
    document.getElementById('userSidebar').classList.toggle('open');
    document.getElementById('mobileOverlay').classList.toggle('show');
}

function closeSidebar() {
    document.getElementById('userSidebar').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('show');
}

function scrollMessagesToBottom() {
    const box = document.getElementById('privateMessages');
    box.scrollTop = box.scrollHeight;
}

function rememberPendingOwnPrivateMessage(receiverId, content) {
    pendingOwnPrivateMessages.push({
        receiverId: Number(receiverId),
        content: content,
        createdAt: Date.now()
    });
    pendingOwnPrivateMessages = pendingOwnPrivateMessages.filter(function (item) {
        return Date.now() - item.createdAt < 15000;
    });
}

function consumePendingOwnPrivateMessage(receiverId, content) {
    const targetReceiverId = Number(receiverId);
    const index = pendingOwnPrivateMessages.findIndex(function (item) {
        return item.receiverId === targetReceiverId && item.content === content;
    });
    if (index < 0) {
        return false;
    }
    pendingOwnPrivateMessages.splice(index, 1);
    return true;
}

function isCurrentConversationMessage(message, authUserId) {
    if (!currentPeerId) {
        return false;
    }

    const fromCurrentUser = Number(message.senderId) === authUserId && Number(message.receiverId) === Number(currentPeerId);
    const toCurrentUser = Number(message.senderId) === Number(currentPeerId) && Number(message.receiverId) === authUserId;
    return fromCurrentUser || toCurrentUser;
}

function renderUserList() {
    const list = document.getElementById('userList');
    list.innerHTML = '';

    const filteredUsers = users.filter(function (user) {
        return user.username.toLowerCase().includes(userQuery);
    });

    if (!filteredUsers.length) {
        list.innerHTML = '<li class="status-message">No users found</li>';
        return;
    }

    filteredUsers.forEach(function (user) {
        const li = document.createElement('li');
        li.className = 'user-list-item';

        const btn = document.createElement('button');
        btn.className = 'user-select-btn';
        if (user.id === currentPeerId) {
            btn.classList.add('active');
        }

        const dot = document.createElement('span');
        dot.className = 'presence-dot ' + (user.online ? 'online' : 'offline');

        const userName = document.createElement('span');
        userName.className = 'user-name';
        userName.textContent = user.username;

        const status = document.createElement('span');
        status.className = 'user-status';
        status.textContent = user.online ? 'Online' : 'Offline';

        btn.append(dot, userName, status);

        const unread = unreadByUser[user.id] || 0;
        if (unread > 0) {
            const badge = document.createElement('span');
            badge.className = 'unread-badge';
            badge.textContent = unread > 99 ? '99+' : String(unread);
            btn.appendChild(badge);
        }

        btn.addEventListener('click', function () {
            selectUser(user.id, user.username);
        });

        li.appendChild(btn);
        list.appendChild(li);
    });
}

async function loadUsers() {
    const auth = getAuth();

    try {
        const resp = await fetch('/api/users/presence', {
            headers: { Authorization: 'Bearer ' + auth.token }
        });

        if (!resp.ok) {
            console.error('Failed to load users', resp.status);
            return;
        }

        users = await resp.json();

        const knownUserIds = new Set(users.map(function (user) { return user.id; }));
        Object.keys(unreadByUser).forEach(function (userIdKey) {
            if (!knownUserIds.has(Number(userIdKey))) {
                delete unreadByUser[userIdKey];
            }
        });

        if (currentPeerId && !knownUserIds.has(currentPeerId)) {
            currentPeerId = null;
            document.getElementById('currentPeerName').textContent = 'Select a user';
            document.getElementById('privateMessages').innerHTML = '';
        }

        renderUserList();

        if (!currentPeerId && users.length > 0) {
            selectUser(users[0].id, users[0].username);
        }
    } catch (e) {
        console.error('Error loading users', e);
    }
}

function selectUser(userId, username) {
    if (currentPeerId === userId) {
        unreadByUser[userId] = 0;
        renderUserList();
        closeSidebar();
        return;
    }

    currentPeerId = userId;
    unreadByUser[userId] = 0;

    document.getElementById('currentPeerName').textContent = username;
    renderUserList();
    loadPrivateHistory();
    closeSidebar();
}

function handlePrivateQueueMessage(message, authUserId) {
    const senderId = Number(message.senderId);
    const receiverId = Number(message.receiverId);
    const isOwnMessage = senderId === authUserId;

    if (isOwnMessage && consumePendingOwnPrivateMessage(receiverId, message.content)) {
        return;
    }

    if (isCurrentConversationMessage(message, authUserId) && document.visibilityState === 'visible') {
        showPrivateMessage(message, true);
        return;
    }

    if (isOwnMessage) {
        return;
    }

    const otherUserId = senderId;
    if (otherUserId) {
        unreadByUser[otherUserId] = (unreadByUser[otherUserId] || 0) + 1;
        renderUserList();
    }
}

function connectPrivate() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    const auth = getAuth();

    stompClient.connect(
        { Authorization: 'Bearer ' + auth.token },
        function () {
            if (auth.userId) {
                stompClient.subscribe('/queue/user.' + auth.userId, function (msg) {
                    const body = JSON.parse(msg.body);
                    handlePrivateQueueMessage(body, auth.userId);
                });
            }
        },
        function (err) {
            console.error('STOMP error: ', err);
        }
    );
}

function showPrivateMessage(msg, animate) {
    const auth = getAuth();
    const mine = Number(msg.senderId) === auth.userId;
    const box = document.getElementById('privateMessages');

    const row = document.createElement('div');
    row.className = mine ? 'message-row mine' : 'message-row';
    if (animate === false) {
        row.classList.add('instant');
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const time = new Date(msg.timestamp).toLocaleTimeString(navigator.language, {
        hour: 'numeric',
        minute: '2-digit'
    });

    const who = mine ? 'You' : (msg.senderUsername || 'User ' + msg.senderId);

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = who + ' - ' + time;

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = msg.content;

    bubble.append(meta, content);
    row.appendChild(bubble);
    box.appendChild(row);

    scrollMessagesToBottom();
}

async function loadPrivateHistory() {
    if (!currentPeerId) {
        return;
    }

    unreadByUser[currentPeerId] = 0;
    renderUserList();

    const box = document.getElementById('privateMessages');
    box.innerHTML = '';

    const auth = getAuth();
    try {
        const resp = await fetch('/api/rooms/private/' + currentPeerId + '/messages', {
            headers: { Authorization: 'Bearer ' + auth.token }
        });

        if (resp.ok) {
            const history = await resp.json();
            history.forEach(function (message) {
                showPrivateMessage(message, false);
            });
            scrollMessagesToBottom();
        } else {
            console.error('Failed to load private history', resp.status);
        }
    } catch (e) {
        console.error('Error loading private history', e);
    }
}

function sendPrivateMessage() {
    const input = document.getElementById('privateMessageInput');
    const content = input.value.trim();
    const auth = getAuth();

    if (!content) {
        return;
    }

    if (!stompClient || !stompClient.connected) {
        alert('Not connected');
        return;
    }

    if (!auth.userId || !currentPeerId) {
        alert('Select a user first');
        return;
    }

    const chatMessage = {
        roomId: null,
        receiverId: currentPeerId,
        senderId: auth.userId,
        content: content
    };

    rememberPendingOwnPrivateMessage(currentPeerId, content);
    showPrivateMessage(
        {
            senderId: auth.userId,
            receiverId: currentPeerId,
            senderUsername: auth.username || 'You',
            content: content,
            timestamp: new Date().toISOString()
        },
        true
    );

    stompClient.send('/app/chat.send', {}, JSON.stringify(chatMessage));
    input.value = '';
}

window.addEventListener('load', function () {
    const auth = getAuth();
    if (!auth.token) {
        window.location.href = '/index.html';
        return;
    }

    document.getElementById('currentUser').textContent = auth.username || '';

    document.getElementById('privateMessageInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendPrivateMessage();
        }
    });

    document.getElementById('userSearchInput').addEventListener('input', function (event) {
        userQuery = event.target.value.trim().toLowerCase();
        renderUserList();
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && currentPeerId) {
            unreadByUser[currentPeerId] = 0;
            renderUserList();
        }
    });

    connectPrivate();
    loadUsers();
    setInterval(loadUsers, 5000);
});
