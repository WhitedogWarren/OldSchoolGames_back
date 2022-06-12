const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');

const userCtrl = require ('../controllers/users');

router.get('/me', auth, userCtrl.getAuthStatus);

module.exports = router;