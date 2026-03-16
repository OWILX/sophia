// assets/js/dashboard.js
import { getSessionValue } from './sessionService.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Device Detection & Body setup
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(navigator.userAgent);
    const body = document.body;

    if (isIOS) {
        body.classList.add('ios');
    } else if (isAndroid) {
        body.classList.add('android');
    }

    // Set CSS variables
    document.documentElement.style.setProperty('--easing-default', isIOS ? 'var(--easing-ios)' : 'var(--easing-android)');
    document.documentElement.style.setProperty('--shadow-default', isIOS ? 'var(--shadow-soft)' : 'var(--shadow-material)');

    // 2. Auth & Data Parsing
    const da = await getSessionValue('user');
    console.log(da);
    if (!da) {
        window.location.href = 'login.html';
        return;
    }

    const parsedData = JSON.parse(userData) || {};
    parsedData.quizzesCompleted = parsedData.quizzesCompleted || 1;
    parsedData.streak = parsedData.streak || 1;
    parsedData.bestSubject = parsedData.bestSubject || 'Anatomy';

    // 3. Content Rendering
    function updateContent(data) {
        const statQuizzes = document.getElementById('stat-quizzes');
        const statStreak = document.getElementById('stat-streak');
        const statBest = document.getElementById('stat-best');

        if (statQuizzes) statQuizzes.querySelector('.stat-value').textContent = data.quizzesCompleted;
        if (statStreak) statStreak.querySelector('.stat-value').textContent = `${data.streak} days`;
        if (statBest) statBest.querySelector('.stat-value').textContent = data.bestSubject;

        document.querySelectorAll('.skeleton').forEach(el => el.remove());
        document.querySelectorAll('.real-content').forEach(el => el.classList.remove('hidden'));
    }

    if (parsedData.quizzesCompleted > 0 || parsedData.streak > 0) {
        updateContent(parsedData);
    } else {
        setTimeout(() => updateContent(parsedData), 1500);
    }

    // 4. Mobile Interactions (Ripple/Glow)
    const touchElements = document.querySelectorAll('.icon-btn, .primary-btn, .nav-item, .more-link');
    if (isAndroid) {
        touchElements.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.touches[0].clientX - rect.left;
                const y = e.touches[0].clientY - rect.top;
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
    } else if (isIOS) {
        touchElements.forEach(btn => {
            btn.addEventListener('touchstart', () => btn.style.backgroundColor = 'var(--gray-100)');
            btn.addEventListener('touchend', () => btn.style.backgroundColor = '');
        });
    }

    // 5. Sidebar Logic (Merged with new icon-swapping function)
    const sidebar = document.querySelector('.bottom-nav');
    const toggleBtn = document.querySelector('.sidebar-toggle');

    if (sidebar && toggleBtn) {
        // Merged Function: Handles DOM changes AND persistence
        function applyCollapsedState(shouldCollapse) {
            sidebar.classList.toggle('collapsed', shouldCollapse);
            body.classList.toggle('sidebar-collapsed', shouldCollapse);
            toggleBtn.setAttribute('aria-expanded', !shouldCollapse);
            
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                if (shouldCollapse) {
                    icon.classList.remove('fa-chevron-left');
                    icon.classList.add('fa-chevron-right');
                } else {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-left');
                }
            }
            
            localStorage.setItem('letstudy_sidebar_collapsed', shouldCollapse.toString());
        }

        // Initial check on load
        const isSavedCollapsed = localStorage.getItem('letstudy_sidebar_collapsed') === 'true';
        if (window.innerWidth >= 768) {
            applyCollapsedState(isSavedCollapsed);
        }

        // Click handler
        toggleBtn.addEventListener('click', () => {
            const currentlyCollapsed = sidebar.classList.contains('collapsed');
            applyCollapsedState(!currentlyCollapsed);
            
            if (navigator.vibrate && isAndroid) {
                navigator.vibrate(15);
            }
        });

        // Handle window resize
        let wasDesktop = window.innerWidth >= 768;
        window.addEventListener('resize', () => {
            const isDesktopNow = window.innerWidth >= 768;
            if (isDesktopNow !== wasDesktop) {
                if (isDesktopNow) {
                    const saved = localStorage.getItem('letstudy_sidebar_collapsed') === 'true';
                    applyCollapsedState(saved);
                    toggleBtn.style.display = 'flex';
                } else {
                    // Mobile: force expanded and hide button
                    applyCollapsedState(false);
                    toggleBtn.style.display = 'none';
                }
                wasDesktop = isDesktopNow;
            }
        });
    }
});
