const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');



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
    shared.deleteTestUsers([
        test_user1_data.uid,
        test_user2_data.uid
    ]);

    // delete chat(s)
    const DATABASE = mongo_client.db('socialmedia');
    const CHATS_COLLECTION = DATABASE.collection('Chats');
    const MESSAGES_COLLECTION = DATABASE.collection('Messages');

    await CHATS_COLLECTION.deleteMany({uid:
        {$in: [
            test_user1_data.uid,
            test_user2_data.uid
        ]}
    });

    await MESSAGES_COLLECTION.deleteMany({sid:
        {$in: [
            test_user1_data.uid,
            test_user2_data.uid
        ]}
    });
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

    it("Starting a chat. Return 200 and data for displaying new chat", async () => {
        const CHAT_NAME = 'Testing';
        const FIRST_MESSAGE = "Hi";

        const RESPONSE = await request(shared.BACKEND_URL).post('/chats').set('Cookie', test_user1_data.loginToken).send({chatName: CHAT_NAME, username: `@${test_user2_data.username}`, message: FIRST_MESSAGE});

        shared.expectJSONResponse(RESPONSE);

        expect(RESPONSE.body.chatData !== undefined).toBe(true);

        const CHAT_DATA = RESPONSE.body.chatData;

        expect(CHAT_DATA.cid !== undefined).toBe(true);
        expect(CHAT_DATA.recipientUsername).toEqual(test_user2_data.username);
        expect(CHAT_DATA.recipientPfp).toEqual('');
        expect(CHAT_DATA.chatName).toEqual(CHAT_NAME);
        expect(CHAT_DATA.recentMessage).toEqual(FIRST_MESSAGE);
    });
});

describe("Retrieving Chats", () => {
    it("No login token. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/chats').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });
});
