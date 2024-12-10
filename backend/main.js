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
        const COMMENTS_COLLECTION = req.app.locals.db.collection('Comments');
        const FOLLOWERS_COLLECTION = req.app.locals.db.collection('Followers');

        const FILTER = {uid: AUTHENTICATION_RESULT.tokenData.uid};

        // delete the user's like from posts (if any)
        await POSTS_COLLECTION.updateMany(
            {},
            {$pull: {likes: AUTHENTICATION_RESULT.tokenData.uid}}
        );

        // delete the user's comments in posts (if any)
        await COMMENTS_COLLECTION.deleteMany(FILTER);

        // delete followers & following
        await FOLLOWERS_COLLECTION.deleteMany({$or: [FILTER, {fid: AUTHENTICATION_RESULT.tokenData.uid}]});

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
                date: `${day}/${month}/${year}`, // for the frontend
                timestamp: new Date().toISOString(), // for the backend
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
        const USER_POSTS = await POSTS_COLLECTION.aggregate([
            {
                $match: {uid: uid} // get only the posts of the given user
            },
            {
                $lookup: {
                    from: 'Comments',
                    localField: 'pid',
                    foreignField: 'pid',
                    as: 'comments'
                }
            },
            {
                $addFields: {
                    comments: {$size: '$comments'} // include no. comments in final result
                }
            },
            {
                $project: {
                    pid: 1,
                    body: 1,
                    tags: 1,
                    media: 1,
                    date: 1,
                    likes: 1,
                    comments: 1
                }
            },
            {$unset: '_id'} // exclude from final result
        ]).toArray();

        if (USER_POSTS.length > 0) {
            RESPONSE.posts = USER_POSTS;

            // get id of posts liked by the current user that's logged in
            if (AUTHENTICATION_RESULT.isAuthenticated) {
                const LOGGED_IN_USER = AUTHENTICATION_RESULT.tokenData.uid; // this can also be the 'uid' variable but I did it like this just to be 100% sure it's the user that's logged in

                const LIKED_POSTS = [];

                USER_POSTS.forEach((postData) => {
                    if (postData.likes.includes(LOGGED_IN_USER)) {
                        LIKED_POSTS.push(postData.pid);
                    }
                });

                if (LIKED_POSTS.length > 0) {
                    RESPONSE.likedPosts = LIKED_POSTS;
                }
            }
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

            // delete comments (if any)
            const COMMENTS_COLLECTION = req.app.locals.db.collection('Comments');
            await COMMENTS_COLLECTION.deleteMany({pid: req.params.pid});

            // delete the post itself
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
        const LIKES_COUNT = await POSTS_COLLECTION.aggregate([
            {$match: {pid: req.body.pid}},
            {
                $project: {
                    _id: 0,
                    likes: {$size: '$likes'}
                }
            }
        ]).toArray();

        RESPONSE.count = LIKES_COUNT[0].likes;
    }

    res.json(RESPONSE);
});

