const axios = require('axios');
const Memcached = require('memcached');
const util = require("node:util");

// Create a Memcached client
const cacheEndpoint = process.env.ELASTICACHE_ENDPOINT;
let memcached;

function connectToMemcached() {
    memcached = new Memcached(cacheEndpoint);
    memcached.on("failure", (details) => {
       console.log("Memcached server failure: ", details);
    });
    memcached.aGet = util.promisify(memcached.get).bind(memcached);
    memcached.aSet = util.promisify(memcached.set).bind(memcached);
}


// External API URL
const apiUrl = 'https://api.imgflip.com/get_memes';

async function cachedFetch(apiUrl) {
    // Check to see if the URL is in the cache
    const value = await memcached.aGet(apiUrl);
    if (value) {
       return JSON.parse(value);;
    }
 
    // Cache doesn't have the value, so get it
    const response = await fetch(apiUrl);
    const fetchedValue = await response.json();
    
    // Cache the data with TTL of 3600 seconds
    await memcached.aSet(apiUrl, JSON.stringify(fetchedValue), 3600);
    return fetchedValue;
}

exports.fetchMemes = async (req, res) => {
    try {
        connectToMemcached();
        // Get data from cache
        const cachedMemes = await cachedFetch(apiUrl); 

        // Check if the data is in the expected format
        if (cachedMemes.success) {
            res.status(200).json({
                success: true,
                data: cachedMemes.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch memes from the API'
            });
        }
    } catch (error) {
        console.error('Error fetching memes:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching memes'
        });
    }
};

exports.updateUserStatus = async function (key, metadata, userSub, status) {
    try {
        // Connect to Memcached
        connectToMemcached();
        const statusKey = `status_${userSub}`;

        // Update the status in Memcached
        await memcached.aSet(statusKey, JSON.stringify({ s3Key: key, metadata: metadata, status: status }), 3600); 

        // Return response
        const response = { success: true, message: "Status updated successfully" };
        return response;

    } catch (error) {
        console.error('Error updating user status:', error);
        const response = { success: false, message: "Internal server error when updating user status" };
        return response;

    }
};

exports.checkUserStatus = async function (userSub) {
    try {
        // Connect to Memcached
        connectToMemcached();
        const statusKey = `status_${userSub}`;

        // Retrieve the status from Memcached
        const cachedStatus = await memcached.aGet(statusKey);

        if (cachedStatus) {
            // Parse the cached status
            const statusData = JSON.parse(cachedStatus);
            return {
                success: true,
                data: statusData, 
                message: "User status retrieved successfully"
            };
        } else {
            // Status not found in cache
            return {
                success: false,
                message: "No status found for this user"
            };
        }
    } catch (error) {
        console.error('Error checking user status:', error);
        return {
            success: false,
            message: "Internal server error when checking user status"
        };
    }
};








