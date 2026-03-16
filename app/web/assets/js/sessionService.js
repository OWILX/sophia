// sessionService.js

const API_URL = 'https://letstudy.infinityfreeapp.com/session.php';

/**
 * Fetches a session variable from the PHP backend.
 * @param {string} varName - The key of the session variable.
 */
async function getSessionValue(varName) {
    const url = `${API_URL}?key=${encodeURIComponent(varName)}`;

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'omit' // explicitly block cookies
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
        console.warn(`Session Notice: ${data.error}`);
        return null;
    }

    return data.value;
}