backend.get('/comments/:pid', async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const POSTS_COLLECTION = req.app.locals.db.collection('Posts');
        const POST_DATA = await POSTS_COLLECTION.findOne({pid: req.params.pid}, {projection: {_id: 0}});

        if (POST_DATA !== null) {
            const USERS_COLLECTION = req.app.locals.db.collection('Users');
            const COMMENTS_COLLECTION = req.app.locals.db.collection('Comments');

            // retrieve data about poster
            const USER_INFO = await USERS_COLLECTION.findOne({uid: POST_DATA.uid}, {projection: {_id: 0, uid: 0, password: 0}});

            if (USER_INFO !== null) {
                delete POST_DATA['uid']; // remove sensitive information

                RESPONSE.postData = POST_DATA;
                RESPONSE.userData = USER_INFO;

                // check if the user that's logged in has liked the post
                if (POST_DATA.likes.includes(AUTHENTICATION_RESULT.tokenData.uid)) {
                    RESPONSE.postData.likedByUser = true;
                }
            }

            // retrieve comments data
            const COMMENTS = await COMMENTS_COLLECTION.aggregate([
                {
                    $match: {pid: req.params.pid} // get only the comments for the given post
                },
                {
                    // find the user account data of each commenter
                    $lookup: {
                        from: 'Users',
                        localField: 'uid',
                        foreignField: 'uid',
                        as: 'user'
                    }
                },
                {$unwind: '$user'}, // store lookup result in the '$user' object
                {
                    // ensure that all the fields required by the frontend are set to 1 so that they appear in the result
                    $project: {
                        cid: 1,
                        comment: 1,
                        date: 1,
                        likes: 1,
                        dislikes: 1,
                        username: '$user.username',
                        pfp: '$user.pfp'
                    }
                },
                {$unset: '_id'} // exclude from final result
            ]).toArray();

            RESPONSE.comments = COMMENTS;

            // check which comments were sent and which ones were liked/disliked by the user that's logged in
            const LOGGED_IN_USER_INFO = await USERS_COLLECTION.findOne({uid: AUTHENTICATION_RESULT.tokenData.uid});

            if (LOGGED_IN_USER_INFO !== null) {
                COMMENTS.forEach((comment) => {
                    if (LOGGED_IN_USER_INFO.username === comment.username) {
                        comment.ownedByUser = true; // add a flag to show this comment was posted by the user that's logged in
                    }

                    // add a flag to show this comment was liked/disliked by the user that's logged in
                    if (comment.likes.includes(LOGGED_IN_USER_INFO.uid)) {
                        comment.likedByUser = true;
                    }
                    else if (comment.dislikes.includes(LOGGED_IN_USER_INFO.uid)) {
                        comment.dislikedByUser = true;
                    }
                });
            }
        }
    }

    return res.json(RESPONSE);
});

backend.post('/comments/:pid', async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const COMMENTS_COLLECTION = req.app.locals.db.collection('Comments');

        // save comment to database
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

        const FORMATTED_DATE = `${day}/${month}/${year}`;
        const COMMENT_ID = createHash('sha256').update(`${req.params.pid}${AUTHENTICATION_RESULT.tokenData.uid}${req.body.replyBody}${FORMATTED_DATE}${CURRENT_DATE.getMilliseconds()}`).digest('hex');

        await COMMENTS_COLLECTION.insertOne({
            cid: COMMENT_ID,
            pid: req.params.pid,
            uid: AUTHENTICATION_RESULT.tokenData.uid,
            comment: req.body.replyBody,
            date: FORMATTED_DATE,
            likes: [],
            dislikes: []
        });

        // get user data of commenter
        const USERS_COLLECTION = req.app.locals.db.collection('Users');
        const USER_INFO = await USERS_COLLECTION.findOne({uid: AUTHENTICATION_RESULT.tokenData.uid});

        // generate response data
        if (USER_INFO !== null) {
            Object.keys(USER_INFO).forEach((data) => {
                if (data !== 'username' && data !== 'pfp') {
                    delete USER_INFO[data]; // remove unnecessary or sensitive data
                }
            });

            RESPONSE.userData = USER_INFO;

            RESPONSE.commentData = {
                cid: COMMENT_ID,
                comment: req.body.replyBody,
                date: FORMATTED_DATE,
                ownedByUser: true,
                likes: [],
                dislikes: []
            };
        }
    }

    return res.json(RESPONSE);
});

backend.delete('/comments/:cid', async (req, res) => {
    const RESPONSE = {status: 'failed'};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const COMMENTS_COLLECTION = req.app.locals.db.collection('Comments');

        await COMMENTS_COLLECTION.deleteOne({cid: req.params.cid});

        RESPONSE.status = 'success';
    }

    return res.json(RESPONSE);
});

