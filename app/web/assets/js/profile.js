// assets/js/profile.js (new file)

document.addEventListener('DOMContentLoaded', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const body = document.body;

    if (isIOS) body.classList.add('ios');
    if (isAndroid) body.classList.add('android');

    document.documentElement.style.setProperty('--easing-default', isIOS ? 'var(--easing-ios)' : 'var(--easing-android)');
    document.documentElement.style.setProperty('--shadow-default', isIOS ? 'var(--shadow-soft)' : 'var(--shadow-material)');

    // Mock/personalized data from localStorage
    const userData = JSON.parse(localStorage.getItem('letstudy_user')) || {
        name: 'User',
        quizzesCompleted: 0,
        streak: 0,
        bestSubject: 'None yet',
        courseProgress: { // % progress
            Mathematics: 45,
            Science: 60,
            History: 30,
            Literature: 75
        },
        subjectPerformance: { // Mock scores for pie
            Mathematics: 85,
            Science: 92,
            History: 78,
            Literature: 88
        }
    };

    // Personalize greeting
    document.getElementById('user-name').textContent = userData.name;

    // Simulate loading
    setTimeout(() => {
        // Stats
        document.getElementById('stat-quizzes').querySelector('.stat-value').textContent = userData.quizzesCompleted;
        document.getElementById('stat-streak').querySelector('.stat-value').textContent = `${userData.streak} days`;
        document.getElementById('stat-best').querySelector('.stat-value').textContent = userData.bestSubject;

        // Remove skeletons
        document.querySelectorAll('.skeleton').forEach(el => el.remove());
        document.querySelectorAll('.real-content').forEach(el => el.classList.remove('hidden'));

        // Bar Chart: Progress by Course
        const barCtx = document.getElementById('bar-chart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(userData.courseProgress),
                datasets: [{
                    label: 'Progress %',
                    data: Object.values(userData.courseProgress),
                    backgroundColor: 'rgba(45, 212, 191, 0.7)', // Teal
                    borderColor: 'rgba(45, 212, 191, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, max: 100 }
                },
                responsive: true,
                animation: { duration: 1000, easing: 'easeOutBounce' },
                plugins: { legend: { display: false } }
            }
        });

        // Pie Chart: Subject Performance Distribution
        const pieCtx = document.getElementById('pie-chart').getContext('2d');
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(userData.subjectPerformance),
                datasets: [{
                    data: Object.values(userData.subjectPerformance),
                    backgroundColor: [
                        'rgba(45, 212, 191, 0.8)', // Teal
                        'rgba(250, 204, 21, 0.8)', // Yellow
                        'rgba(45, 212, 191, 0.6)',
                        'rgba(250, 204, 21, 0.6)'
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                animation: { duration: 1000, easing: 'easeInOutQuad' },
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` } }
                }
            }
        });
    }, 1500); // Mock load delay

    // Ripple/highlight for interactive elements
    if (isAndroid) {
        document.querySelectorAll('.stat-card, .activity-item').forEach(el => {
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
        document.querySelectorAll('.stat-card, .activity-item').forEach(el => {
            el.addEventListener('touchstart', () => el.style.backgroundColor = 'var(--gray-100)');
            el.addEventListener('touchend', () => el.style.backgroundColor = '');
        });
    }
});