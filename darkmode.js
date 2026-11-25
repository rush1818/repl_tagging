document.addEventListener("DOMContentLoaded", () => {
  initTheme();
});

window.addEventListener("storageSyncReady", () => {
  const savedTheme = localStorage.getItem('app-theme') || 'system';
  applyTheme(savedTheme, false);
});

function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeDropdown = document.getElementById('theme-dropdown');

  // Load initial theme (run this even if controls are missing)
  const savedTheme = localStorage.getItem('app-theme') || 'system';
  applyTheme(savedTheme, false);

  if (!themeToggleBtn || !themeDropdown) return;

  const themeButtons = themeDropdown.querySelectorAll('button');

  // Toggle dropdown
  themeToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!themeDropdown.contains(e.target) && e.target !== themeToggleBtn) {
      themeDropdown.classList.remove('show');
    }
  });

  // Handle theme selection
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      setTheme(theme);
      themeDropdown.classList.remove('show');
    });
  });
}

function applyTheme(theme, persist = true) {
  const htmlEl = document.documentElement;

  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    htmlEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    htmlEl.setAttribute('data-theme', theme);
  }

  if (persist) {
    localStorage.setItem('app-theme', theme);
    if (typeof window.syncStorageSet === 'function') {
      window.syncStorageSet('app-theme', theme);
    }
  }

  // Update button text to show current theme
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.innerText = `Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
  }
}

function setTheme(theme) {
  applyTheme(theme, true);
}

// Listen for system preference changes if on 'system' theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (localStorage.getItem('app-theme') === 'system') {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});
