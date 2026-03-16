document.addEventListener('DOMContentLoaded', () => {
  // Wait for splash animation, then redirect
  setTimeout(() => {
      window.location.href = '/app/web/login.html';
  }, 2000); // Matches splash duration (1.8s animation + buffer)
});
