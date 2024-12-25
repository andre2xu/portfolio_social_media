const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');



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

describe("Creating Chats", () => {
    it("No login token. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/chats').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Invalid requests. Return 200 and an error message", async () => {
        // empty body OR missing 'chatName' field
        let response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Chat name is missing"});

        // 'chatName' field is empty
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: ''});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Chat name is missing"});

        // missing 'username' field
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Username is missing"});

        // 'username' field is empty
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a', username: ''});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Username is missing"});

        // missing 'message' field
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a', username: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Message is missing"});

        // 'message' field is empty
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a', username: 'a', message: ''});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Message is missing"});

        // invalid username (no @ symbol at the start)
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a', username: 'a', message: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Invalid username"});

        // invalid username (nothing after @ symbol)
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a', username: '@', message: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Invalid username"});

        // invalid username (exceeds username max limit)
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a', username: `@${crypto.randomBytes(30).toString('hex')}`, message: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Invalid username"});

        // non-existent user
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a', username: `@${crypto.randomBytes(8).toString('hex')}`, message: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "That user does not exist"});

        // user starting a chat with themselves
        response = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: 'a', username: `@${test_user1_data.username}`, message: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "You cannot start a chat with yourself"});
    });
});
