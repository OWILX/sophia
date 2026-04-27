import { client } from './supabase.js';
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

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', async () => {
    // Platform detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isIOS) document.body.classList.add('ios');
    if (isAndroid) document.body.classList.add('android');
    document.documentElement.style.setProperty('--easing-default',
        isIOS ? 'var(--easing-ios)' : 'var(--easing-android)');


    // Trigger initial session check
    const { data: { session } } = await client.auth.getSession();
    initSettings(session.user);
});

async function initSettings(user) {
    // DOM elements
    const elAvatar = document.getElementById('avatar-initials');
    const elNameDisplay = document.getElementById('profile-name-display');
    const elNameInput = document.getElementById('profile-name-input');
    const elEmail = document.getElementById('profile-email');
    const signOutBtn = document.getElementById('profile-signout');
    const darkToggle = document.getElementById('dark-mode-toggle');
    const notifToggle = document.getElementById('notifications-toggle');
    const soundToggle = document.getElementById('sounds-toggle');
    const dailyChips = document.getElementById('daily-goal-chips');
    const deleteBtn = document.getElementById('delete-account');

    // Load user data
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const email = user.email || '';

    // Display profile
    updateProfileDisplay(fullName, email);
    // Editable name
    setupNameEditing(user, elNameDisplay, elNameInput, elAvatar);

    // Fetch preferences from Supabase
    let prefs = await fetchPreferences(user.id);
    const savedPrefs = JSON.parse(localStorage.getItem('letstudy_settings')) || {};

    // Fallback: if no row yet, use localStorage or defaults
    if (!prefs) {
        prefs = {
            dark_mode: savedPrefs.darkMode ?? false,
            notifications: savedPrefs.notifications ?? true,
            sounds: savedPrefs.sounds ?? true,
            daily_goal: 10
        };
        // Create row
        await upsertPreferences(user.id, prefs);
    }

    // Apply preferences to UI
    darkToggle.checked = prefs.dark_mode;
    notifToggle.checked = prefs.notifications;
    soundToggle.checked = prefs.sounds;

    // Wire dark mode immediately
    applyDarkMode(prefs.dark_mode);

    // Set daily goal chip
    const goal = prefs.daily_goal ?? 10;
    setDailyGoalChip(goal);
    localStorage.setItem('letstudy_daily_goal', goal); // for budget.js

    // Event listeners
    darkToggle.addEventListener('change', async (e) => {
        const checked = e.target.checked;
        applyDarkMode(checked);
        prefs.dark_mode = checked;
        await savePreferences(user.id, prefs);
    });

    notifToggle.addEventListener('change', async (e) => {
        prefs.notifications = e.target.checked;
        await savePreferences(user.id, prefs);
    });

    soundToggle.addEventListener('change', async (e) => {
        prefs.sounds = e.target.checked;
        await savePreferences(user.id, prefs);
    });

    dailyChips.addEventListener('click', async (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        const value = parseInt(chip.dataset.value, 10);
        if (value === prefs.daily_goal) return;

        prefs.daily_goal = value;
        setDailyGoalChip(value);
        localStorage.setItem('letstudy_daily_goal', value);
        await savePreferences(user.id, prefs);
        showToast(`Daily goal set to ${value}`, 'success');
    });

    // Sign out with confirm
    signOutBtn.addEventListener('click', async () => {
        const result = await showConfirm('Are you sure you want to sign out?');
        if (result) {
            localStorage.removeItem('letstudy_user');
            localStorage.removeItem('letstudy_settings');
            await client.auth.signOut();
            window.location.href = LOGIN_URL;
        }
    });

    // Delete account with confirm
    deleteBtn.addEventListener('click', async () => {
        const result = await showConfirm(
            'This will permanently delete your account and all progress. Continue?'
        );
        if (result) {
            // Placeholder for actual deletion logic
            showToast('Account deletion requested (MVP placeholder)', 'error');
        }
    });

    // Platform interactions (ripple/highlight)
    setupPlatformInteractions();
}

// ---------- Helper functions ----------

function updateProfileDisplay(name, email) {
    document.getElementById('profile-name-display').textContent = name || 'User';
    document.getElementById('avatar-initials').textContent = (name?.[0] || 'U').toUpperCase();
    document.getElementById('profile-email').textContent = email || 'No email';
}

function setupNameEditing(user, displayEl, inputEl, avatarEl) {
    const originalName = displayEl.textContent;

    displayEl.addEventListener('click', () => {
        displayEl.style.display = 'none';
        inputEl.style.display = 'block';
        inputEl.value = originalName;
        inputEl.focus();
    });

    const saveName = async () => {
        const newName = inputEl.value.trim();
        if (!newName || newName === originalName) {
            // Revert
            displayEl.style.display = '';
            inputEl.style.display = 'none';
            return;
        }
        // Update display
        displayEl.textContent = newName;
        avatarEl.textContent = newName[0].toUpperCase();
        displayEl.style.display = '';
        inputEl.style.display = 'none';

        // Update Supabase metadata
        const { error } = await client.auth.updateUser({
            data: { full_name: newName }
        });
        if (error) {
            showToast('Failed to update name', 'error');
            // revert
            displayEl.textContent = originalName;
            avatarEl.textContent = originalName[0].toUpperCase();
        } else {
            showToast('Name updated', 'success');
            // Update original for future edits
            originalName = newName;
            displayEl.textContent = newName;
        }
    };

    inputEl.addEventListener('blur', saveName);
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            inputEl.blur();
        }
    });
}

function applyDarkMode(enabled) {
    if (enabled) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

async function fetchPreferences(userId) {
    const { data, error } = await client
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        console.error('Error fetching preferences:', error);
        return null;
    }
    return data;
}

async function upsertPreferences(userId, prefs) {
    const { error } = await client
        .from('user_preferences')
        .upsert({
            user_id: userId,
            dark_mode: prefs.dark_mode,
            notifications: prefs.notifications,
            sounds: prefs.sounds,
            daily_goal: prefs.daily_goal
        }, { onConflict: 'user_id' });
    if (error) console.error('Error saving preferences:', error);
}

async function savePreferences(userId, prefs) {
    await upsertPreferences(userId, prefs);
    // Also update localStorage as fallback
    localStorage.setItem('letstudy_settings', JSON.stringify({
        darkMode: prefs.dark_mode,
        notifications: prefs.notifications,
        sounds: prefs.sounds
    }));
    localStorage.setItem('letstudy_daily_goal', prefs.daily_goal);
}

function setDailyGoalChip(value) {
    document.querySelectorAll('#daily-goal-chips .chip').forEach(chip => {
        const val = parseInt(chip.dataset.value, 10);
        chip.classList.toggle('active', val === value);
    });
}

// ---------- UI Components (Toast & Confirm) ----------

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Auto remove after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        messageEl.textContent = message;
        modal.style.display = 'flex';

        const cleanup = () => {
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
        };

        const onConfirm = () => {
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// ---------- Platform interactions ----------
function setupPlatformInteractions() {
    const interactiveEls = document.querySelectorAll('.settings-item, .danger-btn, .back-btn, .profile-card');
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

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
}