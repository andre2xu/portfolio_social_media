const body_parser = require('body-parser');
const express = require('express');
const backend = express();

// config
backend.use(body_parser.json()); // for JSON request data
backend.use(body_parser.urlencoded({extended: true})); // for URL-encoded request data



backend.listen(8000);
