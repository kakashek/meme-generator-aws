// Extract email from URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');
const sessionId = urlParams.get('sessionId');
document.getElementById('email').value = email;
document.getElementById('sessionId').value = sessionId;

document.getElementById('submit').addEventListener('click', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Check password match
    if (newPassword != confirmNewPassword) {
        alert("Passwords do not match!");
    }

    // Call the function to change the password
    const response = await changePassword(email, newPassword, sessionId);
    if (response.success) {
        alert('Password changed successfully! Please log in.');
        window.location.href = '/login'; 
    } else {
        alert('Error changing password: ' + response.message);
    }
});

async function changePassword(email, newPassword) {
    // Change password in backend
    const response = await fetch('/login/password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, sessionId })
    });
    return response.json(); 
}