const { MongoClient } = require('mongodb');
const { createHash } = require('crypto');
const jwt = require('jsonwebtoken');
const body_parser = require('body-parser');
const multer = require('multer');
const cookie_parser = require('cookie-parser');
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
backend.use(cookie_parser());
backend.use(cors({
    origin: ['http://localhost:3000'],
    optionsSuccessStatus: 200, // for legacy browsers
    credentials: true // allow HTTP-only cookies
}));

// HELPERS
const userProfileUploads = multer({dest: './public/users/profile'});

function authenticateUser(req) {
    let is_authenticated = false;

    const LOGIN_TOKEN = req.cookies.LT;

    try {
        if (LOGIN_TOKEN !== undefined) {
            jwt.verify(LOGIN_TOKEN, process.env.LTS);

            is_authenticated = true;
        }
    }
    catch {}

    return is_authenticated;
};

// ROUTES
backend.post('/signup', async (req, res) => {
    const RESPONSE = {};
    const FORM_DATA = req.body;

    if (FORM_DATA.username.length > 0 && FORM_DATA.password.length > 0 && FORM_DATA.confirmPassword.length > 0) {
        // validate username
        if (FORM_DATA.username.length > 20) {
            RESPONSE.errorMessage = "Username cannot exceed 20 characters";
        }

        // validate password
        if (FORM_DATA.password.length < 8 || FORM_DATA.password > 30 || /[a-f]/.test(FORM_DATA.password) === false || /[A-F]/.test(FORM_DATA.password) === false || /[0-9]/.test(FORM_DATA.password) === false || /[\$\&\+\,\:\;\=\?\@\#\|\'\<\>\.\^\*\(\)\%\!\[\]\\\/]/.test(FORM_DATA.password) === false) {
            RESPONSE.errorMessage = "Password must be 8-30 characters long and have a lowercase and uppercase letter, a digit, and a special character";
        }

        if (FORM_DATA.password !== FORM_DATA.confirmPassword) {
            RESPONSE.errorMessage = "Both passwords must match";
        }

        // create account
        const USERS_COLLECTION = req.app.locals.db.collection('Users');

        if (await USERS_COLLECTION.findOne({username: FORM_DATA.username}) === null) {
            const HASHED_PASSWORD = createHash('sha256').update(FORM_DATA.password).digest('hex');

            await USERS_COLLECTION.insertOne({
                username: FORM_DATA.username,
                password: HASHED_PASSWORD,
                cover: '', // path to profile background cover
                pfp: '' // path to profile picture
            });

            const TOKEN_EXPIRATION = 60 * 60 * 2;

            const LOGIN_TOKEN = jwt.sign(
                {uid: FORM_DATA.username},
                process.env.LTS,
                {expiresIn: TOKEN_EXPIRATION}
            );

            res.cookie(
                'LT',
                LOGIN_TOKEN,
                {
                    maxAge: TOKEN_EXPIRATION * 1000,
                    httpOnly: true,
                    sameSite: true,
                    secure: true
                }
            );
        }
        else {
            RESPONSE.errorMessage = "That username is already taken";
        }

        return res.json(RESPONSE);
    }
    else {
        RESPONSE.errorMessage = "Fields cannot be empty";
    }

    return res.json(RESPONSE);
});

backend.post('/login', async (req, res) => {
    const RESPONSE = {};
    const FORM_DATA = req.body;

    if (FORM_DATA.username.length > 0 && FORM_DATA.password.length > 0) {
        const USERS_COLLECTION = req.app.locals.db.collection('Users');
        const ACCOUNT = await USERS_COLLECTION.findOne({username: FORM_DATA.username});

        if (ACCOUNT !== null) {
            const HASHED_PASSWORD = createHash('sha256').update(FORM_DATA.password).digest('hex');

            if (HASHED_PASSWORD === ACCOUNT.password) {
                const TOKEN_EXPIRATION = 60 * 60 * 2;

                const LOGIN_TOKEN = jwt.sign(
                    {uid: FORM_DATA.username},
                    process.env.LTS,
                    {expiresIn: TOKEN_EXPIRATION}
                );

                res.cookie(
                    'LT',
                    LOGIN_TOKEN,
                    {
                        maxAge: TOKEN_EXPIRATION * 1000,
                        httpOnly: true,
                        sameSite: true,
                        secure: true
                    }
                );

                return res.json(RESPONSE);
            }
        }

        RESPONSE.errorMessage = "Invalid credentials";
    }
    else {
        RESPONSE.errorMessage = "Fields cannot be empty";
    }

    return res.json(RESPONSE);
});

backend.post('/auth', async (req, res) => {
    // NOTE: this route is used by React Router in the frontend to check if users are allowed to access a view. For backend authentication, just call the 'authenticateUser' helper

    return res.json({isAuthenticated: authenticateUser(req)});
});

backend.put('/account/update', userProfileUploads.fields([{name: 'cover', maxCount: 1}, {name: 'pfp', maxCount: 1}]), async (req, res) => {
    const RESPONSE = {status: 'failed'};

    if (authenticateUser(req)) {
        const FORM_TEXT_DATA = req.body;
        const FORM_FILE_DATA = req.files;
    }

    res.json(RESPONSE);
});

backend.listen(8010, async () => {
    // connect to database & store the connection in a shared variable
    const MONGO_CLIENT = new MongoClient(process.env.MONGO_CLUSTER_URI);

    await MONGO_CLIENT.connect();

    backend.locals.db = MONGO_CLIENT.db('socialmedia'); // accessible in routes via `req.app.locals.db`
});
