export const state = {
    currentUser: null,
    currentLang: localStorage.getItem('lang') || 'en',
    translations: {}
};

export function t(key) {
    return state.translations[key] || key;
}

export function showError(msg) {
    const element = document.getElementById('msg');

    if(element) { element.innerText = msg; element.style.display = 'block'; }

    else alert(msg);
}

export async function fetchApi(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        state.currentUser = null;
        if(window.navigateTo) window.navigateTo('/login');
        throw new Error("Unauthorized");
    }
    return res;
}

export async function loadTranslations(lang) {
    try {
        const res = await fetch(`/api/locales/${lang}`);
        state.translations = await res.json();
        state.currentLang = lang;
        localStorage.setItem('lang', lang);
    } catch (e) {
        console.error("Failed to load translations", e);
    }
}

export async function checkSession() {
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            if (data.isAuthenticated) state.currentUser = data.user;
        }
    } catch (e) {
        state.currentUser = null;
    }
}