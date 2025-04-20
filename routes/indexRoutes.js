const express = require('express');
const router = express.Router();
const path = require('path');
const { googleCallback, checkAuthenticated } = require('../middleware/authMiddleware');

// Mainpage route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', process.env.EFS_PAGES_PATH || 'efs/pages', 'home.html'));
});

// Admin mainpage route
router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', process.env.EFS_PAGES_PATH || 'efs/pages', 'admin-home.html'));
});

// Google callback route
router.get('/callback', googleCallback);

// Callback success route
router.get('/callback-success', (req, res) => {
    res.sendFile(path.join(__dirname, '..', process.env.EFS_PAGES_PATH || 'efs/pages', 'callback-success.html'));
});

// Health check route
router.get('/health', (req, res) => {
    res.status(200).send('OK');
});


module.exports = router;