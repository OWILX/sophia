document.addEventListener('DOMContentLoaded', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const body = document.body;

    if (isIOS) body.classList.add('ios');
    if (isAndroid) body.classList.add('android');

    document.documentElement.style.setProperty('--easing-default', isIOS ? 'var(--easing-ios)' : 'var(--easing-android)');

    // Load saved preferences (MVP – localStorage only)
    const settings = JSON.parse(localStorage.getItem('letstudy_settings')) || {
        darkMode: false,
        notifications: true,
        sounds: true
    };

    // Apply initial states
    document.getElementById('dark-mode-toggle').checked = settings.darkMode;
    document.getElementById('notifications-toggle').checked = settings.notifications;
    document.getElementById('sounds-toggle').checked = settings.sounds;

    // Save changes
    function saveSettings() {
        localStorage.setItem('letstudy_settings', JSON.stringify(settings));
    }

    document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
        settings.darkMode = e.target.checked;
        // In real app: document.documentElement.classList.toggle('dark', settings.darkMode);
        saveSettings();
    });

    document.getElementById('notifications-toggle').addEventListener('change', (e) => {
        settings.notifications = e.target.checked;
        saveSettings();
    });

    document.getElementById('sounds-toggle').addEventListener('change', (e) => {
        settings.sounds = e.target.checked;
        saveSettings();
    });

    // Sign out (MVP)
    document.getElementById('sign-out').addEventListener('click', () => {
        if (confirm('Sign out of LetStudy???')) {
            localStorage.removeItem('letstudy_user');
            localStorage.removeItem('letstudy_settings');
            //window.location.href = 'slogin.html';
        }
    });

    // Delete account (placeholder – dangerous action)
    document.getElementById('delete-account').addEventListener('click', () => {
        if (confirm('This will permanently delete your account and all progress. Continue?')) {
            alert('Account deletion requested. (This is a placeholder action in MVP)');
            // In real app: call backend API + clear all local data
        }
    });

    // Platform-adaptive interactions (ripple / highlight)
    const interactiveEls = document.querySelectorAll('.settings-item, .danger-btn, .back-btn');
    if (isAndroid) {
        interactiveEls.forEach(el => {
            el.addEventListener('touchstart', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.touches[0].clientX - rect.left;
                const y = e.touches[0].clientY - rect.top;
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                el.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
    } else if (isIOS) {
        interactiveEls.forEach(el => {
            el.addEventListener('touchstart', () => el.style.backgroundColor = 'var(--gray-100)');
            el.addEventListener('touchend', () => el.style.backgroundColor = '');
        });
    }
});