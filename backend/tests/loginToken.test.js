const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');



// NOTE: Start the server first before running the tests

let test_user_data = {};

beforeAll(async () => {
    test_user_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');
});

afterAll(async () => {
    shared.deleteTestUsers([test_user_data.uid]);
});

describe("Logout", () => {
    it("Delete login token. Return 200 and an empty 'LT' cookie", async () => {
        // logout and check if login token still exists
        const LOGOUT_RESPONSE = await request(shared.BACKEND_URL).get('/logout').set('Cookie', test_user_data.loginToken).send();

        expect(LOGOUT_RESPONSE.status).toEqual(200);

        const LOGOUT_RESPONSE_COOKIES = LOGOUT_RESPONSE.headers['set-cookie'];
        expect(Array.isArray(LOGOUT_RESPONSE_COOKIES) && LOGOUT_RESPONSE_COOKIES.length > 0 && LOGOUT_RESPONSE_COOKIES[0].indexOf('LT=;') !== -1).toBe(true);
    });
});
