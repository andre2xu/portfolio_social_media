const { MongoClient } = require('mongodb');
const path = require('path');
const request = require('supertest');
const crypto = require('crypto');

try {
    // load environment variables for development but silently fail for production
    require('dotenv').config({path: path.join(__dirname, '../.env')});
}
catch {}



// NOTE: Start the server first before running the tests

const BACKEND_URL = 'http://localhost:8010'; // development

describe("Request Body", () => {
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

describe("Response Headers", () => {
    it("Response content type is JSON", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: '', password: ''});

        expect(RESPONSE.headers['content-type'].indexOf('application/json') !== -1).toBe(true);
    });
});

describe("Response Data", () => {
    it("Username is empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: '', password: 'a'});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Password is empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: 'a', password: ''});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Username and password are empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: '', password: ''});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Account doesn't exist. Return error message: \"Invalid credentials\"", async () => {
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: crypto.randomBytes(20).toString('hex'), password: '123'});

        expect(RESPONSE.body).toEqual({errorMessage: 'Invalid credentials'});
    });

    it("Incorrect password. Return error message: \"Invalid credentials\"", async () => {
        // create test user
        const MONGO_CLIENT = new MongoClient(process.env.MONGO_CLUSTER_URI);
        await MONGO_CLIENT.connect();

        const DATABASE = MONGO_CLIENT.db('socialmedia');
        const USERS_COLLECTION = DATABASE.collection('Users');

        const TEST_USER_USERNAME = crypto.randomBytes(5).toString('hex');
        const TEST_USER_PASSWORD = '!aB0aaaaaaaaaaaa';

        await USERS_COLLECTION.insertOne({username: TEST_USER_USERNAME, password: crypto.createHash('sha256').update(TEST_USER_PASSWORD).digest('hex')});

        // login as the test user
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: TEST_USER_USERNAME, password: 'wrongPassword'});

        // check for error message
        expect(RESPONSE.body).toEqual({errorMessage: 'Invalid credentials'});

        // delete test user
        await USERS_COLLECTION.deleteOne({username: TEST_USER_USERNAME});
        await MONGO_CLIENT.close();
    });

    it("Log in successfully and check for login token", async () => {
        // create test user
        const MONGO_CLIENT = new MongoClient(process.env.MONGO_CLUSTER_URI);
        await MONGO_CLIENT.connect();

        const DATABASE = MONGO_CLIENT.db('socialmedia');
        const USERS_COLLECTION = DATABASE.collection('Users');

        const TEST_USER_USERNAME = crypto.randomBytes(5).toString('hex');
        const TEST_USER_PASSWORD = '!aB0aaaaaaaaaaaa';

        await USERS_COLLECTION.insertOne({username: TEST_USER_USERNAME, password: crypto.createHash('sha256').update(TEST_USER_PASSWORD).digest('hex')});

        // login as the test user
        const RESPONSE = await request(BACKEND_URL).post('/login').send({username: TEST_USER_USERNAME, password: TEST_USER_PASSWORD});

        // check if login token exists and validate it
        expect(Array.isArray(RESPONSE.headers['set-cookie'])).toBe(true);

        const LOGIN_TOKEN = RESPONSE.headers['set-cookie'][0];
        const JWT_PATTERN = new RegExp('^LT=[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+;');

        expect(JWT_PATTERN.test(LOGIN_TOKEN)).toBe(true);
        expect(LOGIN_TOKEN.indexOf('HttpOnly') !== -1).toBe(true);
        expect(LOGIN_TOKEN.indexOf('Secure') !== -1).toBe(true);
        expect(LOGIN_TOKEN.indexOf('SameSite=Strict') !== -1).toBe(true);

        // delete test user
        await USERS_COLLECTION.deleteOne({username: TEST_USER_USERNAME});
        await MONGO_CLIENT.close();
    });
});
