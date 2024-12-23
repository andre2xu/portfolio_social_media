const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');



// NOTE: Start the server first before running the tests

let test_user1_data = {};
let test_user2_data = {};

beforeAll(async () => {
    test_user1_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');

    test_user2_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');
});

afterAll(async () => {
    shared.deleteTestUsers([
        test_user1_data.uid,
        test_user2_data.uid
    ]);
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
});
