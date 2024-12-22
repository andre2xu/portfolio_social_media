const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');



// NOTE: Start the server first before running the tests

let test_user_data = {};
let test_post_data = {};
let mongo_client = undefined;

beforeAll(async () => {
    test_user_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');

    mongo_client = await shared.openDatabaseConnection();

    // create a test post
    const POST_RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
        .field('postBody', "Add a comment to me plz")
        .field('postTags', 'tag');

    shared.expectEmptyJSONResponse(POST_RESPONSE);

    const POSTS_COLLECTION = mongo_client.db('socialmedia').collection('Posts');
    const POST = await POSTS_COLLECTION.findOne({uid: test_user_data.uid}, {projection: {_id: 0}});

    expect(POST).not.toEqual(null);

    test_post_data = POST;
});

afterAll(async () => {
    shared.deleteTestUsers([test_user_data.uid]);

    mongo_client.close();

    // delete test post
    const POSTS_COLLECTION = mongo_client.db('socialmedia').collection('Posts');

    await POSTS_COLLECTION.deleteOne({pid: test_post_data.pid});
});

describe("Creating Comments", () => {
    it("No login token passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Invalid request bodies. Return 200 and an empty JSON object", async () => {
        // non-existent post
        let response = await request(shared.BACKEND_URL).post('/comments/notapost').set('Cookie', test_user_data.loginToken).send();

        shared.expectEmptyJSONResponse(response);

        // non-existent user
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectEmptyJSONResponse(response);

        // no body
        response = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', test_user_data.loginToken).send();

        shared.expectEmptyJSONResponse(response);

        // wrong key (should be 'replyBody')
        response = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', test_user_data.loginToken).send({wrongKey: 'this is ignored'});

        shared.expectEmptyJSONResponse(response);

        // wrong value (should be a string)
        response = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', test_user_data.loginToken).send({replyBody: 1});

        shared.expectEmptyJSONResponse(response);

        // empty value
        response = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', test_user_data.loginToken).send({replyBody: ''});

        shared.expectEmptyJSONResponse(response);
    });

    it("New comment. Return 200 and data for displaying the comment", async () => {
        const COMMENT = "Hi";
        const RESPONSE = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', test_user_data.loginToken).send({replyBody: COMMENT});

        shared.expectJSONResponse(RESPONSE);

        expect(RESPONSE.body.userData !== undefined && RESPONSE.body.commentData !== undefined).toBe(true);

        // check user data
        const USER_DATA = RESPONSE.body.userData;

        expect(USER_DATA.username).toEqual(test_user_data.username);
        expect(USER_DATA.pfp !== undefined).toBe(true);

        // check comment data
        const COMMENT_DATA = RESPONSE.body.commentData;

        expect(COMMENT_DATA.cid !== undefined && COMMENT_DATA.comment !== undefined && COMMENT_DATA.date !== undefined && Array.isArray(COMMENT_DATA.likes) && Array.isArray(COMMENT_DATA.dislikes) && COMMENT_DATA.ownedByUser === true).toBe(true);

        expect(COMMENT_DATA.comment).toEqual(COMMENT);

        // delete comment(s)
        const COMMENTS_COLLECTION = mongo_client.db('socialmedia').collection('Comments');

        await COMMENTS_COLLECTION.deleteMany({pid: test_post_data.pid});
    });
});

describe("Retrieving Comments", () => {
    it("No login token passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get(`/comments/${test_post_data.pid}`).send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Invalid request bodies. Return 200 and an empty JSON object", async () => {
        // non-existent post
        let response = await request(shared.BACKEND_URL).get('/comments/notapost').set('Cookie', test_user_data.loginToken).send();

        shared.expectEmptyJSONResponse(response);

        // non-existent user
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectEmptyJSONResponse(response);
    });

    it("Successful retrieval. Return 200 and data for displaying the post and its comments", async () => {
        // add a test comment
        const COMMENT = "This is a test";
        const COMMENT_RESPONSE = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', test_user_data.loginToken).send({replyBody: COMMENT});

        shared.expectJSONResponse(COMMENT_RESPONSE);

        // retrieve the post and its comments
        const RESPONSE = await request(shared.BACKEND_URL).get(`/comments/${test_post_data.pid}`).set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(RESPONSE);

        expect(RESPONSE.body.postData !== undefined && RESPONSE.body.userData !== undefined && Array.isArray(RESPONSE.body.comments)).toBe(true);

        // verify post data
        const POST_DATA = RESPONSE.body.postData;

        expect(POST_DATA.pid).toEqual(test_post_data.pid);
        expect(POST_DATA.uid === undefined).toBe(true); // uid is sensitive info and should not be in the response

        POST_DATA.uid = test_user_data.uid; // add uid to post data just for testing

        expect(POST_DATA).toEqual(test_post_data);

        // verify user data
        const USER_DATA = RESPONSE.body.userData;

        expect(USER_DATA.username).toEqual(test_user_data.username);
        expect(USER_DATA.pfp !== undefined).toBe(true);

        // verify comments
        const COMMENTS = RESPONSE.body.comments;

        expect(COMMENTS.length).toEqual(1);
        expect(COMMENTS[0].username).toEqual(test_user_data.username);
        expect(COMMENTS[0].comment).toEqual(COMMENT);

        // delete test comment(s)
        const COMMENTS_COLLECTION = mongo_client.db('socialmedia').collection('Comments');

        await COMMENTS_COLLECTION.deleteMany({pid: test_post_data.pid});
    });
});

describe("Deleting Comments", () => {
    let test_comment_data = {};

    beforeEach(async () => {
        // add a test comment
        const COMMENT = "Delete me plz";
        const RESPONSE = await request(shared.BACKEND_URL).post(`/comments/${test_post_data.pid}`).set('Cookie', test_user_data.loginToken).send({replyBody: COMMENT});

        shared.expectJSONResponse(RESPONSE);

        test_comment_data = RESPONSE.body.commentData;
    });

    afterEach(async () => {
        // delete test comment(s)
        const COMMENTS_COLLECTION = mongo_client.db('socialmedia').collection('Comments');

        await COMMENTS_COLLECTION.deleteMany({pid: test_post_data.pid});
    });

    it("Invalid requests. Return 200 and a fail status", async () => {
        // no login token
        let response = await request(shared.BACKEND_URL).delete(`/comments/${test_comment_data.cid}`).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // non-existent commenter
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).delete(`/comments/${test_comment_data.cid}`).set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // non-existent comment
        response = await request(shared.BACKEND_URL).delete('/comments/notacomment').set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});
    });
});
