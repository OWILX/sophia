// assets/js/leaderboard.js (new file)

document.addEventListener('DOMContentLoaded', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const body = document.body;

    if (isIOS) body.classList.add('ios');
    if (isAndroid) body.classList.add('android');

    document.documentElement.style.setProperty('--easing-default', isIOS ? 'var(--easing-ios)' : 'var(--easing-android)');
    document.documentElement.style.setProperty('--shadow-default', isIOS ? 'var(--shadow-soft)' : 'var(--shadow-material)');

    // Mock data (MVP - could fetch from backend later)
    const mockUsers = Array.from({length: 20}, (_, i) => ({
        name: `User ${i+1}`,
        points: Math.floor(Math.random() * 1000) + 500,
        coursePoints: {
            math: Math.floor(Math.random() * 500) + 200,
            science: Math.floor(Math.random() * 500) + 200,
            history: Math.floor(Math.random() * 500) + 200,
            literature: Math.floor(Math.random() * 500) + 200
        }
    }));

    // Adjust for periods (mock - same data for all)
    function getLeaderboardData(criteria, period, course = null) {
        let data = [...mockUsers];
        if (criteria === 'points') {
            data.sort((a, b) => b.points - a.points);
        } else if (criteria === 'course-points' && course) {
            data.sort((a, b) => b.coursePoints[course] - a.coursePoints[course]);
        }
        return data.slice(0, 20);
    }

    const criteriaSelect = document.getElementById('criteria-select');
    const periodSelect = document.getElementById('period-select');
    const courseWrapper = document.getElementById('course-select-wrapper');
    const courseSelect = document.getElementById('course-select');
    const list = document.querySelector('.leaderboard-list');

    function updateLeaderboard() {
        const criteria = criteriaSelect.value;
        const period = periodSelect.value;
        const course = courseSelect.value;
        courseWrapper.classList.toggle('hidden', criteria !== 'course-points');

        // Simulate load
        list.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const skel = document.createElement('li');
            skel.classList.add('leaderboard-item', 'skeleton');
            list.appendChild(skel);
        }

        setTimeout(() => {
            list.innerHTML = '';
            const data = getLeaderboardData(criteria, period, criteria === 'course-points' ? course : null);
            data.forEach((user, i) => {
                const li = document.createElement('li');
                li.classList.add('leaderboard-item');
                li.innerHTML = `
                    <span class="leaderboard-rank">#${i+1}</span>
                    <span class="leaderboard-user">${user.name}</span>
                    <span class="leaderboard-score">${criteria === 'points' ? user.points : user.coursePoints[course]} pts</span>
                `;
                list.appendChild(li);
            });
        }, 1000); // Mock delay
    }

    criteriaSelect.addEventListener('change', updateLeaderboard);
    periodSelect.addEventListener('change', updateLeaderboard);
    courseSelect.addEventListener('change', updateLeaderboard);

    // Initial load
    updateLeaderboard();

    // Competitions (static mock)
    setTimeout(() => {
        document.querySelectorAll('.competitions-section .skeleton').forEach(el => el.remove());
        document.querySelectorAll('.competitions-section .real-content').forEach(el => el.classList.remove('hidden'));
    }, 1500);

    // Platform interactions
    const interactiveEls = document.querySelectorAll('select, .more-link, .competition-link');
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