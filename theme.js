// Theme handling logic

const THEME_KEY = 'cgpa_theme_preference';

function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleIcon(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
}

function updateToggleIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    // Simple text/icon swap
    if (theme === 'dark') {
        btn.innerHTML = '☀️'; // Sun icon for switching to Light
        btn.setAttribute('title', 'Switch to Light Mode');
    } else {
        btn.innerHTML = '🌙'; // Moon icon for switching to Dark
        btn.setAttribute('title', 'Switch to Dark Mode');
    }
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    const theme = getPreferredTheme();
    applyTheme(theme);

    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.addEventListener('click', toggleTheme);
    }
});
