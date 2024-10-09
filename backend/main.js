const body_parser = require('body-parser');
const express = require('express');
const backend = express();

// CONFIG
backend.use(body_parser.json()); // for JSON request data
backend.use(body_parser.urlencoded({extended: true})); // for URL-encoded request data

// ROUTES
backend.post('/signup', (req, res) => {
    return res.json({});
});

backend.listen(8000);
