let stompClient = null;
let rooms = [];
let currentRoomId = null;
let roomSubscriptions = {};
let unreadByRoom = {};
let roomQuery = '';
let pendingOwnRoomMessages = [];

function getAuth() {
    return {
        userId: Number(localStorage.getItem('userId')),
        username: localStorage.getItem('username'),
        token: localStorage.getItem('token')
    };
}

function toggleSidebar() {
    document.getElementById('roomSidebar').classList.toggle('open');
    document.getElementById('mobileOverlay').classList.toggle('show');
}

function closeSidebar() {
    document.getElementById('roomSidebar').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('show');
}

function scrollMessagesToBottom() {
    const messagesEl = document.getElementById('messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function rememberPendingOwnRoomMessage(roomId, content) {
    pendingOwnRoomMessages.push({
        roomId: Number(roomId),
        content: content,
        createdAt: Date.now()
    });
    pendingOwnRoomMessages = pendingOwnRoomMessages.filter(function (item) {
        return Date.now() - item.createdAt < 15000;
    });
}

function consumePendingOwnRoomMessage(roomId, content) {
    const targetRoomId = Number(roomId);
    const index = pendingOwnRoomMessages.findIndex(function (item) {
        return item.roomId === targetRoomId && item.content === content;
    });
    if (index < 0) {
        return false;
    }
    pendingOwnRoomMessages.splice(index, 1);
    return true;
}

function handleRoomMessage(msg) {
    const roomId = Number(msg && msg.roomId);
    if (!msg || !Number.isFinite(roomId)) {
        return;
    }

    const auth = getAuth();
    const isOwnMessage = Number(msg.senderId) === auth.userId;
    if (isOwnMessage && consumePendingOwnRoomMessage(roomId, msg.content)) {
        return;
    }

    const activeRoomVisible = roomId === Number(currentRoomId) && document.visibilityState === 'visible';
    if (activeRoomVisible) {
        showMessage(msg, true);
        return;
    }

    unreadByRoom[roomId] = (unreadByRoom[roomId] || 0) + 1;
    renderRooms();
}

function updateRoomSubscriptions() {
    if (!stompClient || !stompClient.connected) {
        return;
    }

    const validRoomIds = new Set(rooms.map(function (room) { return room.id; }));

    Object.keys(roomSubscriptions).forEach(function (roomIdKey) {
        const roomId = Number(roomIdKey);
        if (!validRoomIds.has(roomId)) {
            roomSubscriptions[roomIdKey].unsubscribe();
            delete roomSubscriptions[roomIdKey];
            delete unreadByRoom[roomIdKey];
        }
    });

    rooms.forEach(function (room) {
        if (roomSubscriptions[room.id]) {
            return;
        }

        roomSubscriptions[room.id] = stompClient.subscribe('/topic/room.' + room.id, function (message) {
            handleRoomMessage(JSON.parse(message.body));
        });
    });
}

function renderRooms() {
    const listEl = document.getElementById('roomList');
    listEl.innerHTML = '';

    const filteredRooms = rooms.filter(function (room) {
        return room.name.toLowerCase().includes(roomQuery);
    });

    if (!filteredRooms.length) {
        listEl.innerHTML = '<li class="status-message">No rooms found</li>';
        return;
    }

    filteredRooms.forEach(function (room) {
        const li = document.createElement('li');

        const button = document.createElement('button');
        button.className = 'room-item';
        if (room.id === currentRoomId) {
            button.classList.add('active');
        }

        const name = document.createElement('span');
        name.className = 'room-name';
        name.textContent = room.name;

        button.appendChild(name);

        const unread = unreadByRoom[room.id] || 0;
        if (unread > 0) {
            const badge = document.createElement('span');
            badge.className = 'unread-badge';
            badge.textContent = unread > 99 ? '99+' : String(unread);
            button.appendChild(badge);
        }

        button.addEventListener('click', function () {
            selectRoom(room.id, room.name);
        });

        li.appendChild(button);
        listEl.appendChild(li);
    });
}

async function loadRooms() {
    const auth = getAuth();

    try {
        const resp = await fetch('/api/rooms', {
            headers: {
                Authorization: 'Bearer ' + auth.token
            }
        });

        if (!resp.ok) {
            console.error('Failed to load rooms', resp.status);
            return;
        }

        rooms = await resp.json();

        rooms.forEach(function (room) {
            if (!Object.prototype.hasOwnProperty.call(unreadByRoom, room.id)) {
                unreadByRoom[room.id] = 0;
            }
        });

        renderRooms();
        updateRoomSubscriptions();

        const currentExists = rooms.some(function (room) { return room.id === currentRoomId; });
        if (!currentExists && rooms.length > 0) {
            selectRoom(rooms[0].id, rooms[0].name);
        }
    } catch (e) {
        console.error('Error loading rooms', e);
    }
}

async function selectRoom(roomId, roomName) {
    currentRoomId = roomId;
    unreadByRoom[roomId] = 0;

    document.getElementById('currentRoomName').textContent = roomName;
    renderRooms();
    closeSidebar();

    const messagesEl = document.getElementById('messages');
    messagesEl.innerHTML = '';

    const auth = getAuth();
    try {
        const resp = await fetch('/api/rooms/' + roomId + '/messages', {
            headers: { Authorization: 'Bearer ' + auth.token }
        });

        if (resp.ok) {
            const history = await resp.json();
            history.forEach(function (message) {
                showMessage(message, false);
            });
            scrollMessagesToBottom();
        } else {
            console.error('Failed to load room history', resp.status);
        }
    } catch (e) {
        console.error('Error loading room history', e);
    }
}

function showMessage(msg, animate) {
    if (Number(msg.roomId) !== Number(currentRoomId)) {
        return;
    }

    const auth = getAuth();
    const mine = Number(msg.senderId) === auth.userId;
    const messagesEl = document.getElementById('messages');

    const row = document.createElement('div');
    row.className = mine ? 'message-row mine' : 'message-row';
    if (animate === false) {
        row.classList.add('instant');
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const time = new Date(msg.timestamp).toLocaleTimeString(navigator.language, {
        hour: 'numeric',
        minute: '2-digit'
    });

    meta.textContent = (msg.senderUsername || 'Unknown') + ' - ' + time;

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = msg.content;

    bubble.append(meta, content);
    row.appendChild(bubble);
    messagesEl.appendChild(row);

    scrollMessagesToBottom();
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content) {
        return;
    }

    if (!stompClient || !stompClient.connected) {
        alert('Not connected');
        return;
    }

    if (!currentRoomId) {
        alert('Select a room first');
        return;
    }

    const auth = getAuth();
    if (!auth.userId) {
        alert('No user session found. Login again.');
        return;
    }

    const chatMessage = {
        roomId: currentRoomId,
        receiverId: null,
        senderId: auth.userId,
        content: content
    };

    rememberPendingOwnRoomMessage(currentRoomId, content);
    showMessage(
        {
            roomId: currentRoomId,
            senderId: auth.userId,
            senderUsername: auth.username || 'You',
            content: content,
            timestamp: new Date().toISOString()
        },
        true
    );

    stompClient.send('/app/chat.send', {}, JSON.stringify(chatMessage));
    input.value = '';
}

function connect() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    const auth = getAuth();

    stompClient.connect(
        { Authorization: 'Bearer ' + auth.token },
        function () {
            loadRooms();
        },
        function (error) {
            console.error('STOMP error: ', error);
        }
    );
}

window.addEventListener('load', function () {
    const auth = getAuth();
    if (!auth.token) {
        window.location.href = '/index.html';
        return;
    }

    document.getElementById('currentUser').textContent = auth.username || '';

    document.getElementById('messageInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    document.getElementById('roomSearchInput').addEventListener('input', function (event) {
        roomQuery = event.target.value.trim().toLowerCase();
        renderRooms();
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && currentRoomId) {
            unreadByRoom[currentRoomId] = 0;
            renderRooms();
        }
    });

    connect();
});
