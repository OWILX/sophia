import { client } from "./supabase.js";
import {showToast} from "./tools.js";
const DASHBOARD_URL = "https://medsophia-owilx.netlify.app/app/web/dashboard.html";

// ────────────────────────────────────────────────
// UI ELEMENTS
// ────────────────────────────────────────────────

const googleBtn = document.getElementById("google-btn");
const emailBtn = document.getElementById("email-btn");
const backBtn = document.getElementById("back-btn");

const defaultView = document.querySelector(".auth-default");
const formView = document.getElementById("email-auth-view");

const formTitle = document.getElementById("form-title");
const authForm = document.querySelector(".auth-form");

const submitBtn = document.querySelector(".btn-submit");

const emailInput = document.querySelector(
  'input[type="email"]'
);

const passwordInputs = document.querySelectorAll(
  'input[type="password"]'
);

const switchModeContainer = document.querySelector(".switch-mode");

const confirmPasswordGroup = document.getElementById("confirm-password-group");

// ────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────

let isLogin = false;

// ────────────────────────────────────────────────
// UI HELPERS
// ────────────────────────────────────────────────

function setLoading(button, isLoading) {
  if (!button) return;

  button.classList.toggle("loading", isLoading);
  button.classList.toggle("skeleton", isLoading);

  button.disabled = isLoading;
}

function showFormView() {
  defaultView.classList.remove("active-view");
  defaultView.classList.add("hidden-view");

  formView.classList.remove("hidden-view");
  formView.classList.add("active-view");
}

function showDefaultView() {
  formView.classList.remove("active-view");
  formView.classList.add("hidden-view");

  defaultView.classList.remove("hidden-view");
  defaultView.classList.add("active-view");
}

function updateAuthMode() {
  if (isLogin) {
    formTitle.textContent = "Welcome back";

    submitBtn.textContent = "Login";

    confirmPasswordGroup.style.display = "none";

    switchModeContainer.innerHTML = `
      Don't have an account?
      <span id="toggle-auth-mode">Sign Up</span>
    `;
  } else {
    formTitle.textContent = "Create account";

    submitBtn.textContent = "Sign Up";

    confirmPasswordGroup.style.display = "flex";

    switchModeContainer.innerHTML = `
      Already have an account?
      <span id="toggle-auth-mode">Login</span>
    `;
  }

  reconnectToggle();
}

function reconnectToggle() {
  const toggle = document.getElementById(
    "toggle-auth-mode"
  );

  if (!toggle) return;

  toggle.addEventListener("click", () => {
    isLogin = !isLogin;

    updateAuthMode();
  });
}

function showError(message) {
  showToast(message, 'error');
}

function showSuccess(message) {
  showToast(message, 'success');
}

// ────────────────────────────────────────────────
// CHECK ACTIVE SESSION
// ────────────────────────────────────────────────

async function checkUser() {
  const {
    data: { session }
  } = await client.auth.getSession();

  if (session) {
    document.body.classList.add("page-exit");
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.location.href = DASHBOARD_URL;
  }
}

// ────────────────────────────────────────────────
// GOOGLE AUTH
// ────────────────────────────────────────────────

async function handleGoogleAuth() {
  try {
    setLoading(googleBtn, true);

    document.body.classList.add("page-exit");

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    const {
      data: { session }
    } = await client.auth.getSession();

    if (session) {
      window.location.href = DASHBOARD_URL;
      return;
    }

    const { error } =
      await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: DASHBOARD_URL
        }
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(error);

    showError(error.message);

    setLoading(googleBtn, false);

    document.body.classList.remove("page-exit");
  }
}

// ────────────────────────────────────────────────
// EMAIL AUTH
// ────────────────────────────────────────────────

async function handleEmailAuth(e) {
  e.preventDefault();

  const email = emailInput.value.trim();

  const password = passwordInputs[0].value;

  const confirmPassword =
    passwordInputs[1]?.value;

  if (!email || !password) {
    showError("Please fill all required fields.");
    return;
  }

  if (!isLogin && password !== confirmPassword) {
    showError("Passwords do not match.");
    return;
  }

  try {
    setLoading(submitBtn, true);

    let response;

    // ───── LOGIN ─────
    if (isLogin) {
      response =
        await client.auth.signInWithPassword({
          email,
          password
        });
    }

    // ───── SIGNUP ─────
    else {
      response = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: DASHBOARD_URL
        }
      });
    }

    const { error } = response;

    if (error) {
      throw error;
    }

    // Optional:
    // show success message before redirect
    showSuccess("Login successful.");
    document.body.classList.add("page-exit");

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    window.location.href = DASHBOARD_URL;
  } catch (error) {
    console.error(error);

    showError(error.message);
  } finally {
    setLoading(submitBtn, false);
  }
}

// ────────────────────────────────────────────────
// EVENT LISTENERS
// ────────────────────────────────────────────────

document.addEventListener(
  "DOMContentLoaded",
  () => {
    // Initial auth check
    checkUser();

    // Google
    googleBtn?.addEventListener(
      "click",
      handleGoogleAuth
    );

    // Open email auth
    emailBtn?.addEventListener(
      "click",
      showFormView
    );

    // Back button
    backBtn?.addEventListener(
      "click",
      showDefaultView
    );

    // Email form submit
    authForm?.addEventListener(
      "submit",
      handleEmailAuth
    );

    // Initialize toggle system
    reconnectToggle();
  }
);