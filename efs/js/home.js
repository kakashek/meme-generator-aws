document.addEventListener('DOMContentLoaded', function() {

    // Change username
    const username = localStorage.getItem('username');
    if (username) {
        const usernameSpan = document.querySelector('.nav-username');
        if (usernameSpan) {
            usernameSpan.textContent = username;
        }
    }

    // Fetch all memes from memCache
    let allMemes = [];
    let displayingMemes = [];
    let currentIndex = 0;
    let displayedMemes = new Set(); 
    let imageElements = []; 

    // Function to randomly shuffle array (copied from stack overflow)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function fetchMemes() {
        fetch('/api/external-memes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allMemes = data.data.memes;
                shuffleArray(allMemes);
                displayingMemes = allMemes;
                displayMemes(8);
            } else {
                console.error('Failed to fetch memes:', data.error_message);
            }
        })
        .catch(error => console.error('Error fetching memes:', error));
    }

    // Transform memes
    function transformImage(url, callback, applyFilters) {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 500;
            canvas.height = 500;
            ctx.filter = 'brightness(80%) contrast(110%)'
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg'));
        };
        img.src = url;
    }

    // Display all memes
    function displayMemes(count, applyFilters = false) {
        const container = document.querySelector('.row');
        const slice = displayingMemes.slice(currentIndex, currentIndex + count);
        slice.forEach(meme => {
            if (!displayedMemes.has(meme.url)) {
                displayedMemes.add(meme.url);
                transformImage(meme.url, (transformedImageUrl) => {
                    appendMemeToContainer(transformedImageUrl, meme, container, applyFilters);
                }, applyFilters);
            }
        });
        currentIndex += count;  
        adjustLoadMoreButton();
    }

    function appendMemeToContainer(imageUrl, meme, container, applyFilters) {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-sm-6 mb-4';
        col.innerHTML = `
            <div class="card">
                <img id="meme-${meme.id}" src="${imageUrl}" class="card-img-top" alt="${meme.name}">
                <div class="card-body">
                    <h5 class="card-title">${meme.name}</h5>
                    <button id="edit-${meme.id}" class="btn btn-primary">Edit</button>
                </div>
            </div>
        `;
        container.appendChild(col);
        if (!applyFilters) { 
            imageElements.push({ id: `meme-${meme.id}`, url: meme.url });
        }

        // Add click event listener to the edit button
        document.getElementById(`edit-${meme.id}`).addEventListener('click', function() {
            document.getElementById('redoBtn').click();
            const memeImage = document.getElementById('memeImage'); 
            if (memeImage) {
                const fileUrl = allMemes.find(m => m.id === meme.id).url;
                memeImage.src = fileUrl; 
            }
            document.getElementById('uploadBtn').textContent = 'Upload New File'; 
        });
    }

    function adjustLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        loadMoreBtn.style.display = (currentIndex < displayingMemes.length) ? 'block' : 'none';
    }


    document.getElementById('loadMoreBtn').addEventListener('click', function() {
        displayMemes(8);  
    });


    fetchMemes();
});


