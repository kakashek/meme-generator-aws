import fetch from 'node-fetch'; // Import using ES module syntax
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Form data to send
const formData = {
    path: "https://i.imgflip.com/bwu6w.jpg",
    title: "Load Test",
    text0: "Test0",
    text1: "Test1",
    color: "black",
    transformation: true
};

// Function to send a single request
async function sendRequest() {
    try {
        const apiBaseUrl = process.env.API_BASE_URL || 'https://meme-generator-app.example.com';
        const response = await fetch(`${apiBaseUrl}/api/meme-generator`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        console.log('Request successful');
    } catch (error) {
        console.error('Error in request:', error.message);
    }
}

// Function to execute load test
async function loadTest(numRequests, batchSize) {
    for (let i = 0; i < numRequests; i += batchSize) {
        const batchPromises = [];
        for (let j = 0; j < batchSize && i + j < numRequests; j++) {
            batchPromises.push(sendRequest());
        }
        await Promise.all(batchPromises); // Send batch concurrently
        console.log(`Batch ${i / batchSize + 1} completed`);
    }
}


loadTest(100, 30);



