let stompClient = null;
let currentRoomId = null;
let currentSubscription = null;

function connect() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    const auth = getAuth();

    stompClient.connect({}, function () {
        console.log('Connected');

        // Subscribe to personal queue for private messages
        if (auth.userId) {
            stompClient.subscribe('/queue/user.' + auth.userId, function (message) {
                const body = JSON.parse(message.body);
                showMessage(body);
            });
        }

        // After WebSocket is ready, load rooms
        loadRooms();
    }, function (error) {
        console.error('STOMP error: ', error);
    });
}


function sendMessage() {
    const content = document.getElementById('messageInput').value;

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
        alert('No userId found (login first)');
        return;
    }

    const chatMessage = {
        roomId: currentRoomId,
        receiverId: null,
        senderId: auth.userId,
        content: content
    };

    stompClient.send('/app/chat.send', {}, JSON.stringify(chatMessage));
    document.getElementById('messageInput').value = '';
}

function sendPrivateMessage() {
    const content = document.getElementById('privateMessageInput').value;
    const receiverId = Number(document.getElementById('privateReceiverId').value);

    if (!stompClient || !stompClient.connected) {
        alert('Not connected');
        return;
    }

    const auth = getAuth();
    if (!auth.userId) {
        alert('No userId found (login first)');
        return;
    }
    if (!receiverId) {
        alert('Enter receiver userId');
        return;
    }

    const chatMessage = {
        roomId: null,
        receiverId: receiverId,
        senderId: auth.userId,
        content: content
    };

	 console.log('Sending private', chatMessage);
    stompClient.send('/app/chat.send', {}, JSON.stringify(chatMessage));
    document.getElementById('privateMessageInput').value = '';
}


function showMessage(msg) {
    const messagesEl = document.getElementById('messages');
    const time = new Date(msg.timestamp).toLocaleTimeString(
        navigator.language,
        { hour: 'numeric', minute: '2-digit' }
    );
    const line = `[${time}] ${msg.senderUsername || 'Unknown'}: ${msg.content}\n`;
    messagesEl.textContent += line;
}

function getAuth() {
    return {
        userId: Number(localStorage.getItem('userId')),
        username: localStorage.getItem('username'),
        token: localStorage.getItem('token')
    };
}

window.addEventListener('load', () => {
    const auth = getAuth();
    if (!auth.token) {
        window.location.href = '/index.html';
        return;
    }
    connect();
});

async function loadRooms() {
    const auth = getAuth();
    const resp = await fetch('/api/rooms', {
        headers: {
            'Authorization': 'Bearer ' + auth.token
        }
    });
    const rooms = await resp.json();

    const listEl = document.getElementById('roomList');
    listEl.innerHTML = '';

    rooms.forEach(room => {
        const li = document.createElement('li');
        li.textContent = room.name + ' (id=' + room.id + ')';
        li.style.cursor = 'pointer';
        li.onclick = () => selectRoom(room.id, room.name);
        listEl.appendChild(li);
    });

    if (rooms.length > 0 && currentRoomId === null) {
        selectRoom(rooms[0].id, rooms[0].name);
    }
}
async function selectRoom(roomId, roomName) {
    currentRoomId = roomId;
    document.getElementById('currentRoomName').textContent = roomName;

    if (currentSubscription) {
        currentSubscription.unsubscribe();
        currentSubscription = null;
    }

    const messagesEl = document.getElementById('messages');
    messagesEl.textContent = '';

    const auth = getAuth();
    try {
        const resp = await fetch(`/api/rooms/${roomId}/messages`, {
            headers: { 'Authorization': 'Bearer ' + auth.token }
        });
        if (resp.ok) {
            const history = await resp.json(); // List<MessageDto>
            history.forEach(m => showMessage(m)); // works as showMessage expects timestamp, senderUsername, content
        } else {
            console.error('Failed to load room history', resp.status);
        }
    } catch (e) {
        console.error('Error loading room history', e);
    }

    if (stompClient && stompClient.connected) {
        currentSubscription = stompClient.subscribe(
            '/topic/room.' + roomId,
            msg => showMessage(JSON.parse(msg.body)) // also MessageDto
        );
    }
}
