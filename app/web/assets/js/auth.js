// ────────────────────────────────────────────────
//  SUPABASE CONFIG
// ────────────────────────────────────────────────
const SUPABASE_URL = "https://nlenaoincibjuyejhmak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UVe9_-V8CSy0Jujg4JjcnQ_MXP6F2Ap";
const DASHBOARD_URL = "https://sophia-owilx.netlify.app/app/web/dashboard.html";
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error(error);
    return;
  }

  if (user) {
    setTimeout(() => {
      window.location.href = DASHBOARD_URL;
    }, 500);
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
    // small animation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error(error);
      setLoading(googleBtn, false);
      return;
    }
    // If user exists → logout
    if (user) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error(signOutError);
      }
      setLoading(googleBtn, false);
      document.body.classList.remove("page-exit");
      return;
    }

    // Otherwise → login with Google
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: DASHBOARD_URL
        // queryParams: { prompt: "select_account" } // optional
      }
    });

    if (signInError) {
      console.error(signInError);
      setLoading(googleBtn, false);
      document.body.classList.remove("page-exit");
    }
  });

});

// ────────────────────────────────────────────────
//  AUTH STATE LISTENER
// ────────────────────────────────────────────────
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth Event:", event, session);

  if (event === "SIGNED_IN") {
    window.location.href = DASHBOARD_URL;
  }
});

// ────────────────────────────────────────────────
//  INITIAL CHECK
// ────────────────────────────────────────────────
checkUser();