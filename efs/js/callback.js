
document.addEventListener('DOMContentLoaded', function() {

    // Get query parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const idToken = urlParams.get('idToken');
    const accessToken = urlParams.get('accessToken');

    if (idToken && accessToken) {
        // Store tokens and username information in local storage
        localStorage.setItem('idToken', idToken);
        localStorage.setItem('accessToken', accessToken);
        window.location.href = '/';

    } else {
        alert('Failed to retrieve tokens.');
    }
});