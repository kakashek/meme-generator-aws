
// Handle registration information
document.getElementById('registerBtn').addEventListener('click', function (event) {
    event.preventDefault();
    
    const username = document.getElementById('inputUsername').value;
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;
    const passwordConfirm = document.getElementById('inputPasswordConfirm').value;

    // Check password match
    if (password !== passwordConfirm) {
        alert("Passwords do not match!");
        return;
    }

    // Prepare data
    const data = {
        username,
        email,
        password,
    };

    // Send register request
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('register-section').style.display = 'none';
            document.getElementById('confirmation-section').style.display = 'block';
        } else {
            alert("Registration failed: " + data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred during registration.");
    });
});

// Handle confirmation code submission
document.getElementById('confirmationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('inputUsername').value;
    const confirmationCode = document.getElementById('inputConfirmationCode').value;

    try {
        const response = await fetch('/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, confirmationCode })
        });

        const result = await response.json();
        if (result.success) {
            alert('Account confirmed successfully!');
            window.location.href = '/login'; 
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Confirmation error:', error);
        alert('An error occurred. Please try again.');
    }
});

document.getElementById('loginBtn').addEventListener('click', function (event) {
    window.location.href = '/login'; 
});


