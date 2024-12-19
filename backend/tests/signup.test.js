const request = require('supertest');
const crypto = require('crypto');
const shared = require('./shared.test');



// NOTE: Start the server first before running the tests

describe("Request Body", () => {
    it("Request body has 'username', 'password', and 'confirmPassword'. Return 200", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: '', password: '', confirmPassword: ''});

        expect(RESPONSE.status).toEqual(200);
    });

    it("Request body has 'username', 'password', 'confirmPassword', and an unexpected key (will be ignored). Return 200", async () => {
        const REQUEST_BODY = {username: '', password: '', confirmPassword: ''};
        REQUEST_BODY[crypto.randomBytes(5).toString('hex')] = '';

        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send(REQUEST_BODY);

        expect(RESPONSE.status).toEqual(200);
    });
    
    it("Empty request body. Return 500", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({});

        expect(RESPONSE.status).toEqual(500);
    });
});

describe("Response Headers", () => {
    it("Response content type is JSON", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: '', password: '', confirmPassword: ''});

        expect(RESPONSE.headers['content-type'].indexOf('application/json') !== -1).toBe(true);
    });
});

describe("Response Data", () => {
    it("Username is empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: '', password: 'a', confirmPassword: 'a'});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Password is empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: 'a', password: '', confirmPassword: 'a'});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Confirm password is empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: 'a', password: 'a', confirmPassword: ''});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Username, password, and confirm password are empty. Return error message: \"Fields cannot be empty\"", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: '', password: '', confirmPassword: ''});

        expect(RESPONSE.body).toEqual({errorMessage: 'Fields cannot be empty'});
    });

    it("Username is too long. Return error message: \"Username cannot exceed 20 characters\"", async () => {
        const TEST_USER_PASSWORD = '!aB0aaaaaaaaaaaa';

        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: crypto.randomBytes(50).toString('hex').substring(0,21), password: TEST_USER_PASSWORD, confirmPassword: TEST_USER_PASSWORD});

        expect(RESPONSE.body).toEqual({errorMessage: 'Username cannot exceed 20 characters'});
    });

    it("Invalid passwords. Return error message: \"Password must be 8-30 characters long and have a lowercase and uppercase letter, a digit, and a special character\"", async () => {
        const TEST_USER_USERNAME = crypto.randomBytes(5).toString('hex');
        let test_user_password = '';

        const ERROR_MESSAGE = "Password must be 8-30 characters long and have a lowercase and uppercase letter, a digit, and a special character";

        // too short
        test_user_password = 'a';

        let response = await request(shared.BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // too long
        test_user_password = crypto.randomBytes(60).toString('hex').substring(0, 31);

        response = await request(shared.BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // missing a lowercase letter
        test_user_password = '!AB0AAAAAAAAAAAAAAAAAA';

        response = await request(shared.BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // missing an uppercase letter
        test_user_password = '!ab0aaaaaaaaaaaa';

        response = await request(shared.BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // missing a digit
        test_user_password = '!aBaaaaaaaaaaaaa';

        response = await request(shared.BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});

        // missing a special character
        test_user_password = 'caB0aaaaaaaaaaaa';

        response = await request(shared.BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: test_user_password, confirmPassword: test_user_password});

        expect(response.body).toEqual({errorMessage: ERROR_MESSAGE});
    });

    it("Password and confirm password values don't match. Return error message: \"Both passwords must match\"", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: crypto.randomBytes(5).toString('hex'), password: '!aB0aaaaaaaaaaaa', confirmPassword: '!aB0aaaaaaaaaaac'});

        expect(RESPONSE.body).toEqual({errorMessage: 'Both passwords must match'});
    });

    it("Username is taken. Return error message: \"Invalid username. Try a different one\"", async () => {
        // create fake user
        const MONGO_CLIENT = await shared.openDatabaseConnection();

        const DATABASE = MONGO_CLIENT.db('socialmedia');
        const USERS_COLLECTION = DATABASE.collection('Users');

        const TEST_USER_USERNAME = crypto.randomBytes(5).toString('hex');
        await USERS_COLLECTION.insertOne({username: TEST_USER_USERNAME});

        // sign up
        const TEST_USER_PASSWORD = '!aB0aaaaaaaaaaaa';

        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: TEST_USER_PASSWORD, confirmPassword: TEST_USER_PASSWORD});

        expect(RESPONSE.body).toEqual({errorMessage: 'Invalid username. Try a different one'});

        // delete fake user
        await USERS_COLLECTION.deleteOne({username: TEST_USER_USERNAME});
        await MONGO_CLIENT.close();
    });

    it("Sign up successfully and check the database for the new user and their notifications settings, and also check for their login token", async () => {
        // sign up
        const TEST_USER_USERNAME = crypto.randomBytes(5).toString('hex');
        const TEST_USER_PASSWORD = '!aB0aaaaaaaaaaaa';

        const RESPONSE = await request(shared.BACKEND_URL).post('/signup').send({username: TEST_USER_USERNAME, password: TEST_USER_PASSWORD, confirmPassword: TEST_USER_PASSWORD});

        // check if login token exists and validate it
        expect(Array.isArray(RESPONSE.headers['set-cookie'])).toBe(true);

        const LOGIN_TOKEN = RESPONSE.headers['set-cookie'][0];
        const JWT_PATTERN = new RegExp('^LT=[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+;');

        expect(JWT_PATTERN.test(LOGIN_TOKEN)).toBe(true);
        expect(LOGIN_TOKEN.indexOf('HttpOnly') !== -1).toBe(true);
        expect(LOGIN_TOKEN.indexOf('Secure') !== -1).toBe(true);
        expect(LOGIN_TOKEN.indexOf('SameSite=Strict') !== -1).toBe(true);

        // check if test user exists in database along with their default notifications settings
        const MONGO_CLIENT = await shared.openDatabaseConnection();

        const DATABASE = MONGO_CLIENT.db('socialmedia');
        const USERS_COLLECTION = DATABASE.collection('Users');
        const NOTIFICATIONS_SETTINGS_COLLECTION_COLLECTION = DATABASE.collection('NotificationsSettings');

        const TEST_USER = await USERS_COLLECTION.findOne({username: TEST_USER_USERNAME});

        expect(TEST_USER !== null).toBe(true);
        expect(TEST_USER.uid !== undefined).toBe(true);
        expect(TEST_USER.username !== undefined).toBe(true);
        expect(TEST_USER.password !== undefined).toBe(true);
        expect(TEST_USER.pfp !== undefined).toBe(true);
        expect(TEST_USER.cover !== undefined).toBe(true);

        const TEST_USER_NOTIFICATIONS_SETTINGS = await NOTIFICATIONS_SETTINGS_COLLECTION_COLLECTION.findOne({uid: TEST_USER.uid});

        expect(TEST_USER_NOTIFICATIONS_SETTINGS !== null).toBe(true);

        // delete test user
        await NOTIFICATIONS_SETTINGS_COLLECTION_COLLECTION.deleteOne({uid: TEST_USER.uid});
        await USERS_COLLECTION.deleteOne({username: TEST_USER_USERNAME});
        await MONGO_CLIENT.close();
    });
});
