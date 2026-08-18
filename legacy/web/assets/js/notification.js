// assets/js/notifications.js (new file)

document.addEventListener('DOMContentLoaded', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const body = document.body;

    if (isIOS) {
        body.classList.add('ios');
    } else if (isAndroid) {
        body.classList.add('android');
    }

    document.documentElement.style.setProperty('--easing-default', isIOS ? 'var(--easing-ios)' : 'var(--easing-android)');
    document.documentElement.style.setProperty('--shadow-default', isIOS ? 'var(--shadow-soft)' : 'var(--shadow-material)');

    // Mock notifications from localStorage
    let notifications = JSON.parse(localStorage.getItem('letstudy_notifications')) || [
        { id: 1, icon: 'fa-info-circle', desc: 'New quiz available in Mathematics!', read: false },
        { id: 2, icon: 'fa-trophy', desc: 'You achieved a new high score in Science.', read: false },
        { id: 3, icon: 'fa-calendar-check', desc: 'Your streak is now 5 days! Keep going!', read: false }
    ];

    // Simulate load
    setTimeout(() => {
        document.querySelectorAll('.skeleton').forEach(el => el.remove());
        const list = document.querySelector('.notifications-list');
        list.innerHTML = ''; // Clear skeletons
        notifications.forEach(notif => {
            const li = document.createElement('li');
            li.classList.add('notification-item', 'real-content');
            li.dataset.id = notif.id;
            li.innerHTML = `
                <i class="fas ${notif.icon} notification-icon"></i>
                <div class="notification-content">
                    <p class="notification-desc">${notif.desc}</p>
                </div>
                <button class="close-btn" aria-label="Dismiss notification">
                    <i class="fas fa-times"></i>
                </button>
            `;
            list.appendChild(li);
        });
        document.querySelectorAll('.real-content').forEach(el => el.classList.remove('hidden'));
        initSwipeAndClose();
    }, 1500);

    // Mark all as read
    document.getElementById('mark-all-read').addEventListener('click', () => {
        notifications = notifications.map(n => ({ ...n, read: true }));
        localStorage.setItem('letstudy_notifications', JSON.stringify(notifications));
        // Could add visual update, but for MVP, just log
        console.log('All marked as read');
    });

    // Function to init swipe and close
    function initSwipeAndClose() {
        document.querySelectorAll('.notification-item').forEach(item => {
            const closeBtn = item.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => removeNotification(item));

            // Swipe
            let startX = 0;
            let currentX = 0;
            let translating = false;

            item.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                translating = true;
            });

            item.addEventListener('touchmove', (e) => {
                if (translating) {
                    currentX = e.touches[0].clientX - startX;
                    if (Math.abs(currentX) > 50) { // Threshold for swipe
                        item.style.transform = `translateX(${currentX}px)`;
                    }
                }
            });

            item.addEventListener('touchend', () => {
                translating = false;
                if (Math.abs(currentX) > item.offsetWidth / 2) {
                    removeNotification(item);
                } else {
                    item.style.transform = 'translateX(0)';
                }
                currentX = 0;
            });
        });
    }

    function removeNotification(item) {
        const id = parseInt(item.dataset.id);
        notifications = notifications.filter(n => n.id !== id);
        localStorage.setItem('letstudy_notifications', JSON.stringify(notifications));
        item.style.transform = 'translateX(-100%)';
        setTimeout(() => item.remove(), 300);
    }

    // Ripple/highlight (similar to dashboard)
    if (isAndroid) {
        document.querySelectorAll('.close-btn, .secondary-btn').forEach(btn => {
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
        document.querySelectorAll('.close-btn, .secondary-btn').forEach(btn => {
            btn.addEventListener('touchstart', () => {
                btn.style.backgroundColor = 'var(--gray-100)';
            });
            btn.addEventListener('touchend', () => {
                btn.style.backgroundColor = '';
            });
        });
    }
});