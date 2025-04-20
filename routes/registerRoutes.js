const express = require('express');
const { registerCheck, confirmEmailCheck, adminRegister } = require('../middleware/registerMiddleware');
const router = express.Router();
const path = require('path');


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', process.env.EFS_PAGES_PATH || 'efs/pages', 'register.html'));
});

// Route to handle registration
router.post('/', registerCheck);   

// Route to handle email confirmation
router.post('/confirm', confirmEmailCheck);

// Route to handle registration
router.post('/admin', adminRegister); 

module.exports = router;