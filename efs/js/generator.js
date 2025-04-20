let oldImageUrl = null
let storedTitle = null;
let storedMetadata = null;
let generatedImageUrl = null;
let generatedImageKey = null;

// Get access token
const accessToken = localStorage.getItem('accessToken');

document.getElementById('generateBtn').addEventListener('click', function(event) {
    
    event.preventDefault();
    const path = document.getElementById('memeImage').src;
    const title = document.getElementById('title').value;
    const text0 = document.getElementById('text0').value;
    const text1 = document.getElementById('text1').value;
    const color = document.getElementById('color').value;
    const transformation = document.getElementById('transformation').checked;
    oldImageUrl = path;

    const formData = {
        path: path,
        title: title,
        text0: text0,
        text1: text1,
        color: color,
        transformation: transformation
    };

    fetch('/api/meme-generator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            generatedImageUrl = data.data.generatedImageUrl;
            storedTitle = data.data.title;
            storedMetadata = data.data.metadata;
            generatedImageKey = data.data.generatedImageKey;

            document.getElementById('memeImage').src = generatedImageUrl;
            document.getElementById('saveBtn').style.display = 'block';
            document.getElementById('redoBtn').style.display = 'block';
            document.getElementById('generateBtn').style.display = 'none';
            document.getElementById('uploadBtn').textContent = 'Upload New File';            

        } else {
            alert('Failed to create meme: ' + data.message)        
        }
    })
    .catch(error => console.error('Error:', error));
});

document.getElementById('saveBtn').addEventListener('click', function() {
    if (generatedImageUrl) {
        const formData = {
            generatedImageUrl: generatedImageUrl,
            generatedImageKey: generatedImageKey,
            storedTitle: storedTitle,
            storedMetadata: storedMetadata,
        };
        fetch('/api/memes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {      
                alert('Meme successfully added to your gallery!')
                document.getElementById('redoBtn').click();
            } else {
                alert('Failed to create meme: ' + data.message)
            }
        })
        .catch(error => console.error('Error:', error));
    } else {
        alert("Meme is not created. Please try create a meme first.")
    }

});

document.getElementById('redoBtn').addEventListener('click', function() {
    document.getElementById('memeImage').src = oldImageUrl
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('redoBtn').style.display = 'none';
    document.getElementById('generateBtn').style.display = 'block'; 
    document.getElementById('uploadBtn').style.display = 'block';
    document.getElementById('uploadBtn').textContent = 'Upload';  
});

