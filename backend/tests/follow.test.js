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
});
