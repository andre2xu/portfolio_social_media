const { MongoClient } = require('mongodb');
const body_parser = require('body-parser');
const cors = require('cors');
const express = require('express');
const backend = express();

try {
    // load environment variables for development but silently fail for production
    require('dotenv').config();
}
catch {}

// CONFIG
backend.use(body_parser.json()); // for JSON request data
backend.use(body_parser.urlencoded({extended: true})); // for URL-encoded request data
backend.use(cors({
    origin: ['http://localhost:3000'],
    optionsSuccessStatus: 200 // for legacy browsers
}));

// ROUTES
backend.post('/signup', (req, res) => {
    return res.json({});
});

backend.listen(8000, async function () {
    // connect to database & store the connection in a shared variable
    const MONGO_CLIENT = new MongoClient(process.env.MONGO_CLUSTER_URI);

    await MONGO_CLIENT.connect();

    backend.locals.db = MONGO_CLIENT.db('Portfolio'); // accessible in routes via `req.app.locals.db`
});
