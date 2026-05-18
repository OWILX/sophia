/*export function showToast(message, type = 'info', time_ms = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Allow DOM paint before adding show class
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('fade-out');

        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, time_ms);
}
*/
let activeToast = null;

export function showToast(message, type = 'info', time_ms = 3000) {
    const container = document.getElementById('toast-container');

    // Remove existing toast
    if (activeToast) {
        activeToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    activeToast = toast;

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('fade-out');

        toast.addEventListener('transitionend', () => {
            if (activeToast === toast) {
                activeToast = null;
            }

            toast.remove();
        });
    }, time_ms);
}