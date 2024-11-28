const { MongoClient } = require('mongodb');
const { createHash } = require('crypto');
const jwt = require('jsonwebtoken');
const body_parser = require('body-parser');
const multer = require('multer');
const cookie_parser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const backend = express();

try {
    // load environment variables for development but silently fail for production
    require('dotenv').config();
}
catch {}

// CONFIG
backend.use('/static', express.static('public')); // static folder that's publicly accessible via: [BACKEND_ORIGIN]/static/[SUBDIRECTORY]
backend.use(body_parser.json()); // for JSON request data
backend.use(body_parser.urlencoded({extended: true})); // for URL-encoded request data
backend.use(cookie_parser());
backend.use(cors({
    origin: ['http://localhost:3000'],
    optionsSuccessStatus: 200, // for legacy browsers
    credentials: true // allow HTTP-only cookies
}));

// HELPERS
const USER_PROFILE_UPLOADS_FOLDER = './public/users/profile';
const userProfileUploads = multer({dest: USER_PROFILE_UPLOADS_FOLDER});

const USER_POSTS_MEDIA_FOLDER = './public/users/posts';
const userPostsMedia = multer({dest: USER_POSTS_MEDIA_FOLDER});

function authenticateUser(req) {
    const RESULT = {
        isAuthenticated: false,
        tokenData: {}
    };

    const LOGIN_TOKEN = req.cookies.LT;

    try {
        if (LOGIN_TOKEN !== undefined) {
            RESULT.tokenData = jwt.verify(LOGIN_TOKEN, process.env.LTS);

            RESULT.isAuthenticated = true;
        }
    }
    catch {}

    return RESULT;
};