backend.put('/comments/like', async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const COMMENTS_COLLECTION = req.app.locals.db.collection('Comments');
        const ALREADY_LIKED = await COMMENTS_COLLECTION.findOne({cid: req.body.cid, likes: AUTHENTICATION_RESULT.tokenData.uid}) !== null;

        if (ALREADY_LIKED) {
            // remove like

            await COMMENTS_COLLECTION.updateOne(
                {cid: req.body.cid},
                {$pull: {likes: AUTHENTICATION_RESULT.tokenData.uid}}
            );

            RESPONSE.action = 'removed';
        }
        else {
            // add like & remove dislike if it exists

            await COMMENTS_COLLECTION.updateOne(
                {cid: req.body.cid},
                {
                    $push: {likes: AUTHENTICATION_RESULT.tokenData.uid},
                    $pull: {dislikes: AUTHENTICATION_RESULT.tokenData.uid}
                }
            );

            RESPONSE.action = 'added';
        }

        // get number of likes
        const LIKES_COUNT = await COMMENTS_COLLECTION.aggregate([
            {$match: {cid: req.body.cid}},
            {
                $project: {
                    _id: 0,
                    likes: {$size: '$likes'}
                }
            }
        ]).toArray();

        RESPONSE.count = LIKES_COUNT[0].likes;
    }

    return res.json(RESPONSE);
});

backend.put('/comments/dislike', async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const COMMENTS_COLLECTION = req.app.locals.db.collection('Comments');
        const ALREADY_DISLIKED = await COMMENTS_COLLECTION.findOne({cid: req.body.cid, dislikes: AUTHENTICATION_RESULT.tokenData.uid}) !== null;

        if (ALREADY_DISLIKED) {
            // remove dislike

            await COMMENTS_COLLECTION.updateOne(
                {cid: req.body.cid},
                {$pull: {dislikes: AUTHENTICATION_RESULT.tokenData.uid}}
            );

            RESPONSE.action = 'removed';
        }
        else {
            // add dislike & remove like if it exists

            await COMMENTS_COLLECTION.updateOne(
                {cid: req.body.cid},
                {
                    $push: {dislikes: AUTHENTICATION_RESULT.tokenData.uid},
                    $pull: {likes: AUTHENTICATION_RESULT.tokenData.uid}
                }
            );

            RESPONSE.action = 'added';
        }

        // get number of dislikes
        const DISLIKES_COUNT = await COMMENTS_COLLECTION.aggregate([
            {$match: {cid: req.body.cid}},
            {
                $project: {
                    _id: 0,
                    dislikes: {$size: '$dislikes'}
                }
            }
        ]).toArray();

        RESPONSE.count = DISLIKES_COUNT[0].dislikes;
    }

    return res.json(RESPONSE);
});

backend.get('/followers/:username', async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const USERS_COLLECTION = req.app.locals.db.collection('Users');
        const USER_INFO = await USERS_COLLECTION.findOne({username: req.params.username});

        if (USER_INFO !== null) {
            const FOLLOWERS_COLLECTION = req.app.locals.db.collection('Followers');
            const FOLLOWERS = await FOLLOWERS_COLLECTION.find({uid: USER_INFO.uid}, {projection: {_id: 0, uid: 0}}).toArray();
            const FOLLOWER_IDS = [];

            if (FOLLOWERS.length > 0) {
                FOLLOWERS.forEach((followerData) => {
                    // check if the user that's logged in is following the user being queried
                    if (followerData.fid === AUTHENTICATION_RESULT.tokenData.uid) {
                        RESPONSE.followedByUser = true;
                    }

                    FOLLOWER_IDS.push(followerData.fid);
                });

                const FOLLOWER_ACCOUNTS = await USERS_COLLECTION.find({uid: {$in: FOLLOWER_IDS}}, {projection: {_id: 0, username: 1, pfp: 1}}).toArray();

                RESPONSE.followers = FOLLOWER_ACCOUNTS;
            }
        }
    }

    return res.json(RESPONSE);
});

