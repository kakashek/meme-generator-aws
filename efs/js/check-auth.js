document.addEventListener('DOMContentLoaded', function() {
    // Check access token
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        fetch('/api/auth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('accessToken', data.accessToken)
            } else {
                window.location.href = '/login';
                alert(data.message); 
            }
        })
    }
    else {
        window.location.href = '/login';
        alert('Unauthorized! Please login to continue');
    }
});