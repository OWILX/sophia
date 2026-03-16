function setLoading(button, isLoading) {
  button.classList.toggle("loading", isLoading);
  button.classList.toggle("skeleton", isLoading);
}
document.addEventListener('DOMContentLoaded', () => {
  const googleBtn = document.getElementById('google-btn');
  if (!googleBtn) return;
  googleBtn.addEventListener('click', () => {
    // Add visual feedback
    setLoading(googleBtn, true);
    document.body.classList.add("page-exit");

    // Redirect to your PHP script which initiates the Google login
    setTimeout(() => {
      window.location.href = 'https://letstudy.infinityfreeapp.com/app/google-callback.php'; 
    }, 500);
  });
});