backend.post('/follow', async (req, res) => {
    const RESPONSE = {status: 'failed'};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const USERS_COLLECTION = req.app.locals.db.collection('Users');
        const USER_INFO = await USERS_COLLECTION.findOne({username: req.body.username});
        const LOGGED_IN_USER_INFO = await USERS_COLLECTION.findOne({uid: AUTHENTICATION_RESULT.tokenData.uid});

        if (USER_INFO !== null && USER_INFO.uid !== LOGGED_IN_USER_INFO.uid) {
            const FOLLOWERS_COLLECTION = req.app.locals.db.collection('Followers');

            await FOLLOWERS_COLLECTION.insertOne({
                uid: USER_INFO.uid, // user being followed by logged in user
                fid: LOGGED_IN_USER_INFO.uid // logged in user
            });

            RESPONSE.status = 'success';

            RESPONSE.followerAdded = {
                username: LOGGED_IN_USER_INFO.username,
                pfp: LOGGED_IN_USER_INFO.pfp
            };
        }
    }

    return res.json(RESPONSE);
});

backend.delete('/follow/:username', async (req, res) => {
    const RESPONSE = {status: 'failed'};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const USERS_COLLECTION = req.app.locals.db.collection('Users');
        const USER_INFO = await USERS_COLLECTION.findOne({username: req.params.username});
        const LOGGED_IN_USER_INFO = await USERS_COLLECTION.findOne({uid: AUTHENTICATION_RESULT.tokenData.uid});

        if (USER_INFO !== null) {
            const FOLLOWERS_COLLECTION = req.app.locals.db.collection('Followers');

            await FOLLOWERS_COLLECTION.deleteOne({
                uid: USER_INFO.uid, // user being unfollowed by logged in user
                fid: LOGGED_IN_USER_INFO.uid // logged in user
            });

            RESPONSE.status = 'success';

            RESPONSE.followerRemoved = {
                username: LOGGED_IN_USER_INFO.username,
                pfp: LOGGED_IN_USER_INFO.pfp
            };
        }
    }

    return res.json(RESPONSE);
});

backend.get('/following/:username', async (req, res) => {
    const RESPONSE = {};
    const AUTHENTICATION_RESULT = authenticateUser(req);

    if (AUTHENTICATION_RESULT.isAuthenticated) {
        const USERS_COLLECTION = req.app.locals.db.collection('Users');
        const USER_INFO = await USERS_COLLECTION.findOne({username: req.params.username});

        if (USER_INFO !== null) {
            const FOLLOWERS_COLLECTION = req.app.locals.db.collection('Followers');

            const FOLLOWING = await FOLLOWERS_COLLECTION.aggregate([
                {$match: {fid: USER_INFO.uid}}, // get all the documents where the given user is the follower
                {
                    // find all the accounts of the users being followed
                    $lookup: {
                        from: 'Users',
                        localField: 'uid',
                        foreignField: 'uid',
                        as: 'user'
                    }
                },
                {$unwind: '$user'}, // store each result of the lookup in an object
                {
                    // include only the following fields in the final result
                    $project: {
                        username: '$user.username',
                        pfp: '$user.pfp'
                    }
                },
                {$unset: '_id'} // exclude this from the final result
            ]).toArray();

            RESPONSE.following = FOLLOWING;
        }
    }

    return res.json(RESPONSE);
});

