const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');



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
