function logout() {

    // Get access token
    const accessToken = localStorage.getItem('accessToken');

    fetch('/api/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`, 
            'Content-Type': 'application/json' 
        },
        credentials: 'include' 
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear local storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('idToken');
            alert('Successfully logged out!');
            window.location.href = '/login';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        alert('Your session has been revoked. Please log in again.');
        // Clear local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        window.location.href = '/login';
    
    });
}