backend.get('/explore', async (req, res) => {
    const RESPONSE = {};

    const POSTS_COLLECTION = req.app.locals.db.collection('Posts');

    const LATEST_POSTS = await POSTS_COLLECTION.aggregate([
        {$match: {tags: 'explore'}}, // get only the posts that have the 'explore' tag
        {$sort: {timestamp: -1}}, // put the latest posts at the start
        {$limit: 2000}, // reduce data set
        {
            // get the account data of every poster
            $lookup: {
                from: 'Users',
                localField: 'uid',
                foreignField: 'uid',
                as: 'user'
            }
        },
        {$unwind: '$user'}, // store each result of the account lookup in an object
        {
            // get the comments of every post (NOTE: don't unwind so that the total count can be calculated with '$size')
            $lookup: {
                from: 'Comments',
                localField: 'uid',
                foreignField: 'uid',
                as: 'comments'
            }
        },
        {
            // include only the following fields in the final result
            $project: {
                pid: 1,
                body: 1,
                tags: 1,
                media: 1,
                date: 1,
                likes: 1,
                comments: {$size: '$comments'},
                username: '$user.username',
                pfp: '$user.pfp'
            }
        },
        {$unset: '_id'} // exclude this from the final result
    ]).toArray();

    // check if a logged-in user is making the request and find which posts they've liked
    let uid_of_user_logged_in = undefined;

    if (req.cookies.LT !== undefined) {
        uid_of_user_logged_in = authenticateUser(req).tokenData.uid;
    }

    if (uid_of_user_logged_in !== undefined) {
        // use a two pointer loop to quickly find the posts that were liked by the logged-in user
        let i = 0;
        let j = LATEST_POSTS.length - 1;

        while (i <= j) {
            const USER_LIKED_LPOST = LATEST_POSTS[i].likes.includes(uid_of_user_logged_in);

            if (USER_LIKED_LPOST) {
                LATEST_POSTS[i].likedByUser = true;
            }

            if (i != j) {
                const USER_LIKED_RPOST = LATEST_POSTS[j].likes.includes(uid_of_user_logged_in);

                if (USER_LIKED_RPOST) {
                    LATEST_POSTS[j].likedByUser = true;
                }
            }

            i++;
            j--;
        }
    }

    RESPONSE.posts = LATEST_POSTS;

    return res.json(RESPONSE);
});

backend.get('/explore/:query', async (req, res) => {
    const RESPONSE = {};
    let search_query = req.params.query;

    const TOKENS = search_query.split(/\s/);

    if (TOKENS.length > 0) {
        const TAGS = [];
        const WORD_SEQUENCES = [];

        let sequence_of_words = '';

        for (let i=0; i < TOKENS.length; i++) {
            const TOKEN = TOKENS[i];

            if (TOKEN[0] === '#') {
                // save tag or tag substring
                TAGS.push(new RegExp(TOKEN.substring(1)));

                // a tag or tag substring has been found so save the current sequence of words
                if (sequence_of_words.length > 0) {
                    WORD_SEQUENCES.push(new RegExp(sequence_of_words));

                    // reset sequence
                    sequence_of_words = '';
                }
            }
            else {
                // build sequence of words
                sequence_of_words += TOKEN;
            }
        }

        // save remaining sequence of words (if any)
        if (sequence_of_words.length > 0) {
            WORD_SEQUENCES.push(sequence_of_words);
        }

        // find the latest posts that either have the tags (or tag substrings) given, or contain the word sequences given
        const POSTS_COLLECTION = req.app.locals.db.collection('Posts');
        const RESULT = await POSTS_COLLECTION.aggregate([
            {
                $match: {
                    $or: [
                        {tags: {$in: TAGS}},
                        {body: {$in: WORD_SEQUENCES}}
                    ]
                }
            },
            {$sort: {timestamp: -1}},
            {$limit: 2000},
            {
                $lookup: {
                    from: 'Users',
                    localField: 'uid',
                    foreignField: 'uid',
                    as: 'user'
                }
            },
            {$unwind: '$user'},
            {
                $lookup: {
                    from: 'Comments',
                    localField: 'uid',
                    foreignField: 'uid',
                    as: 'comments'
                }
            },
            {
                $project: {
                    pid: 1,
                    body: 1,
                    tags: 1,
                    media: 1,
                    date: 1,
                    likes: 1,
                    comments: {$size: '$comments'},
                    username: '$user.username',
                    pfp: '$user.pfp'
                }
            },
            {$unset: '_id'}
        ]).toArray();

        if (RESULT.length > 0) {
            RESPONSE.result = RESULT;
        }
    }

    return res.json(RESPONSE);
});

