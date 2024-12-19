const request = require('supertest');
const crypto = require('crypto');



// NOTE: Start the server first before running the tests

const BACKEND_URL = 'http://localhost:8010'; // development

describe("[/login] Valid Request Body", () => {
    it("Request body has 'username' and 'password'. Return 200", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: '', password: ''});

        expect(RESPONSE.status).toEqual(200);
    });

    it("Request body has 'username', 'password', and an unexpected key (will be ignored). Return 200", async () => {
        const REQUEST_BODY = {username: '', password: ''};
        REQUEST_BODY[crypto.randomBytes(5).toString('hex')] = '';

        const RESPONSE = await request(BACKEND_URL).post('/login').send(REQUEST_BODY);

        expect(RESPONSE.status).toEqual(200);
    });

    it("Empty request body. Return 500", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/login').send({});

        expect(RESPONSE.status).toEqual(500);
    });
});

describe("[/login] Response Headers", () => {
    it("Response content type is JSON", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: '', password: ''});

        expect(RESPONSE.headers['content-type'].indexOf('application/json') !== -1).toBe(true);
    });
});
