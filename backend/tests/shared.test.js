const { MongoClient } = require('mongodb');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');

require('dotenv').config({path: path.join(__dirname, '../.env')}); // since tests are only in development, make the 'dotenv' package a mandatory import



const BACKEND_URL = `http://localhost:${process.env.PORT}`; // development server

async function openDatabaseConnection() {
    const CONNECTION = new MongoClient(process.env.MONGO_CLUSTER_URI);
    await CONNECTION.connect();

    return CONNECTION;
};

async function createTestUser(username, password) {
    // create a new temporary account
    const SIGN_UP_RESPONSE = await request(BACKEND_URL).post('/signup').send({username: username, password: password, confirmPassword: password});

    expect(SIGN_UP_RESPONSE.status).toEqual(200);
    expect(SIGN_UP_RESPONSE.body.errorMessage === undefined).toBe(true);

    // get the login token (a HTTP-only cookie) from the response
    const SIGN_UP_RESPONSE_COOKIES = SIGN_UP_RESPONSE.headers['set-cookie'];
    expect(Array.isArray(SIGN_UP_RESPONSE_COOKIES) && SIGN_UP_RESPONSE_COOKIES.length > 0 && SIGN_UP_RESPONSE_COOKIES[0].indexOf('LT=') !== -1).toBe(true);

    const LOGIN_TOKEN = SIGN_UP_RESPONSE_COOKIES[0].split(';')[0].replace('LT=', '');
    const DECODED_TOKEN = jwt.verify(LOGIN_TOKEN, process.env.LTS);

    // return test user data
    const TEST_USER_DATA = {};

    TEST_USER_DATA.uid = DECODED_TOKEN.uid;
    TEST_USER_DATA.username = username;
    TEST_USER_DATA.password = password;
    TEST_USER_DATA.loginToken = SIGN_UP_RESPONSE_COOKIES[0];

    return TEST_USER_DATA;
};

async function deleteTestUsers(uids) {
    const MONGO_CLIENT = await openDatabaseConnection();

    const DATABASE = MONGO_CLIENT.db('socialmedia');
    const USERS_COLLECTION = DATABASE.collection('Users');
    const NOTIFICATIONS_SETTINGS_COLLECTION_COLLECTION = DATABASE.collection('NotificationsSettings');

    // delete test user
    await NOTIFICATIONS_SETTINGS_COLLECTION_COLLECTION.deleteMany({uid: {$in: uids}});
    await USERS_COLLECTION.deleteMany({uid: {$in: uids}});

    MONGO_CLIENT.close();
};

function expectJSONResponse(response) {
    expect(response.status).toEqual(200);
    expect(response.headers['content-type'].indexOf('application/json') !== -1).toBe(true);
};

function expectEmptyJSONResponse(response) {
    expectJSONResponse(response);
    expect(response.body).toEqual({});
};



module.exports = {
    BACKEND_URL,
    openDatabaseConnection,
    createTestUser,
    deleteTestUsers,
    expectJSONResponse,
    expectEmptyJSONResponse
};
