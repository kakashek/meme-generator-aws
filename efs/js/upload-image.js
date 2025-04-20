document.getElementById('uploadBtn').addEventListener('click', function() {
    document.getElementById('fileInput').click(); 
});

document.getElementById('fileInput').addEventListener('change', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }
    // Get access token
    const accessToken = localStorage.getItem('accessToken');
    
    // Get pre-signed URLs
    fetch('/api/image-url', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.uploadUrl || !data.retrieveUrl) {
            throw new Error('Failed to get pre-signed URLs from the server');
        }
        const uploadUrl = data.uploadUrl;
        const retrieveUrl = data.retrieveUrl;
        const imageKey = data.imageKey;

        // Upload image with pre-signed upload URL
        fetch(uploadUrl, {
            method: 'PUT',
            body: file
        })
        .then(uploadResponse => {
            if (!uploadResponse.ok) {
                throw new Error('Error uploading file to S3');
            }
            fetch('/api/sqs-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    imageKey: imageKey,
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Display image with pre-signed retrieval URL
                    document.getElementById('memeImage').src = retrieveUrl;
                    document.getElementById('memeImage').style.display = 'block';
                    document.getElementById('uploadBtn').textContent = 'Upload New File';
                }
                else {
                    alert('Error uploading file! Please try again.');
                }
            })
        });
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error uploading file! Please try again.');
    });
});


    