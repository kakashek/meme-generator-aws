document.addEventListener('DOMContentLoaded', function() {


    // Get access token
    const accessToken = localStorage.getItem('accessToken');

    let allMemes = []; 
    let displayedCount = 0; 

    function appendMemeToContainer(imageUrl, meme, container) {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-sm-6 mb-4';
        col.innerHTML = `
            <div class="card" id="card-${meme.memeId}">
                <img id="meme-img-${meme.memeId}" src="${imageUrl}" class="card-img-top" alt="${meme.title}">
                <div class="card-body">
                    <h5 class="card-title">${meme.title}</h5>
                    <p> Creator: ${meme.creator} </p>
                    <button id="delete-${meme.memeId}" class="btn btn-danger">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(col);
    
        // Event listener for delete
        document.getElementById(`delete-${meme.memeId}`).addEventListener('click', function() {
            deleteMeme(meme.memeId);
        });
    }
    
    // Function to handle deleting memes
    function deleteMeme(memeId) {
        fetch(`/api/memes/${memeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/json' 
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Meme deleted successfully!');
                document.getElementById(`card-${memeId}`).remove()
                const memeCol = document.getElementById(`meme-col-${memeId}`);
                if (memeCol) {
                    memeCol.remove();
                }
            } else {
                alert('Failed to delete meme: ' + data.message);
            }
        })
        .catch(error => console.error('Delete failed:', error));
    }

    // Fetch and display initial memes
    function fetchMemes() {
        fetch('/api/my-memes', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allMemes = data.data;
                console.log(allMemes);
                displayMemes(8); 
            } else {
                console.error('Failed to fetch memes:', data.error_message);
            }
        })
        .catch(error => console.error('Error fetching memes:', error));
    }

    // Function to display memes in a 2x4 grid
    function displayMemes(count) {
        const container = document.getElementById('memeGallery');
        const memesToDisplay = allMemes.slice(displayedCount, displayedCount + count);
        memesToDisplay.forEach(meme => {
            appendMemeToContainer(meme.imageUrl, meme, container);
        });
        displayedCount += memesToDisplay.length; 
        document.getElementById('loadMoreBtn').style.display = displayedCount < allMemes.length ? 'block' : 'none';
    }

    document.getElementById('loadMoreBtn').addEventListener('click', function() {
        displayMemes(8); 
    });

    fetchMemes();
});
