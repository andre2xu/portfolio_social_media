const request = require('supertest');
const shared = require('./shared.test');
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

describe("Creating Posts", () => {
    it("No login token passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).post('/post').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Invalid request bodies. Return 200 and an error message", async () => {
        const LOGIN_TOKEN = jwt.sign(
            {uid: test_user_data.uid},
            process.env.LTS
        );

        // no request body
        let response = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Post body missing"});

        // post body with no content
        response = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`).send({postBody: ''});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Post body missing"});

        // post body with too many characters
        response = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`).send({postBody: crypto.randomBytes(500).toString('hex')});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Only 500 characters are allowed for the body"});

        // missing tags
        response = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`).send({postBody: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Post tags missing"});

        // invalid tag
        response = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`).send({postBody: 'a', postTags: 'valid tag with space, invalid_tag, validtag3'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Only letters, numbers, spaces, and commas are allowed for tags"});
    });
});
