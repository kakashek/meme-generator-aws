document.addEventListener('DOMContentLoaded', function() {
    const signInButton = document.getElementById('signInBtn');
    const googleSignInButton = document.getElementById('googleSignInBtn');
    const signUpButton = document.getElementById('signUpBtn');
    const emailInput = document.getElementById('inputEmail1');
    const passwordInput = document.getElementById('inputPassword1');

    signInButton.addEventListener('click', function(event) {
        event.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password }),
            credentials: 'include'  
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('idToken', data.idToken)
                localStorage.setItem('accessToken', data.accessToken)

                if (data.admin === true) {
                    window.location.href = "/admin"
                } else {
                    window.location.href = "/"
                }

            } else if (data.password_change) {
                window.location.href = `/login/password-change?email=${encodeURIComponent(data.email)}&sessionId=${encodeURIComponent(data.sessionId)}`;
                alert(data.message);
            } else {
                alert(data.message); 
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to sign in');
        });
    });

    document.getElementById('googleSignInBtn').addEventListener('click', function() {
        fetch('/api/google-login', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'  
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success) {
                window.location.href = data.googleLoginUrl
            } else {
                alert(data.message); 
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error retrieving Google login URL');
       });
    });
});

