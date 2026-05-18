import { client } from './supabase.js';

  // Global state
  let currentCriteria = 'points';
  let currentLimit = 20;
  let currentCourse = 'math';
  let abortController = null;
  
  
  // DOM elements
const leaderboardList = document.getElementById("leaderboard-list");
const criteriaSelect = document.getElementById("criteria-select");
const limitSelect = document.getElementById("limit-select");
const courseWrapper = document.getElementById("course-select-wrapper");
const courseSelect = document.getElementById("course-select");

  // ---------- 1. REAL SUPABASE: Overall Mastery Score (avg mastery_score from users_questions_progress) ----------
  async function fetchOverallLeaderboard(limit = 20) {
      
      try {
    const { data, error } = await client.rpc("get_leaderboard", { limit_val: limit });
    if (error) throw error;
    if (!data || data.length === 0) return generateMockOverallLeaderboard(limit);

    // Map returned columns to our frontend format
    return data.map(row => ({
      rank: row.rank,
      name: row.user_name,
      points: row.total_mastery,
      userId: row.user_id,
    }));
  } catch (err) {
    console.error("RPC error:", err);
    return generateMockOverallLeaderboard(limit);
  }
  }

// ---------- 2. PER‑COURSE LEADERBOARD (DUMMY – replace later) ----------
async function fetchDummyCourseLeaderboard(course, limit) {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (client) {
    try {
      const { data } = await client.from("users").select("id, name").limit(200);
      if (data) userList.push(...data);
    } catch (e) {}
  }
  if (userList.length === 0) {
    for (let i = 1; i <= 60; i++) userList.push({ id: `dummy_${i}`, name: `Student ${i}` });
  }
  const courseSeed = { math: 0, science: 1, history: 2, literature: 3 }[course] || 0;
  const entries = userList.map(user => {
    let hash = 0;
    const str = user.id + course;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    const pseudoRand = Math.abs(hash) % 1000;
    let score = 300 + (pseudoRand % 700);
    if (course === "math") score += 30;
    if (course === "science") score += 20;
    score = Math.min(999, Math.max(150, score));
    return { name: user.name, points: Math.round(score) };
  });
  entries.sort((a, b) => b.points - a.points);
  return entries.slice(0, limit).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}
  
  // Mock overall leaderboard (realistic demo)
  function generateMockOverallLeaderboard(limit) {
      const mockNames = ['Emma Watson', 'Liam Chen', 'Sophia Rodriguez', 'Noah Kim', 'Olivia Williams', 
             'Mason Brown', 'Isabella Garcia', 'Ethan Johnson', 'Ava Martinez', 'Lucas Lee',
             'Mia Davis', 'Alexander Wilson', 'Charlotte Moore', 'Benjamin Taylor', 'Amelia Anderson',
             'Daniel Thomas', 'Harper Jackson', 'Matthew White', 'Evelyn Harris', 'James Martin'];
      const users = [];
      for (let i = 0; i < Math.min(limit, 60); i++) {
    const name = mockNames[i % mockNames.length] + (i >= mockNames.length ? ` ${Math.floor(i/mockNames.length)+1}` : '');
    users.push({
        rank: i+1,
        name: name,
        points: Math.floor(Math.random() * (980 - 420 + 1) + 420),
        userId: `mock_${i}`
    });
      }
      users.sort((a,b) => b.points - a.points);
      return users.slice(0, limit);
  }
  // ---------- UI RENDERING & HELPERS (unchanged) ----------
function showSkeletonLoader(count = 10) {
  leaderboardList.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("li");
    skeleton.classList.add("leaderboard-item", "skeleton");
    skeleton.style.height = "58px";
    skeleton.style.background = "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)";
    skeleton.style.backgroundSize = "200% 100%";
    skeleton.style.borderRadius = "12px";
    skeleton.style.margin = "8px 0";
    leaderboardList.appendChild(skeleton);
  }
}

function renderLeaderboard(entries) {
  if (!entries || entries.length === 0) {
    leaderboardList.innerHTML = `<div class="error-message">⚠️ No data. <button class="retry-btn" onclick="refreshLeaderboard()">Retry</button></div>`;
    return;
  }
  const fragment = document.createDocumentFragment();
  entries.forEach(entry => {
    const li = document.createElement("li");
    li.classList.add("leaderboard-item");
    li.innerHTML = `
      <span class="leaderboard-rank">#${entry.rank}</span>
      <span class="leaderboard-user">${escapeHtml(entry.name)}</span>
      <span class="leaderboard-score">${entry.points} pts</span>
    `;
    fragment.appendChild(li);
  });
  leaderboardList.innerHTML = "";
  leaderboardList.appendChild(fragment);
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
}
// Mock fallback (only used if Supabase RPC fails)
function generateMockOverallLeaderboard(limit) {
  const mockNames = ["Emma Watson", "Liam Chen", "Sophia Rodriguez", "Noah Kim", "Olivia Williams"];
  const entries = [];
  for (let i = 0; i < limit; i++) {
    const name = mockNames[i % mockNames.length] + (i >= mockNames.length ? ` ${Math.floor(i / mockNames.length) + 1}` : "");
    entries.push({ rank: i + 1, name, points: Math.floor(Math.random() * 2500 + 500) });
  }
  entries.sort((a, b) => b.points - a.points);
  return entries.slice(0, limit);
}

// ---------- MAIN UPDATE ----------
let isLoading = false;
async function refreshLeaderboard() {
  if (isLoading) return;
  isLoading = true;
  showSkeletonLoader(Math.min(currentLimit, 20));

  try {
    let data;
    if (currentCriteria === "points") {
      data = await fetchOverallLeaderboard(currentLimit);
    } else {
      data = await fetchDummyCourseLeaderboard(currentCourse, currentLimit);
    }
    renderLeaderboard(data);
  } catch (err) {
    console.error(err);
    leaderboardList.innerHTML = `<div class="error-message">❌ Failed to load.<br><button class="retry-btn" onclick="refreshLeaderboard()">Retry</button></div>`;
  } finally {
    isLoading = false;
  }
}

// ---------- EVENT HANDLERS ----------
function onCriteriaChange() {
  currentCriteria = criteriaSelect.value;
  courseWrapper.classList.toggle("hidden", currentCriteria !== "course-points");
  refreshLeaderboard();
}
function onLimitChange() {
  currentLimit = parseInt(limitSelect.value, 10);
  refreshLeaderboard();
}
function onCourseChange() {
  if (currentCriteria === "course-points") {
    currentCourse = courseSelect.value;
    refreshLeaderboard();
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const body = document.body;

    if (isIOS) body.classList.add('ios');
    if (isAndroid) body.classList.add('android');

    document.documentElement.style.setProperty('--easing-default', isIOS ? 'var(--easing-ios)' : 'var(--easing-android)');
    document.documentElement.style.setProperty('--shadow-default', isIOS ? 'var(--shadow-soft)' : 'var(--shadow-material)');

  criteriaSelect.addEventListener("change", onCriteriaChange);
  limitSelect.addEventListener("change", onLimitChange);
  courseSelect.addEventListener("change", onCourseChange);
  window.refreshLeaderboard = refreshLeaderboard;

  courseWrapper.classList.add("hidden");
  refreshLeaderboard();
    

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