const express = require('express');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');

const router = express.Router();
const csrfProtection = csurf({ cookie: true });

router.use(cookieParser()); // Mount cookie-parser middleware first
// router.use(csrfProtection); // Then mount csurf middleware

router.get('/csrf-token', (req, res) => {
    const csrftoken = req.csrfToken()
    res.cookie('XSRF-TOKEN', csrftoken);
    console.log("excuting cookie ", csrftoken);
    res.json({ csrfToken: csrftoken });
});

module.exports = router;
