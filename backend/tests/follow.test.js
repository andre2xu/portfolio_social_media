const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');



// NOTE: Start the server first before running the tests

let test_user1_data = {};
let test_user2_data = {};
let mongo_client = undefined;

beforeAll(async () => {
    test_user1_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');

    test_user2_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');

    mongo_client = await shared.openDatabaseConnection();
});

afterAll(async () => {
    const FOLLOWERS_COLLECTION = mongo_client.db('socialmedia').collection('Followers');

    await FOLLOWERS_COLLECTION.deleteMany({$or: [{uid: test_user1_data.uid}, {uid: test_user2_data.uid}]});

    shared.deleteTestUsers([
        test_user1_data.uid,
        test_user2_data.uid
    ]);

    mongo_client.close();
});

describe("Follow", () => {
    it("Invalid requests. Return 200 and a fail status", async () => {
        // no login token
        let response = await request(shared.BACKEND_URL).post('/follow').send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // no body
        response = await request(shared.BACKEND_URL).post('/follow').set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // follow a non-existent user
        response = await request(shared.BACKEND_URL).post('/follow').set('Cookie', test_user1_data.loginToken).send({username: 'idontexist'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // login token belongs to a non-existent user
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).post('/follow').set('Cookie', `LT=${LOGIN_TOKEN}`).send({username: test_user2_data.username});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});
    });

    it("Follow a user. Return 200, a success status, and the username & pfp of the follower", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/follow').set('Cookie', test_user1_data.loginToken).send({username: test_user2_data.username});

        shared.expectJSONResponse(RESPONSE);

        expect(RESPONSE.body.status !== undefined && RESPONSE.body.followerAdded !== undefined).toBe(true);

        expect(RESPONSE.body.status).toEqual('success');

        expect(RESPONSE.body.followerAdded).toEqual({
            username: test_user1_data.username,
            pfp: ''
        });
    });
});

describe("Followers Retrieval", () => {
    afterEach(async () => {
        const FOLLOWERS_COLLECTION = mongo_client.db('socialmedia').collection('Followers');

        await FOLLOWERS_COLLECTION.deleteMany({$or: [{uid: test_user1_data.uid}, {uid: test_user2_data.uid}]});
    });

    it("Invalid requests. Return 200 and an empty JSON object", async () => {
        // no login token
        let response = await request(shared.BACKEND_URL).get(`/followers/${test_user1_data.username}`).send();

        shared.expectEmptyJSONResponse(response);

        // non-existent user
        response = await request(shared.BACKEND_URL).get('/followers/abc').set('Cookie', test_user1_data.loginToken).send();

        shared.expectEmptyJSONResponse(response);
    });

    it("Successful retrieval. Return 200 and a list of followers or an empty JSON object", async () => {
        // no followers
        let response = await request(shared.BACKEND_URL).get(`/followers/${test_user2_data.username}`).set('Cookie', test_user1_data.loginToken).send();

        shared.expectEmptyJSONResponse(response);

        // with followers (test user 1 is retrieving)
        const FOLLOW_RESPONSE = await request(shared.BACKEND_URL).post('/follow').set('Cookie', test_user1_data.loginToken).send({username: test_user2_data.username});

        shared.expectJSONResponse(FOLLOW_RESPONSE);

        response = await request(shared.BACKEND_URL).get(`/followers/${test_user2_data.username}`).set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(response);

        const FOLLOWERS = response.body.followers;

        expect(Array.isArray(FOLLOWERS) && response.body.followedByUser === true).toBe(true);

        expect(FOLLOWERS.length).toEqual(1);

        expect(FOLLOWERS[0]).toEqual({
            username: test_user1_data.username,
            pfp: ''
        });

        // with followers (test user 2 is retrieving so 'followedByUser' should not be in the response)
        response = await request(shared.BACKEND_URL).get(`/followers/${test_user2_data.username}`).set('Cookie', test_user2_data.loginToken).send();

        shared.expectJSONResponse(response);

        expect(Array.isArray(FOLLOWERS) && response.body.followedByUser === undefined).toBe(true);

        expect(FOLLOWERS.length).toEqual(1);

        expect(FOLLOWERS[0]).toEqual({
            username: test_user1_data.username,
            pfp: ''
        });
    });
});

describe("Following Retrieval", () => {
    afterEach(async () => {
        const FOLLOWERS_COLLECTION = mongo_client.db('socialmedia').collection('Followers');

        await FOLLOWERS_COLLECTION.deleteMany({$or: [{uid: test_user1_data.uid}, {uid: test_user2_data.uid}]});
    });

    it("Invalid requests. Return 200 and an empty JSON object", async () => {
        // no login token
        let response = await request(shared.BACKEND_URL).get(`/following/${test_user1_data.username}`).send();

        shared.expectEmptyJSONResponse(response);

        // non-existent user
        response = await request(shared.BACKEND_URL).get('/following/abc').set('Cookie', test_user1_data.loginToken).send();

        shared.expectEmptyJSONResponse(response);
    });

    it("Successful retrieval. Return 200 and a list of users being followed by the requester", async () => {
        // no following
        let response = await request(shared.BACKEND_URL).get(`/following/${test_user1_data.username}`).set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({following: []});

        // with following (test user 1 follows test user 2)
        const FOLLOW_RESPONSE = await request(shared.BACKEND_URL).post('/follow').set('Cookie', test_user1_data.loginToken).send({username: test_user2_data.username});

        shared.expectJSONResponse(FOLLOW_RESPONSE);

        response = await request(shared.BACKEND_URL).get(`/following/${test_user1_data.username}`).set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({
            following: [
                {
                    username: test_user2_data.username,
                    pfp: ''
                }
            ]
        });
    });
});

describe("Unfollow", () => {
    it("Invalid requests. Return 200 and a fail status", async () => {
        // no login token
        let response = await request(shared.BACKEND_URL).delete(`/follow/${test_user2_data.username}`).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // user being unfollowed doesn't exist
        response = await request(shared.BACKEND_URL).delete('/follow/abc').set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // user doing the unfollowing doesn't exist
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).delete(`/follow/${test_user2_data.username}`).set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // unfollowing a user that isn't even followed
        response = await request(shared.BACKEND_URL).delete(`/follow/${test_user2_data.username}`).set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});
    });
});
