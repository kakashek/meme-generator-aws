const express = require('express')
const router = express.Router();
const memeController = require('../controllers/memeController');
const { getPresignedUrl, checkSQSMessage } = require('../controllers/imageController');
const { fetchMemes } = require('../controllers/cacheController');
const { authenticateUser, checkAuthenticated, googleAuthenticate, googleCallback, logoutUser } = require('../middleware/authMiddleware');
const { meme_generator } = require('../middleware/memeGenerator');
const { checkUserStatus } = require('../middleware/memeGenerator');
const path = require('path');


// Login API
router.post('/login', authenticateUser, (req, res) => {
    if (req.user) {
        if (req.user['cognito:groups'] && req.user['cognito:groups'].includes('admin')) {
            res.status(200).json({
                success: true,
                message: 'Authentication successful',
                accessToken: req.accessToken,
                idToken: req.idToken,
                username: req.user.username,
                admin: true
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Authentication successful',
                accessToken: req.accessToken,
                idToken: req.idToken,
                username: req.user.username,
                admin: false
            });
        }
    }
});

// Logout API
router.post('/logout', logoutUser)

// Google login API
router.get('/google-login', googleAuthenticate);

// Check authenticated API
router.get('/auth', checkAuthenticated, (req, res) => {
    if (req.user) {
        if (req.user['cognito:groups'] && req.user['cognito:groups'].includes('admin')) {
            res.status(200).json({
                success: true,
                message: 'Authenticated user',
                accessToken: req.accessToken,
                admin: true
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Authenticated user',
                accessToken: req.accessToken,
                admin: false
            });
        }
    }
})

// Check status API
router.get('/status', checkAuthenticated, async (req, res) => { 
    if (req.user) {
        try {
            const response = await checkUserStatus(req.user.sub); 
            if (response.success) {
                if (response.status === "pending") {
                    
                    

                } else if (statusData.status === "generated") {
    
                } else if (statusData.status === "completed") {
    
                }
                res.status(200).json(response);
            } else {
                res.status(404).json({ success: false, message: "No status found for user." });
            }
        } catch (error) {
            console.error('Error checking user status:', error);
            res.status(500).json({ success: false, message: 'Internal server error while checking status.' });
        }
    } else {
        res.status(401).json({ success: false, message: 'User is not authenticated.' }); // Handle case where user is not authenticated
    }     
});

// SQS message API
router.post('/sqs-message', checkSQSMessage);

// External memes API
router.get('/external-memes', fetchMemes);

// Meme generator API
router.post('/meme-generator', meme_generator)

// File upload API with preSignedUrl
router.post('/image-url', checkAuthenticated, getPresignedUrl)

// API Route to get the list of user memes 
router.get('/my-memes', checkAuthenticated, memeController.meme_list);

// API Route to delete a meme
router.delete('/memes/:memeId', checkAuthenticated, memeController.meme_delete);

// API Route to create a meme
router.post('/memes', checkAuthenticated, memeController.meme_create);

module.exports = router;