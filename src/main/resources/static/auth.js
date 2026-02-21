function saveAuth(userId, username, token) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    localStorage.setItem('token', token);
}

function clearAuth() {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('token');
}

function logout() {
    clearAuth();
    window.location.href = '/index.html';
}

function getAuth() {
    return {
        userId: Number(localStorage.getItem('userId')),
        username: localStorage.getItem('username'),
        token: localStorage.getItem('token')
    };
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    const resEl = document.getElementById('regResult');
    resEl.textContent = 'Registering...';

    try {
        const resp = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, email, password })
        });

        if (!resp.ok) {
            resEl.textContent = 'Registration failed: ' + resp.status;
            return;
        }

        resEl.textContent = 'Registered successfully. Please login.';
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').value = '';
        document.getElementById('regPassword').value = '';
        if (typeof showLogin === 'function') {
            showLogin();
        }
    } catch (e) {
        resEl.textContent = 'Error: ' + e.message;
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const resEl = document.getElementById('loginResult');
    resEl.textContent = 'Logging in...';

    try {
        const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password })
        });

        if (!resp.ok) {
            resEl.textContent = 'Login failed: ' + resp.status;
            return;
        }

        const data = await resp.json();
        saveAuth(data.userId, data.username, data.token);

        resEl.textContent = 'Login successful. Redirecting...';
        window.location.href = '/chat.html';
    } catch (e) {
        resEl.textContent = 'Error: ' + e.message;
    }
}
