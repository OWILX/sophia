// assets/js/quiz.js
import { client } from './supabase.js';
import { getAllCourses } from './api/courses.js';
import { getAllTopics } from './api/topics.js';
const LOGIN_URL = "https://owilx.github.io/sophia/app/web/login.html";

async function init() {
      const { data: { session }, error } = await client.auth.getSession();
      if (error || !session) {
        // No valid session, kick the user back out
        console.warn("No active session. Redirecting to login...");
        window.location.replace(LOGIN_URL);
        return;
      }
    }

    // ────────────────────────────────────────────────
    //  AUTH STATE LISTENER (Security Guard)
    // ────────────────────────────────────────────────
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.replace(LOGIN_URL);
      }
    });

    // Run the check immediately when the script loads
    init();
document.addEventListener('DOMContentLoaded', () => {
    /* --------------------------------------------------
       Platform detection & theming
    -------------------------------------------------- */
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const body = document.body;

    if (isIOS) body.classList.add('ios');
    if (isAndroid) body.classList.add('android');

    document.documentElement.style.setProperty(
        '--easing-default',
        isIOS ? 'var(--easing-ios)' : 'var(--easing-android)'
    );
    document.documentElement.style.setProperty(
        '--shadow-default',
        isIOS ? 'var(--shadow-soft)' : 'var(--shadow-material)'
    );

    // State
    let selections = {
        type: null,        // "mcq" | "tf" | "mcq_tf" | "cloze"
        course: null,
        topic: null,
        subtopic: null,
        modules: [],       // array of strings
        length: null       // 10 | 20 | 30 | 40
    };

    // DOM Elements - Fixed to match quiz.html IDs
    const breadcrumbs = document.getElementById('breadcrumbs');
    const steps = {
        type: document.getElementById('step-quiz-type'),
        course: document.getElementById('step-course'),
        topic: document.getElementById('step-topic'),
        subtopic: document.getElementById('step-subtopic'),
        modules: document.getElementById('step-modules'),
        length: document.getElementById('step-slider') // Fixed ID
    };

    // ─── Breadcrumbs ───────────────────────────────────────
    function updateBreadcrumbs() {
        let parts = [];
        if (selections.type) parts.push(selections.type.toUpperCase());
        if (selections.course) parts.push(selections.course);
        if (selections.topic) parts.push(selections.topic);
        if (selections.subtopic) parts.push(selections.subtopic);
        if (selections.modules.length > 0) parts.push(`${selections.modules.length} modules`);

        let html = '';
        if (parts.length > 0) {
            html = '<span>Quiz Setup: </span>';
            parts.forEach((p, i) => {
                if (i > 0) html += '<span class="separator">›</span>';
                html += `<span>${p}</span>`;
            });
            breadcrumbs.classList.remove('hidden');
        } else {
            breadcrumbs.classList.add('hidden');
        }
        breadcrumbs.innerHTML = html;
    }

    // ─── Navigation Logic ─────────────────────────
    function showStep(stepName) {
        Object.values(steps).forEach(s => {
            if (s) s.classList.add('hidden');
        });
        if (steps[stepName]) {
            steps[stepName].classList.remove('hidden');
        }
        updateBreadcrumbs();
    }

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            showStep(target);
        });
    });

    // ─── Step 1: Type Selection ───────────────────────────
    const typeCards = steps.type.querySelectorAll('.selection-card');
    const nextToCoursesBtn = document.getElementById('next-to-courses');

    typeCards.forEach(card => {
        card.addEventListener('click', () => {
            typeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selections.type = card.dataset.value;
            nextToCoursesBtn.disabled = false;
            updateBreadcrumbs();
        });
    });

    nextToCoursesBtn.addEventListener('click', () => {
        showStep('course');
        loadCourses();
    });

    // ─── Data Loading Functions ───────────────────────────
    async function loadCourses() {
  const container = steps.course.querySelector('.selection-cards');
  container.innerHTML = '<p>Loading courses...</p>';

  try {
    const courses = await getAllCourses();

    if (courses.length === 0) {
      container.innerHTML = '<p style="color:red">No courses found.</p>';
      return;
    }

    container.innerHTML = '';

    courses.forEach(course => {
      const card = createCard(course.name, 'fa-book');
      card.addEventListener('click', () => {
        handleSingleSelect(steps.course, 'course', course.name, 'next-to-topic');
        // Tip: later you can easily switch to course.id here if you want stable IDs
      });
      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="color:red">Error loading courses</p>';
  }
}

    async function loadTopics() {
  const container = steps.course.querySelector('.selection-cards');
  container.innerHTML = '<p>Loading topics...</p>';

  try {
    const topics = await getAllTopics();

    if (topics.length === 0) {
      container.innerHTML = '<p style="color:red">No topics found.</p>';
      return;
    }

    container.innerHTML = '';

    topics.forEach(topic => {
      const card = createCard(topic.name, 'fa-book');
      card.addEventListener('click', () => {
        handleSingleSelect(steps.course, 'topic', topic.name, 'next-to-subtopic');
        // Tip: later you can easily switch to course.id here if you want stable IDs
      });
      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="color:red">Error loading topics</p>';
  }
}

    async function loadSubtopics() {
        const container = steps.subtopic.querySelector('.selection-cards');
        container.innerHTML = '<p>Loading subtopics...</p>';
        try {
            const params = new URLSearchParams({ course: selections.course, topic: selections.topic });
            const res = await fetch(`/api/subtopics.php?${params.toString()}`);
            const data = await res.json();
            container.innerHTML = '';
            data.forEach(name => {
                const card = createCard(name, 'fa-file');
                card.addEventListener('click', () => {
                    handleSingleSelect(steps.subtopic, 'subtopic', name, 'next-to-modules');
                });
                container.appendChild(card);
            });
        } catch {
            container.innerHTML = '<p>Error loading subtopics.</p>';
        }
    }

    async function loadModules() {
    const container = steps.modules.querySelector('.selection-cards');
    container.innerHTML = '<p>Loading modules...</p>';
    try {
        const params = new URLSearchParams({
            course: selections.course,
            topic: selections.topic,
            subtopic: selections.subtopic
        });
        const res = await fetch(`/api/modules.php?${params.toString()}`);
        const data = await res.json();
        container.innerHTML = '';
        data.forEach(module => {
            const card = createCard(module.name, 'fa-puzzle-piece');
            card.addEventListener('click', () => {
                const idx = selections.modules.indexOf(module.id);
                if (idx > -1) {
                    selections.modules.splice(idx, 1);
                    card.classList.remove('selected');
                } else {
                    selections.modules.push(module.id); // store ID
                    card.classList.add('selected');
                }
                document.getElementById('next-to-length').disabled =
                    selections.modules.length === 0;
                updateBreadcrumbs();
            });
            container.appendChild(card);
        });
    } catch {
        container.innerHTML = '<p>Error loading modules.</p>';
    }
}

    // Helper to create cards dynamically
    function createCard(name, icon) {
        const card = document.createElement('div');
        card.className = 'selection-card';
        card.dataset.value = name;
        card.innerHTML = `<i class="fas ${icon} card-icon"></i><span>${name}</span>`;
        return card;
    }

    function handleSingleSelect(stepEl, key, value, nextBtnId) {
        stepEl.querySelectorAll('.selection-card').forEach(c => c.classList.remove('selected'));
        const selectedCard = stepEl.querySelector(`[data-value="${value}"]`);
        if (selectedCard) selectedCard.classList.add('selected');
        selections[key] = value;
        document.getElementById(nextBtnId).disabled = false;
        updateBreadcrumbs();
    }

    // ─── Button Listeners for Navigation ───
    document.getElementById('next-to-topic').addEventListener('click', () => { showStep('topic'); loadTopics(); });
    document.getElementById('next-to-subtopic').addEventListener('click', () => { showStep('subtopic'); loadSubtopics(); });
    document.getElementById('next-to-modules').addEventListener('click', () => { showStep('modules'); loadModules(); });
    document.getElementById('next-to-length').addEventListener('click', () => showStep('length'));

    // ─── Step 6: Length Selection ───────────────────────────
    steps.length.querySelectorAll('.length-card').forEach(card => {
        card.addEventListener('click', () => {
            steps.length.querySelectorAll('.length-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selections.length = card.dataset.value;
            document.getElementById('start-quiz-btn').disabled = false;
            updateBreadcrumbs();
        });
    });

    // ─── Final Submission ──────────────────────────────────────────
    document.getElementById('start-quiz-btn').addEventListener('click', () => {
    const data = {
        type: selections.type,
        course: selections.course,
        topic: selections.topic,
        subtopic: selections.subtopic,
        modules: selections.modules,
        num: selections.length
    };

    // Send the POST request in the background
    fetch('/api/create_quiz.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // Tell PHP we are sending JSON
        },
        body: JSON.stringify(data)
    })
    .then(async response => {
    const result = await response.json();

    if (response.ok && result.ok) {
        window.location.href = '/app/quiz.php';
    } else {
        console.error(result.error);
    }
})
    .catch(error => {
        console.error('Error:', error);
    });
});


    // ─── Touch Interactions ───────────────────────────────────────
    const btns = document.querySelectorAll(
        '.primary-btn, .secondary-btn, .selection-card, .answer-label'
    );

    if (isAndroid) {
        btns.forEach(btn => btn.addEventListener('touchstart', createRipple));
    } else if (isIOS) {
        btns.forEach(btn => {
            btn.addEventListener(
                'touchstart',
                () => (btn.style.backgroundColor = 'var(--gray-100)')
            );
            btn.addEventListener('touchend', () => (btn.style.backgroundColor = ''));
        });
    }

    function createRipple(e) {
        const rect = this.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        if (navigator.vibrate) navigator.vibrate(10);
    }

    // Initialize – show the first step
    showStep('type');
});
