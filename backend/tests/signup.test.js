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

describe("Response Headers", () => {
    it("Response content type is JSON", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/signup').send({username: '', password: '', confirmPassword: ''});

        expect(RESPONSE.headers['content-type'].indexOf('application/json') !== -1).toBe(true);
    });
});

describe("Response Data", () => {
    it("Username is empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/signup').send({username: '', password: 'a', confirmPassword: 'a'});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Password is empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/signup').send({username: 'a', password: '', confirmPassword: 'a'});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Confirm password is empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/signup').send({username: 'a', password: 'a', confirmPassword: ''});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Username, password, and confirm password are empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/signup').send({username: '', password: '', confirmPassword: ''});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Username is too long. Return error message: \"Username cannot exceed 20 characters\"", async () => {
        const TEST_USER_PASSWORD = '!aB0aaaaaaaaaaaa';

        const RESPONSE = await request(BACKEND_URL).post('/signup').send({username: crypto.randomBytes(50).toString('hex').substring(0,21), password: TEST_USER_PASSWORD, confirmPassword: TEST_USER_PASSWORD});

        expect(RESPONSE.body).toEqual({errorMessage: 'Username cannot exceed 20 characters'});
    });

    it("Invalid passwords. Return error message: \"Password must be 8-30 characters long and have a lowercase and uppercase letter, a digit, and a special character\"", async () => {
        const TEST_USER_USERNAME = crypto.randomBytes(5).toString('hex');
        let test_user_password = '';

        const ERROR_MESSAGE = "Password must be 8-30 characters long and have a lowercase and uppercase letter, a digit, and a special character";

        // too short
        test_user_password = 'a';

        let response = await request(BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // too long
        test_user_password = crypto.randomBytes(60).toString('hex').substring(0, 31);

        response = await request(BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // missing a lowercase letter
        test_user_password = '!AB0AAAAAAAAAAAAAAAAAA';

        response = await request(BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // missing an uppercase letter
        test_user_password = '!ab0aaaaaaaaaaaa';

        response = await request(BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // missing a digit
        test_user_password = '!aBaaaaaaaaaaaaa';

        response = await request(BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // missing a special character
        test_user_password = 'caB0aaaaaaaaaaaa';

        response = await request(BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});
    });

    it("Password and confirm password values don't match. Return error message: \"Both passwords must match\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/signup').send({username: crypto.randomBytes(5).toString('hex'), password: '!aB0aaaaaaaaaaaa', confirmPassword: '!aB0aaaaaaaaaaac'});

        expect(RESPONSE.body).toEqual({errorMessage: 'Both passwords must match'});
    });
});
