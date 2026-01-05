import { t, fetchApi, state, showError } from './utils.js';

export function renderLogin() {
    document.getElementById('app').innerHTML = `
        <h2>${t('login_title')}</h2>
        <div id="msg" class="alert error" style="display:none"></div>
        <form class="form-card" onsubmit="handleLogin(event)">
            <div class="form-group"><label>${t('label_username')}</label><input type="text" id="username" required></div>
            <div class="form-group"><label>${t('label_password')}</label><input type="password" id="password" required></div>
            <button type="submit" class="btn">${t('login_btn')}</button>
            <p><a href="#" onclick="navigateTo('/register'); return false;">${t('register_link')}</a></p>
        </form>
    `;
}

export function renderRegister() {
    document.getElementById('app').innerHTML = `
        <h2>${t('register_title')}</h2>
        <div id="msg" class="alert error" style="display:none"></div>
        <form class="form-card" onsubmit="handleRegister(event)">
            <div class="form-group"><label>${t('label_username')}</label><input type="text" id="reg-user" required></div>
            <div class="form-group"><label>${t('label_password')}</label><input type="password" id="reg-pass" required><small>${t('password_hint')}</small></div>
            <h3 style="font-size: 1rem; margin-bottom: 15px; color: #555;">${t('student_profile_details')}</h3>
            <div class="form-group"><label>${t('label_firstname')}</label><input type="text" id="reg-fn" required></div>
            <div class="form-group"><label>${t('label_lastname')}</label><input type="text" id="reg-ln" required></div>
            <div class="form-group"><label>${t('label_email')}</label><input type="email" id="reg-email" required></div>
            <div class="form-group"><label>${t('label_phone')}</label><input type="text" id="reg-phone"></div>
            <button type="submit" class="btn">${t('register_btn')}</button>
        </form>
    `;
}

// Handlers attached to window
window.handleLogin = async function(e) {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const res = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username: u, password: p }) });
    const data = await res.json();
    if(res.ok) { state.currentUser = data.user; window.navigateTo('/'); }
    else { showError(t(data.error) || "Login failed"); }
};

window.handleRegister = async function(e) {
    e.preventDefault();
    const body = {
        username: document.getElementById('reg-user').value,
        password: document.getElementById('reg-pass').value,
        first_name: document.getElementById('reg-fn').value,
        last_name: document.getElementById('reg-ln').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value
    };
    const res = await fetch('/api/auth/register', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
    if(res.ok) window.navigateTo('/login');
    else { const data = await res.json(); showError(t(data.error) || data.error); }
};