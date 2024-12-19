const shared = require('./shared.test');
const request = require('supertest');
const jwt = require('jsonwebtoken');



// NOTE: Start the server first before running the tests

let test_user1_data = {};
let test_user2_data = {};

beforeAll(async () => {
    test_user1_data = await shared.createTestUser('user1', '!aB0aaaaaaaaaaaa');
    test_user2_data = await shared.createTestUser('user2', '!aB0aaaaaaaaaaaa');
});

afterAll(async () => {
    shared.deleteTestUsers([
        test_user1_data.uid,
        test_user2_data.uid
    ]);
});

describe("Account Data Retrieval", () => {
    it("No username or login token passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/account/info').set('Cookie', '').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Pass an invalid username in URL. Return 200 and an empty JSON object", async () => {
        // username that doesn't belong to anyone
        let response = await request(shared.BACKEND_URL).get('/account/info/idontexist').set('Cookie', '').send();

        shared.expectEmptyJSONResponse(response);

        // weird username
        response = await request(shared.BACKEND_URL).get('/account/info/this_looks-wrong?> huh').set('Cookie', '').send();

        shared.expectEmptyJSONResponse(response);
    });

    it("Pass an invalid login token. Return 200 and an empty JSON object", async () => {
        const EXPIRED_LOGIN_TOKEN = jwt.sign(
            {
                uid: test_user1_data.uid,
                exp: Math.floor(Date.now() / 1000) - 1  // old expiration date (i.e. expired 1 second ago)
            },
            process.env.LTS
        );

        const RESPONSE = await request(shared.BACKEND_URL).get('/account/info').set('Cookie', `LT=${EXPIRED_LOGIN_TOKEN}`).send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Pass username only. Return 200 and non-sensitive user data", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get(`/account/info/${test_user1_data.username}`).set('Cookie', '').send();

        shared.expectJSONResponse(RESPONSE);
        expect(RESPONSE.body).toEqual({username: test_user1_data.username, cover: '', pfp: ''});
    });

    it("Pass login token only. Return 200 and non-sensitive user data", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/account/info').set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(RESPONSE);
        expect(RESPONSE.body).toEqual({username: test_user1_data.username, cover: '', pfp: ''});
    });

    it("Pass a username and a login token. Return 200 and only the non-sensitive user data tied to the username (prioritized)", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get(`/account/info/${test_user2_data.username}`).set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(RESPONSE);
        expect(RESPONSE.body).not.toEqual({username: test_user1_data.username, cover: '', pfp: ''});
        expect(RESPONSE.body).toEqual({username: test_user2_data.username, cover: '', pfp: ''});
    });
});
