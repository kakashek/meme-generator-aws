const express = require('express');
const { checkAuthenticated, passwordChange } = require('../middleware/authMiddleware');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', process.env.EFS_PAGES_PATH || 'efs/pages', 'login.html'));   
});

router.get('/password-change', (req, res) => {
    res.sendFile(path.join(__dirname, '..', process.env.EFS_PAGES_PATH || 'efs/pages', 'password-change.html'));   
});

router.post('/password-change', passwordChange);

module.exports = router;