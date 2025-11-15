const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const body = document.body;

function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    if (theme === 'dark') {
        themeIcon.className = 'fa-solid fa-sun'; 
    } else {
        themeIcon.className = 'fa-solid fa-moon';
    }
}
let currentTheme = localStorage.getItem('theme') || 'dark';
applyTheme(currentTheme);
themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
});