backend.get('/search/:query', async (req, res) => {
    const RESPONSE = {};
    const SEARCH_QUERY = req.params.query;

    let search_found = false;

    /*
    ALGORITHM:
    For tag and user searches, only the first token of the search query is used.
    The algorithm checks if it has a # or @ symbol as its first character and
    then it uses that symbol to determine what type of search to perform.

    If the search is neither for a tag or a user, then the algorithm will
    use the entire search query (i.e. all tokens) to find the post(s) that
    contains it.

    The search strategies are given below.
    */
    const TOKENS = SEARCH_QUERY.split(/\s/);

    if (TOKENS.length > 0) {
        const FIRST_TOKEN = TOKENS[0];

        if (FIRST_TOKEN.length > 1) {
            const KEYWORD = FIRST_TOKEN.substring(1);

            if (FIRST_TOKEN[0] === '#') {
                // SEARCH STRATEGY: get 5 of the most recent posts with tags that have the first token's keyword as a substring

                const POSTS_COLLECTION = req.app.locals.db.collection('Posts');

                const RESULT = await POSTS_COLLECTION.aggregate([
                    {$match: {tags: new RegExp(KEYWORD)}},
                    {$sort: {timestamp: -1}},
                    {$limit: 5},
                    {
                        $lookup: {
                            from: 'Users',
                            localField: 'uid',
                            foreignField: 'uid',
                            as: 'user'
                        }
                    },
                    {$unwind: '$user'},
                    {
                        $project: {
                            _id: 0,
                            pid: 1,
                            body: 1,
                            username: '$user.username'
                        }
                    }
                ]).toArray();

                if (RESULT.length > 0) {
                    RESPONSE.type = 'tag';
                    RESPONSE.result = RESULT;

                    search_found = true;
                }
            }
            else if (FIRST_TOKEN[0] === '@') {
                // SEARCH STRATEGY: get 5 users whose usernames have the first token's keyword as a substring. The users are sorted alphabetically starting from A

                const USERS_COLLECTION = req.app.locals.db.collection('Users');

                const RESULT = await USERS_COLLECTION.aggregate([
                    {$match: {username: new RegExp(KEYWORD)}},
                    {$sort: {username: 1}},
                    {$limit: 5},
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            pfp: 1
                        }
                    }
                ]).toArray();

                if (RESULT.length > 0) {
                    RESPONSE.type = 'user';
                    RESPONSE.result = RESULT;

                    search_found = true;
                }
            }
        }

        if (search_found === false) {
            // SEARCH STRATEGY: get 5 of the most recent posts with bodies that have the entire search query as a substring

            const POSTS_COLLECTION = req.app.locals.db.collection('Posts');

            const RESULT = await POSTS_COLLECTION.aggregate([
                {$match: {body: new RegExp(SEARCH_QUERY)}},
                {$sort: {timestamp: -1}},
                {$limit: 5},
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'uid',
                        foreignField: 'uid',
                        as: 'user'
                    }
                },
                {$unwind: '$user'},
                {
                    $project: {
                        _id: 0,
                        pid: 1,
                        body: 1,
                        username: '$user.username'
                    }
                }
            ]).toArray();

            if (RESULT.length > 0) {
                RESPONSE.type = 'content';
                RESPONSE.result = RESULT;

                search_found = true;
            }
        }
    }

    return res.json(RESPONSE);
});

// INITIALIZATION
backend.listen(8010, async () => {
    // connect to database & store the connection in a shared variable
    const MONGO_CLIENT = new MongoClient(process.env.MONGO_CLUSTER_URI);

    await MONGO_CLIENT.connect();

    backend.locals.db = MONGO_CLIENT.db('socialmedia'); // accessible in routes via `req.app.locals.db`
});
