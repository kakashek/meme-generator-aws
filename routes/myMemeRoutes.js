const express = require('express');
const router = express.Router();
const { checkAuthenticated } = require('../middleware/authMiddleware');
const path = require('path');


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', process.env.EFS_PAGES_PATH || 'efs/pages', 'my-memes.html'));
});


module.exports = router;
