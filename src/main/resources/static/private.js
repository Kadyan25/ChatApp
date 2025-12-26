let stompClient = null;
let currentPeerId = null;

function getAuth() {
    return {
        userId: Number(localStorage.getItem('userId')),
        username: localStorage.getItem('username'),
        token: localStorage.getItem('token')
    };
}

async function loadOnlineUsers() {
    const auth = getAuth();
    try {
        const resp = await fetch('/api/users/online', {
            headers: { 'Authorization': 'Bearer ' + auth.token }
        });
        if (!resp.ok) {
            console.error('Failed to load online users', resp.status);
            return;
        }
        const ids = await resp.json(); // Set<Long> -> array of numbers
        renderOnlineUsers(ids);
    } catch (e) {
        console.error('Error loading online users', e);
    }
}

function renderOnlineUsers(ids) {
    console.log('online ids:', ids);
    const el = document.getElementById('onlineUsers');
    if (!Array.isArray(ids)) {
        el.textContent = 'Online: ' + JSON.stringify(ids);
        return;
    }
    if (!ids || ids.length === 0) {
        el.textContent = 'No users online';
        return;
    }
    el.textContent = 'Online: ' + ids.join(', ');
}


function connectPrivate() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    const auth = getAuth();
    document.getElementById('currentUser').textContent = auth.username || '';

 stompClient.connect(
    { Authorization: 'Bearer ' + auth.token },
    () => {
        console.log('Connected private');

        if (auth.userId) {
            stompClient.subscribe('/queue/user.' + auth.userId, msg => {
                const body = JSON.parse(msg.body); // MessageDto
                showPrivateMessage(body);
            });
        }
    },
    err => console.error('STOMP error: ', err)
);

}

function showPrivateMessage(msg) {
    const box = document.getElementById('privateMessages');
    const who = msg.senderUsername || ('User ' + msg.senderId);
    const time = new Date(msg.timestamp).toLocaleTimeString(
        navigator.language,
        { hour: 'numeric', minute: '2-digit' }
    );
    const line = `[${time}] ${who}: ${msg.content}\n`;
    box.textContent += line;
}


async function loadPrivateHistory() {
    const peerId = Number(document.getElementById('peerId').value);
    if (!peerId) {
        alert('Enter peer userId');
        return;
    }
    currentPeerId = peerId;
    document.getElementById('currentPeerName').textContent = 'User ' + peerId;

    const box = document.getElementById('privateMessages');
    box.textContent = '';

    const auth = getAuth();
    try {
        const resp = await fetch(`/api/rooms/private/${peerId}/messages`, {
            headers: { 'Authorization': 'Bearer ' + auth.token }
        });
        if (resp.ok) {
            const history = await resp.json(); // List<MessageDto>
            history.forEach(m => showPrivateMessage(m));
        } else {
            console.error('Failed to load private history', resp.status);
        }
    } catch (e) {
        console.error('Error loading private history', e);
    }
}

function sendPrivateMessage() {
    const content = document.getElementById('privateMessageInput').value;
    const auth = getAuth();

    if (!stompClient || !stompClient.connected) {
        alert('Not connected');
        return;
    }
    if (!auth.userId || !currentPeerId) {
        alert('Set peerId first');
        return;
    }

    const chatMessage = {
        roomId: null,
        receiverId: currentPeerId,
        senderId: auth.userId,
        content: content
    };

    stompClient.send('/app/chat.send', {}, JSON.stringify(chatMessage));
    document.getElementById('privateMessageInput').value = '';
}

window.addEventListener('load', () => {
    const auth = getAuth();
    if (!auth.token) {
        window.location.href = '/index.html';
        return;
    }
     connectPrivate();
    loadOnlineUsers();
    setInterval(loadOnlineUsers, 5000);
});
