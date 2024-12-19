const path = require('path');
const request = require('supertest');
const crypto = require('crypto');

require('dotenv').config({path: path.join(__dirname, '../.env')}); // since tests are only in development, make the 'dotenv' package a mandatory import



// NOTE: Start the server first before running the tests

const BACKEND_URL = `http://localhost:${process.env.PORT}`; // development

describe("Request Body", () => {
    it("Request body has 'username', 'password', and 'confirmPassword'. Return 200", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/signup').send({username: '', password: '', confirmPassword: ''});

        expect(RESPONSE.status).toEqual(200);
    });

    it("Request body has 'username', 'password', 'confirmPassword', and an unexpected key (will be ignored). Return 200", async () => {
        const REQUEST_BODY = {username: '', password: '', confirmPassword: ''};
        REQUEST_BODY[crypto.randomBytes(5).toString('hex')] = '';

        const RESPONSE = await request(BACKEND_URL).post('/signup').send(REQUEST_BODY);

        expect(RESPONSE.status).toEqual(200);
    });
    
    it("Empty request body. Return 500", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/signup').send({});

        expect(RESPONSE.status).toEqual(500);
    });
});