function generateLoginToken(res, uid) {
    const TOKEN_EXPIRATION = 60 * 60 * 2;

    const LOGIN_TOKEN = jwt.sign(
        {uid: uid},
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
            const UID = createHash('sha256').update(`${FORM_DATA.username}${HASHED_PASSWORD}${new Date().getMilliseconds()}`).digest('hex');

            await USERS_COLLECTION.insertOne({
                uid: UID,
                username: FORM_DATA.username,
                password: HASHED_PASSWORD,
                cover: '', // profile background cover file name
                pfp: '' // profile picture file name
            });

            generateLoginToken(res, UID);
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
                generateLoginToken(res, ACCOUNT.uid);

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

backend.get('/logout', async (req, res) => {
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        res.clearCookie('LT');
    }

    return res.json({});
});

backend.post('/auth', async (req, res) => {
    // NOTE: this route is used by React Router in the frontend to check if users are allowed to access a view. For backend authentication, just call the 'authenticateUser' helper

    return res.json({isAuthenticated: authenticateUser(req).isAuthenticated});
});

backend.get('/account/info/:username?', async (req, res) => {
    let response = {};
    let account = null;

    const USERS_COLLECTION = req.app.locals.db.collection('Users');

    if (req.params.username !== undefined && req.params.username.length > 0) {
        account = await USERS_COLLECTION.findOne({username: req.params.username});
    }
    else {
        const AUTHENTICATION_RESULT = authenticateUser(req);

        if (AUTHENTICATION_RESULT.isAuthenticated) {
            account = await USERS_COLLECTION.findOne({uid: AUTHENTICATION_RESULT.tokenData.uid});
        }
    }

    if (account !== null) {
        Object.keys(account).forEach((key) => {
            // remove irrelevant data
            if (key !== 'username' && key !== 'cover' && key !== 'pfp') {
                delete account[key];
            }

            response = account;
        });
    }

    return res.json(response);
});

backend.put('/account/update', userProfileUploads.fields([{name: 'cover', maxCount: 1}, {name: 'pfp', maxCount: 1}]), async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const FORM_TEXT_DATA = req.body;
        const FORM_FILE_DATA = req.files;

        // update user account data
        const USERS_COLLECTION = req.app.locals.db.collection('Users');
        const ACCOUNT = await USERS_COLLECTION.findOne({uid: AUTHENTICATION_RESULT.tokenData.uid});

        if (ACCOUNT !== null) {
            const NEW_DATA = {};

            // validate new username and queue for update if successful
            if (FORM_TEXT_DATA.newUsername.length > 0) {
                if (FORM_TEXT_DATA.newUsername.length > 20) {
                    RESPONSE.errorMessage = "Username cannot exceed 20 characters";
                }
                else {
                    NEW_DATA.username = FORM_TEXT_DATA.newUsername;
                }
            }

            // validate new password and queue for update if successful
            if (FORM_TEXT_DATA.newPassword.length > 0) {
                if (FORM_TEXT_DATA.newPassword.length < 8 || FORM_TEXT_DATA.newPassword > 30 || /[a-f]/.test(FORM_TEXT_DATA.newPassword) === false || /[A-F]/.test(FORM_TEXT_DATA.newPassword) === false || /[0-9]/.test(FORM_TEXT_DATA.newPassword) === false || /[\$\&\+\,\:\;\=\?\@\#\|\'\<\>\.\^\*\(\)\%\!\[\]\\\/]/.test(FORM_TEXT_DATA.newPassword) === false) {
                    RESPONSE.errorMessage = "Password must be 8-30 characters long and have a lowercase and uppercase letter, a digit, and a special character";
                }
                else {
                    NEW_DATA.password = createHash('sha256').update(FORM_TEXT_DATA.newPassword).digest('hex');;
                }
            }

            // queue file names of file uploads (if any)
            const UPLOADS = Object.keys(FORM_FILE_DATA);

            if (UPLOADS.length > 0) {
                for (let i=0; i < UPLOADS.length; i++) {
                    const FILE_DATA = FORM_FILE_DATA[UPLOADS[i]][0];

                    if (FILE_DATA.fieldname === 'cover') {
                        // delete old cover (if one exists)
                        if (ACCOUNT.cover.length > 0) {
                            fs.unlink(`${USER_PROFILE_UPLOADS_FOLDER}/${ACCOUNT.cover}`, () => {});
                        }

                        NEW_DATA.cover = FILE_DATA.filename;
                    }
                    else if (FILE_DATA.fieldname === 'pfp') {
                        // delete old profile picture (if one exists)
                        if (ACCOUNT.pfp.length > 0) {
                            fs.unlink(`${USER_PROFILE_UPLOADS_FOLDER}/${ACCOUNT.pfp}`, () => {});
                        }

                        NEW_DATA.pfp = FILE_DATA.filename;
                    }
                }
            }

            if (Object.keys(NEW_DATA).length > 0 && RESPONSE.errorMessage === undefined) {
                // update user account data
                await USERS_COLLECTION.updateOne(
                    {uid: AUTHENTICATION_RESULT.tokenData.uid},
                    {$set: NEW_DATA}
                );

                // pass relevant database info to frontend
                delete NEW_DATA['password'];

                RESPONSE.newData = NEW_DATA;
            }
        }
    }

    return res.json(RESPONSE);
});

backend.put('/account/remove', async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const DATA = req.body;

        if (DATA.type === 'profile') {
            const USERS_COLLECTION = req.app.locals.db.collection('Users');
            const ACCOUNT = await USERS_COLLECTION.findOne({uid: AUTHENTICATION_RESULT.tokenData.uid});

            if (ACCOUNT !== null) {
                switch (DATA.target) {
                    case 'cover':
                        if (ACCOUNT.cover.length > 0) {
                            fs.unlink(`${USER_PROFILE_UPLOADS_FOLDER}/${ACCOUNT.cover}`, () => {});

                            await USERS_COLLECTION.updateOne(
                                {uid: AUTHENTICATION_RESULT.tokenData.uid},
                                {$set: {cover: ''}}
                            );
                        }
                        else {
                            RESPONSE.errorMessage = "Cover doesn't exist";
                        }
                        break;
                    case 'pfp':
                        if (ACCOUNT.pfp.length > 0) {
                            fs.unlink(`${USER_PROFILE_UPLOADS_FOLDER}/${ACCOUNT.pfp}`, () => {});

                            await USERS_COLLECTION.updateOne(
                                {uid: AUTHENTICATION_RESULT.tokenData.uid},
                                {$set: {pfp: ''}}
                            );
                        }
                        else {
                            RESPONSE.errorMessage = "Profile picture doesn't exist";
                        }
                        break;
                    default:
                }
            }
        }
    }

    return res.json(RESPONSE);
});

