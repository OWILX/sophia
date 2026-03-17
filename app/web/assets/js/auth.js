// ────────────────────────────────────────────────
//  SUPABASE CONFIG
// ────────────────────────────────────────────────
const { createClient } = supabase;
const SUPABASE_URL = "https://nlenaoincibjuyejhmak.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZW5hb2luY2lianV5ZWpobWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDM1NjcsImV4cCI6MjA4OTI3OTU2N30.NS7hQB-q8Ta9WQebR0prb_Cx1OIJjQwKQC6tO3nQQQ0";
const DASHBOARD_URL = "https://sophia-owilx.netlify.app/app/web/dashboard.html";
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
  const { data: { user }, error } = await client.auth.getUser();

  if (error) {
    console.error(error);
    //return;
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
    const { data: { user }, error } = await client.auth.getUser();
    if (error) {
      console.error(error);
      setLoading(googleBtn, false);
      return;
    }
    // If user exists → logout
    if (user) {
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) {
        console.error(signOutError);
      }
      setLoading(googleBtn, false);
      document.body.classList.remove("page-exit");
      window.location.href = DASHBOARD_URL;
    }

    // Otherwise → login with Google
    const { error: signInError } = await client.auth.signInWithOAuth({
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
client.auth.onAuthStateChange((event, session) => {
  console.log("Auth Event:", event, session);

  if (event === "SIGNED_IN") {
    window.location.href = DASHBOARD_URL;
  }
});

// ────────────────────────────────────────────────
//  INITIAL CHECK
// ────────────────────────────────────────────────
checkUser();