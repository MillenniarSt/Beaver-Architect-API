const express = require('express');
const { getAll } = require('../database');
const { success } = require('./util');
const router = express.Router()

router.get('/file-editors', (req, res) => {
    getAll('settings', {}, res, (settings) => success(res, settings[0].file_editors))
})

module.exports = router;