backend.delete('/account/delete', async (req, res) => {
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const USERS_COLLECTION = req.app.locals.db.collection('Users');
        const POSTS_COLLECTION = req.app.locals.db.collection('Posts');

        const FILTER = {uid: AUTHENTICATION_RESULT.tokenData.uid};

        // get static files linked to user & remove them from the server
        const USER_INFO = await USERS_COLLECTION.findOne(FILTER);
        const USER_POSTS = await POSTS_COLLECTION.find(FILTER).toArray();

        fs.unlink(`${USER_PROFILE_UPLOADS_FOLDER}/${USER_INFO.pfp}`, () => {});
        fs.unlink(`${USER_PROFILE_UPLOADS_FOLDER}/${USER_INFO.cover}`, () => {});

        if (USER_POSTS.length > 0) {
            USER_POSTS.forEach((postData) => {
                if (postData.media.length > 0) {
                    fs.unlink(`${USER_POSTS_MEDIA_FOLDER}/${postData.media[0].src}`, () => {});
                }
            });
        }

        // delete user data
        await USERS_COLLECTION.deleteOne(FILTER);
        await POSTS_COLLECTION.deleteMany(FILTER);

        res.clearCookie('LT');
    }

    return res.json({});
});

backend.post('/post', userPostsMedia.fields([{name: 'postMedia', maxCount: 1}]), async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        let valid_post = true;
        const BODY_CHARACTER_LIMIT = 500;

        const BODY = req.body.postBody;
        const TAGS = req.body.postTags;

        if (BODY === undefined || BODY.length === 0) {
            RESPONSE.errorMessage = "Post body missing";
            valid_post = false;
        }
        else if (BODY !== undefined && BODY.length > BODY_CHARACTER_LIMIT) {
            RESPONSE.errorMessage = `Only ${BODY_CHARACTER_LIMIT} characters are allowed for the body`;
            valid_post = false;
        }
        else if (TAGS === undefined || TAGS.length === 0) {
            RESPONSE.errorMessage = "Post tags missing";
            valid_post = false;
        }

        if (valid_post) {
            let tags = TAGS.trim();
            tags = tags.replace(/\s/g, '');

            const CURRENT_DATE = new Date();
            let day = CURRENT_DATE.getDate();
            let month = CURRENT_DATE.getMonth() + 1;
            let year = CURRENT_DATE.getFullYear();

            if (day.length === 1) {
                day = `0${day}`;
            }

            if (month.length === 1) {
                month = `0${month}`;
            }

            const POST_DATA = {
                pid: createHash('sha256').update(`${AUTHENTICATION_RESULT.tokenData.uid}${BODY}${new Date().getMilliseconds()}`).digest('hex'),
                uid: AUTHENTICATION_RESULT.tokenData.uid,
                body: BODY,
                tags: tags.split(','),
                media: [], // [{src: 'filename': type: 'image/video'}, ...]
                date: `${day}/${month}/${year}`,
                likes: [] // list of uids
            };

            if (req.files.postMedia !== undefined) {
                // validate & save media

                const MEDIA = req.files.postMedia;
                const VALID_EXTENSIONS = ['png', 'jpg', 'jpeg', 'mp4'];
                const VALID_MIME_TYPES = ['image', 'video'];

                const IS_VALID_MEDIA = MEDIA.every((file) => {
                    const EXTENSION = file.originalname.split('.').pop();
                    const MIME_TYPE = file.mimetype.split('/')[0];

                    return VALID_EXTENSIONS.includes(EXTENSION) && VALID_MIME_TYPES.includes(MIME_TYPE);
                });

                if (IS_VALID_MEDIA) {
                    MEDIA.forEach((file) => {
                        POST_DATA.media.push({src: file.filename, type: file.mimetype.split('/')[0]});
                    });
                }
            }

            const POSTS_COLLECTION = req.app.locals.db.collection('Posts');
            await POSTS_COLLECTION.insertOne(POST_DATA);
        }
    }

    return res.json(RESPONSE);
});

