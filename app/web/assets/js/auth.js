// ────────────────────────────────────────────────
//  SUPABASE CONFIG
// ────────────────────────────────────────────────

const { createClient } = supabase;
const SUPABASE_URL = "https://nlenaoincibjuyejhmak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UVe9_-V8CSy0Jujg4JjcnQ_MXP6F2Ap";
const DASHBOARD_URL = "https://owilx.github.io/sophia/app/web/dashboard.html";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ────────────────────────────────────────────────
//  UI HELPERS
// ────────────────────────────────────────────────
function setLoading(button, isLoading) {
  button.classList.toggle("loading", isLoading);
  button.classList.toggle("skeleton", isLoading);
}

// ────────────────────────────────────────────────
//  CHECK IF USER ALREADY LOGGED IN
// ────────────────────────────────────────────────
async function checkUser() {
  const { data: { session } } = await client.auth.getSession();
  
  if (session) {
    // If they are already logged in, send them to the dashboard immediately
    window.location.href = DASHBOARD_URL;
  }
}

// ────────────────────────────────────────────────
//  LOGIN BUTTON
// ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("google-btn");
  if (!googleBtn) return;

  googleBtn.addEventListener("click", async () => {
    setLoading(googleBtn, true);
    document.body.classList.add("page-exit");

    // Small animation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Double-check if a session exists right before trying to log in
    const { data: { session } } = await client.auth.getSession();
    
    if (session) {
      window.location.href = DASHBOARD_URL;
      return; // Stop execution here
    }

    // Initiate Google OAuth
    const { error: signInError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: DASHBOARD_URL 
      }
    });

    if (signInError) {
      console.error("OAuth Error:", signInError.message);
      setLoading(googleBtn, false);
      document.body.classList.remove("page-exit");
    }
  });
});

// ────────────────────────────────────────────────
//  INITIAL CHECK
// ────────────────────────────────────────────────
checkUser();
