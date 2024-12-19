const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');



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

describe("Frontend Authentication", () => {
    it("No login token is passed. Return 200 and the 'isAuthenticated' flag set to false", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/auth').set('Cookie', '').send();

        expect(RESPONSE.status).toEqual(200);

        expect(RESPONSE.body).toEqual({isAuthenticated: false});
    });

    it("Valid login token is passed. Return 200 and the 'isAuthenticated' flag set to true", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/auth').set('Cookie', test_user_data.loginToken).send();

        expect(RESPONSE.status).toEqual(200);

        expect(RESPONSE.body).toEqual({isAuthenticated: true});
    });

    it("Invalid login token is passed. Return 200 and the 'isAuthenticated' flag set to false", async () => {
        // no LT cookie
        let response = await request(shared.BACKEND_URL).post('/auth').set('Cookie', 'testcookie=1').send();

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({isAuthenticated: false});

        // invalid JWT
        response = await request(shared.BACKEND_URL).post('/auth').set('Cookie', 'LT=abc').send();

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({isAuthenticated: false});

        // expired JWT
        const EXPIRED_LOGIN_TOKEN = jwt.sign(
            {
                uid: test_user_data.uid,
                exp: Math.floor(Date.now() / 1000) - 1 // old expiration date (i.e. expired 1 second ago)
            },
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).post('/auth').set('Cookie', `LT=${EXPIRED_LOGIN_TOKEN}`).send();

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({isAuthenticated: false});
    });
});