backend.get('/post/:username?', async (req, res) => {
    // NOTE: usernames should only be passed when retrieving user posts for a public page (i.e. a page that doesn't require a login token) as this approach is costly

    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    let uid = undefined;

    if (req.params.username !== undefined && req.params.username.length > 0) {
        const USERS_COLLECTION = req.app.locals.db.collection('Users');

        const ACCOUNT = await USERS_COLLECTION.findOne({username: req.params.username});

        if (ACCOUNT !== null) {
            uid = ACCOUNT.uid;
        }
    }

    if (AUTHENTICATION_RESULT.isAuthenticated && uid === undefined) {
        uid = AUTHENTICATION_RESULT.tokenData.uid;
    }

    if (uid !== undefined) {
        const POSTS_COLLECTION = req.app.locals.db.collection('Posts');
        const USER_POSTS = await POSTS_COLLECTION.find({uid: uid}, {projection: {_id: 0, uid: 0}}).toArray();

        if (USER_POSTS.length > 0) {
            RESPONSE.posts = USER_POSTS;
        }
    }

    return res.json(RESPONSE);
});

backend.delete('/post/:pid', async (req, res) => {
    const RESPONSE = {status: 'failed'};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const POSTS_COLLECTION = req.app.locals.db.collection('Posts');
        const FILTER = {uid: AUTHENTICATION_RESULT.tokenData.uid, pid: req.params.pid};

        const POST_DATA = await POSTS_COLLECTION.findOne(FILTER);

        if (POST_DATA !== null) {
            // delete media stored in server (if any)
            if (POST_DATA.media.length > 0) {
                POST_DATA.media.forEach((file) => {
                    fs.unlink(`${USER_POSTS_MEDIA_FOLDER}/${file.src}`, () => {});
                });
            }

            await POSTS_COLLECTION.deleteOne(FILTER);

            RESPONSE.status = 'success';
        }
    }

    res.json(RESPONSE);
});

backend.put('/post/like', async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated && req.body.pid !== undefined) {
        const POSTS_COLLECTION = req.app.locals.db.collection('Posts');
        const ALREADY_LIKED = await POSTS_COLLECTION.findOne({pid: req.body.pid, likes: AUTHENTICATION_RESULT.tokenData.uid}) !== null;

        if (ALREADY_LIKED) {
            // remove like

            await POSTS_COLLECTION.updateOne(
                {pid: req.body.pid},
                {$pull: {likes: AUTHENTICATION_RESULT.tokenData.uid}}
            );

            RESPONSE.action = 'removed';
        }
        else {
            // add like

            await POSTS_COLLECTION.updateOne(
                {pid: req.body.pid},
                {$push: {likes: AUTHENTICATION_RESULT.tokenData.uid}}
            );

            RESPONSE.action = 'added';
        }

        // get number of likes
        const LIKES_COUNT = await POSTS_COLLECTION.aggregate([{$project: {_id: 0, likes: {$size: '$likes'}}}]).toArray();

        RESPONSE.count = LIKES_COUNT[0].likes;
    }

    res.json(RESPONSE);
});

// INITIALIZATION
backend.listen(8010, async () => {
    // connect to database & store the connection in a shared variable
    const MONGO_CLIENT = new MongoClient(process.env.MONGO_CLUSTER_URI);

    await MONGO_CLIENT.connect();

    backend.locals.db = MONGO_CLIENT.db('socialmedia'); // accessible in routes via `req.app.locals.db`
});
