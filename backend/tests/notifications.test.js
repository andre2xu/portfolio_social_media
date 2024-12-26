const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');



// NOTE: Start the server first before running the tests

let test_user_data = {};
let mongo_client = undefined;

beforeAll(async () => {
    test_user_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');

    mongo_client = await shared.openDatabaseConnection();
});

afterAll(async () => {
    shared.deleteTestUsers([test_user_data.uid]);

    mongo_client.close();
});

describe("Updating a notification setting", () => {
    it("No login token. Return 200 and a fail status", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).put('/notifications/settings').send();

        shared.expectJSONResponse(RESPONSE);

        expect(RESPONSE.body).toEqual({status: 'failed'});
    });

    it("Invalid requests. Return 200 and a fail status", async () => {
        // no body
        let response = await request(shared.BACKEND_URL).put('/notifications/settings').set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // missing fields
        response = await request(shared.BACKEND_URL).put('/notifications/settings').set('Cookie', test_user_data.loginToken).send({wrongField1: '', wrongField2: ''});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // incorrect field types
        response = await request(shared.BACKEND_URL).put('/notifications/settings').set('Cookie', test_user_data.loginToken).send({setting: [], action: 1});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});

        // incorrect field values
        response = await request(shared.BACKEND_URL).put('/notifications/settings').set('Cookie', test_user_data.loginToken).send({setting: 'notANotificationSetting', action: 'shouldBeEnableOrDisable'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});
    });

    it("Successful setting updates. Return 200 and a success status", async () => {
        /*
        SETTINGS:
        - followerStartedChat
        - strangerStartedChat
        - newPostLike
        - newPostComment
        - newFollower
        */

        // enabling the setting
        let response = await request(shared.BACKEND_URL).put('/notifications/settings').set('Cookie', test_user_data.loginToken).send({setting: 'newFollower', action: 'enable'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'success'});

        // disabling the setting
        response = await request(shared.BACKEND_URL).put('/notifications/settings').set('Cookie', test_user_data.loginToken).send({setting: 'newFollower', action: 'disable'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'success'});

        // disabling the setting again (should fail because it's already disabled)
        response = await request(shared.BACKEND_URL).put('/notifications/settings').set('Cookie', test_user_data.loginToken).send({setting: 'newFollower', action: 'disable'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({status: 'failed'});
    });
});

describe("Retrieving Notifications Settings", () => {
    it("Invalid requests. Return 200 and an empty JSON object", async () => {
        // no login token
        let response = await request(shared.BACKEND_URL).get('/notifications/settings').send();

        shared.expectEmptyJSONResponse(response);

        // non-existing user
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).get('/notifications/settings').set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectEmptyJSONResponse(response);
    });

    it("Successful retrieval. Return 200 and notifications settings", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/notifications/settings').set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(RESPONSE);

        expect(RESPONSE.body).toEqual({
            settings: {
                followerStartedChat: 0,
                strangerStartedChat: 0,
                newPostLike: 0,
                newPostComment: 0,
                newFollower: 0
            }
        });
    });
});

describe("Retrieving Notifications", () => {
    it("Invalid requests. Return 200 and an empty JSON object or an empty array", async () => {
        // no login token
        let response = await request(shared.BACKEND_URL).get('/notifications').send();

        shared.expectEmptyJSONResponse(response);

        // non-existing user
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).get('/notifications').set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({
            notifications: [],
        });
    });
});
