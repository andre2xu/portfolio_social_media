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
});
