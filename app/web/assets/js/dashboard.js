// assets/js/dashboard.js
import { client } from './supabase.js';
const LOGIN_URL = "https://owilx.github.io/sophia/app/web/login.html";

// ────────────────────────────────────────────────────────────────
//  AUTH GUARD – redirect immediately if no session exists
// ────────────────────────────────────────────────────────────────
async function enforceAuth() {
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) {
    window.location.replace(LOGIN_URL);
    return false;
  }
  return true;
}

// Auth state listener – keep the door locked
client.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    window.location.replace(LOGIN_URL);
  }
});

// Kick off auth check
enforceAuth().then(isAuthed => {
  if (!isAuthed) return;
  // Continue with dashboard setup only after auth is confirmed
  document.addEventListener('DOMContentLoaded', initDashboardUI);
});

// ────────────────────────────────────────────────────────────────
//  DASHBOARD UI INITIALIZATION (runs after DOM ready)
// ────────────────────────────────────────────────────────────────
async function initDashboardUI() {
  // Device detection & body classes
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);
  const body = document.body;

  if (isIOS) {
    body.classList.add('ios');
  } else if (isAndroid) {
    body.classList.add('android');
  }

  // Load dashboard data
  await loadDashboardData();

  // Setup mobile interactions
  setupMobileInteractions(isIOS, isAndroid);

  // Setup sidebar toggle
  setupSidebar(isAndroid);
}

// ────────────────────────────────────────────────────────────────
//  DATA LOADING & RENDERING
// ────────────────────────────────────────────────────────────────
async function loadDashboardData() {
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    window.location.replace(LOGIN_URL);
    return;
  }

  const { data, error } = await client.rpc('get_dashboard_data');

  if (error) {
    console.error('Dashboard load failed:', error.message);
    showError('Failed to load dashboard. Please refresh.');
    return;
  }

  renderStats(data);
  renderCourses(data.module_progress);
  renderActivity(data.recent_activity);
}

function renderStats(data) {
  setValue('stat-quizzes', 'stat-value', data.total_quizzes ?? 0);
  setValue('stat-streak',  'stat-value', `${data.streak ?? 0} day${data.streak === 1 ? '' : 's'}`);
  setValue('stat-best',    'stat-value', data.best_module ?? '—');

  swapSkeleton('stats-grid');
}

function renderCourses(modules) {
  const container = document.querySelector('.courses-container');
  if (!container) return;

  container.querySelectorAll('.skeleton').forEach(el => el.remove());

  if (!modules || modules.length === 0) {
    container.innerHTML = '<p class="empty-state">No modules started yet.</p>';
    return;
  }

  modules.forEach(mod => {
    const pct = mod.total > 0 ? Math.round((mod.seen / mod.total) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <h3 class="course-title">${escapeHtml(mod.name)}</h3>
      <p class="course-progress">Progress: ${pct}%</p>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <p class="course-sub">${mod.seen} / ${mod.total} questions seen</p>
    `;
    container.appendChild(card);
  });
}

function renderActivity(quizzes) {
  const list = document.querySelector('.activity-list');
  if (!list) return;

  list.querySelectorAll('.skeleton').forEach(el => el.remove());

  if (!quizzes || quizzes.length === 0) {
    list.innerHTML = '<li class="activity-item empty-state">No quizzes taken yet.</li>';
    return;
  }

  quizzes.forEach(q => {
    const li = document.createElement('li');
    li.className = 'activity-item';

    const typeLabel = formatQuizType(q.quiz_type);
    const when = formatRelativeTime(q.created_at);

    li.innerHTML = `
      <span class="activity-icon"><i class="fas fa-clipboard-check"></i></span>
      <span class="activity-text">
        <strong>${typeLabel}</strong> — ${q.total_questions} questions
      </span>
      <span class="activity-time">${when}</span>
    `;
    list.appendChild(li);
  });
}

// ────────────────────────────────────────────────────────────────
//  UI HELPERS
// ────────────────────────────────────────────────────────────────
function setValue(cardId, valueClass, text) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const valueEl = card.querySelector(`.${valueClass}`);
  if (valueEl) valueEl.textContent = text;
  card.classList.remove('hidden');
}

function swapSkeleton(containerClass) {
  const container = document.querySelector(`.${containerClass}`);
  if (!container) return;
  container.querySelectorAll('.skeleton').forEach(el => el.remove());
  container.querySelectorAll('.real-content').forEach(el => el.classList.remove('hidden'));
}

function formatQuizType(type) {
  const map = { mcq: 'MCQ Quiz', tf: 'True / False Quiz', mcq_tf: 'Mixed Quiz' };
  return map[type] ?? 'Quiz';
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function showError(msg) {
  const main = document.querySelector('.dashboard-main');
  if (!main) return;
  const el = document.createElement('p');
  el.style.cssText = 'color:#ef4444; padding:1rem; font-weight:600;';
  el.textContent = msg;
  main.prepend(el);
}

// ────────────────────────────────────────────────────────────────
//  MOBILE INTERACTIONS
// ────────────────────────────────────────────────────────────────
function setupMobileInteractions(isIOS, isAndroid) {
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
}

// ────────────────────────────────────────────────────────────────
//  SIDEBAR TOGGLE
// ────────────────────────────────────────────────────────────────
function setupSidebar(isAndroid) {
  const sidebar = document.querySelector('.bottom-nav');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  const body = document.body;

  if (!sidebar || !toggleBtn) return;

  function applyCollapsedState(shouldCollapse) {
    sidebar.classList.toggle('collapsed', shouldCollapse);
    body.classList.toggle('sidebar-collapsed', shouldCollapse);
    toggleBtn.setAttribute('aria-expanded', !shouldCollapse);

    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-chevron-left', !shouldCollapse);
      icon.classList.toggle('fa-chevron-right', shouldCollapse);
    }

    localStorage.setItem('letstudy_sidebar_collapsed', shouldCollapse.toString());
  }

  const isSavedCollapsed = localStorage.getItem('letstudy_sidebar_collapsed') === 'true';
  if (window.innerWidth >= 768) {
    applyCollapsedState(isSavedCollapsed);
  }

  toggleBtn.addEventListener('click', () => {
    const currentlyCollapsed = sidebar.classList.contains('collapsed');
    applyCollapsedState(!currentlyCollapsed);
    if (isAndroid && navigator.vibrate) navigator.vibrate(15);
  });

  let wasDesktop = window.innerWidth >= 768;
  window.addEventListener('resize', () => {
    const isDesktopNow = window.innerWidth >= 768;
    if (isDesktopNow !== wasDesktop) {
      if (isDesktopNow) {
        const saved = localStorage.getItem('letstudy_sidebar_collapsed') === 'true';
        applyCollapsedState(saved);
        toggleBtn.style.display = 'flex';
      } else {
        applyCollapsedState(false);
        toggleBtn.style.display = 'none';
      }
      wasDesktop = isDesktopNow;
    }
  });
}