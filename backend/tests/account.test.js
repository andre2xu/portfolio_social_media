const shared = require('./shared.test');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');



// NOTE: Start the server first before running the tests

let test_user1_data = {};
let test_user2_data = {};
let mongo_client = undefined;

beforeAll(async () => {
    test_user1_data = await shared.createTestUser('user1', '!aB0aaaaaaaaaaaa');
    test_user2_data = await shared.createTestUser('user2', '!aB0aaaaaaaaaaaa');

    mongo_client = await shared.openDatabaseConnection();
});

afterAll(async () => {
    shared.deleteTestUsers([
        test_user1_data.uid,
        test_user2_data.uid
    ]);

    mongo_client.close();
});

describe("Account Data Retrieval", () => {
    it("No username or login token passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/account/info').set('Cookie', '').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Pass an invalid username in URL. Return 200 and an empty JSON object", async () => {
        // username that doesn't belong to anyone
        let response = await request(shared.BACKEND_URL).get('/account/info/idontexist').set('Cookie', '').send();

        shared.expectEmptyJSONResponse(response);

        // weird username
        response = await request(shared.BACKEND_URL).get('/account/info/this_looks-wrong?> huh').set('Cookie', '').send();

        shared.expectEmptyJSONResponse(response);
    });

    it("Pass an invalid login token. Return 200 and an empty JSON object", async () => {
        const EXPIRED_LOGIN_TOKEN = jwt.sign(
            {
                uid: test_user1_data.uid,
                exp: Math.floor(Date.now() / 1000) - 1  // old expiration date (i.e. expired 1 second ago)
            },
            process.env.PORTFOLIO_SOCIAL_MEDIA_LTS
        );

        const RESPONSE = await request(shared.BACKEND_URL).get('/account/info').set('Cookie', `LT=${EXPIRED_LOGIN_TOKEN}`).send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Pass username only. Return 200 and non-sensitive user data", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get(`/account/info/${test_user1_data.username}`).set('Cookie', '').send();

        shared.expectJSONResponse(RESPONSE);
        expect(RESPONSE.body).toEqual({username: test_user1_data.username, cover: '', pfp: ''});
    });

    it("Pass login token only. Return 200 and non-sensitive user data", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/account/info').set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(RESPONSE);
        expect(RESPONSE.body).toEqual({username: test_user1_data.username, cover: '', pfp: ''});
    });

    it("Pass a username and a login token. Return 200 and only the non-sensitive user data tied to the username (prioritized)", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get(`/account/info/${test_user2_data.username}`).set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(RESPONSE);
        expect(RESPONSE.body).not.toEqual({username: test_user1_data.username, cover: '', pfp: ''});
        expect(RESPONSE.body).toEqual({username: test_user2_data.username, cover: '', pfp: ''});
    });
});

describe("Account Data Update", () => {
    it("No login token passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).put('/account/update').set('Cookie', '').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Pass login token of user that doesn't exist. Return 200 and an empty JSON object", async () => {
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.PORTFOLIO_SOCIAL_MEDIA_LTS
        );

        const RESPONSE = await request(shared.BACKEND_URL).put('/account/update').set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Empty request body (i.e. no changes to account data). Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .field('newUsername', '')
            .field('newPassword', '')
            .field('cover', '')
            .field('pfp', '');

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Invalid request bodies. Return 500 or error message", async () => {
        // NOTE: most of these tests will cause errors to be logged in /backend/logs/error.log. Be sure to clean them up after

        // no fields
        let response = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .send({});

        expect(response.status).toEqual(500);

        // missing username field
        response = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .field('newPassword', '')
            .field('cover', '')
            .field('pfp', '');

        expect(response.status).toEqual(500);

        // missing password field
        response = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .field('newUsername', '')
            .field('cover', '')
            .field('pfp', '');

        expect(response.status).toEqual(500);

        // invalid new password
        response = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .field('newUsername', '')
            .field('newPassword', 'MyNewPassword')
            .field('cover', '')
            .field('pfp', '');

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({errorMessage: "Password must be 8-30 characters long and have a lowercase and uppercase letter, a digit, and a special character"});
    });

    it("Successful updates. Return 200 and verify changes made to account data", async () => {
        // NOTE: multiple fields can be updated. These tests however will only update one at a time

        const UPLOADED_FILES = {};

        // new username
        const NEW_USERNAME = 'MyNewUsername';
        test_user1_data.username = NEW_USERNAME;

        let response = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .field('newUsername', NEW_USERNAME)
            .field('newPassword', '')
            .field('cover', '')
            .field('pfp', '');

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({newData: {username: NEW_USERNAME}});

        // new password
        const NEW_PASSWORD = '$aB1cccaaaaaaaaa'; // old password = !aB0aaaaaaaaaaaa
        test_user1_data.password = crypto.createHash('sha256').update(NEW_PASSWORD).digest('hex');

        response = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .field('newUsername', '')
            .field('newPassword', NEW_PASSWORD)
            .field('cover', '')
            .field('pfp', '');

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({newData: {}}); // password is sensitive info so it's not returned

        // new cover
        response = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .field('newUsername', '')
            .field('newPassword', '')
            .attach('cover', shared.getProfileTestDataURI('cover1.jpg'))
            .field('pfp', '');

        shared.expectJSONResponse(response);

        expect(response.body.newData !== undefined && Object.keys(response.body.newData).length === 1 && response.body.newData.cover !== undefined).toBe(true);

        UPLOADED_FILES['cover'] = response.body.newData.cover;

        // new pfp
        response = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user1_data.loginToken)
            .field('newUsername', '')
            .field('newPassword', '')
            .field('cover', '')
            .attach('pfp', shared.getProfileTestDataURI('pfp1.jpg'));

        shared.expectJSONResponse(response);

        expect(response.body.newData !== undefined && Object.keys(response.body.newData).length === 1 && response.body.newData.pfp !== undefined).toBe(true);

        UPLOADED_FILES['pfp'] = response.body.newData.pfp;

        // verify changes in database
        const DATABASE = mongo_client.db('socialmedia');
        const USERS_COLLECTION = DATABASE.collection('Users');

        const TEST_USER = await USERS_COLLECTION.findOne({uid: test_user1_data.uid}, {projection: {_id: 0, uid: 0}});

        expect(TEST_USER !== null).toBe(true);

        expect(TEST_USER).toEqual({
            username: NEW_USERNAME,
            password: test_user1_data.password, // hashed version of new password
            cover: UPLOADED_FILES.cover,
            pfp: UPLOADED_FILES.pfp
        });

        // delete uploaded files
        Object.values(UPLOADED_FILES).forEach((filename) => {
            fs.unlink(shared.getProfileUploadURI(filename), () => {});
        });
    });
});

describe("Account Profile Upload Removal", () => {
    it("No login token passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', '').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Pass login token and invalid request bodies. Return 200 and an empty JSON object", async () => {
        // no body
        let response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user1_data.loginToken).send();
        shared.expectEmptyJSONResponse(response);

        // empty body
        response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user1_data.loginToken).send({});
        shared.expectEmptyJSONResponse(response);

        // empty fields
        response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user1_data.loginToken).send({type: '', target: ''});
        shared.expectEmptyJSONResponse(response);

        // missing type field
        response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user1_data.loginToken).send({target: ''});
        shared.expectEmptyJSONResponse(response);

        // missing target field
        response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user1_data.loginToken).send({type: ''});
        shared.expectEmptyJSONResponse(response);

        // unknown type
        response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user1_data.loginToken).send({type: crypto.randomBytes(3).toString('hex'), target: ''});
        shared.expectEmptyJSONResponse(response);

        // unknown target
        response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user1_data.loginToken).send({type: 'profile', target: crypto.randomBytes(3).toString('hex')});
        shared.expectEmptyJSONResponse(response);
    });

    it("Pass login token of user that doesn't exist. Return 200 and an empty JSON object", async () => {
        const LOGIN_TOKEN = jwt.sign(
            {uid: crypto.randomBytes(5).toString('hex')},
            process.env.PORTFOLIO_SOCIAL_MEDIA_LTS
        );

        const RESPONSE = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', `LT=${LOGIN_TOKEN}`).send({type: 'profile', target: 'pfp'});
        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Remove non-existent profile uploads. Return 200 and an error message", async () => {
        // non-existent cover
        let response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user2_data.loginToken).send({type: 'profile', target: 'cover'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Cover doesn't exist"});

        // non-existent pfp
        response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user2_data.loginToken).send({type: 'profile', target: 'pfp'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Profile picture doesn't exist"});
    });

    it("Remove profile uploads. Return 200 and an empty JSON object", async () => {
        // upload pfp and cover
        const UPLOAD_RESPONSE = await request(shared.BACKEND_URL)
            .put('/account/update').set('Cookie', test_user2_data.loginToken)
            .field('newUsername', '')
            .field('newPassword', '')
            .attach('cover', shared.getProfileTestDataURI('cover2.jpg'))
            .attach('pfp', shared.getProfileTestDataURI('pfp2.jpg'));

        shared.expectJSONResponse(UPLOAD_RESPONSE);

        expect(UPLOAD_RESPONSE.body.newData !== undefined && Object.keys(UPLOAD_RESPONSE.body.newData).length === 2 && UPLOAD_RESPONSE.body.newData.cover !== undefined && UPLOAD_RESPONSE.body.newData.pfp !== undefined).toBe(true);

        // verify uploads in database
        const DATABASE = mongo_client.db('socialmedia');
        const USERS_COLLECTION = DATABASE.collection('Users');

        let test_user_data = await USERS_COLLECTION.findOne({uid: test_user2_data.uid, cover: UPLOAD_RESPONSE.body.newData.cover, pfp: UPLOAD_RESPONSE.body.newData.pfp});
        expect(test_user_data).not.toEqual(null);

        // verify uploads in file system
        expect(fs.existsSync(shared.getProfileUploadURI(UPLOAD_RESPONSE.body.newData.cover))).toBe(true);
        expect(fs.existsSync(shared.getProfileUploadURI(UPLOAD_RESPONSE.body.newData.pfp))).toBe(true);

        // remove cover
        let removal_response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user2_data.loginToken).send({type: 'profile', target: 'cover'});
        shared.expectEmptyJSONResponse(removal_response);

        // remove pfp
        removal_response = await request(shared.BACKEND_URL).put('/account/remove').set('Cookie', test_user2_data.loginToken).send({type: 'profile', target: 'pfp'});
        shared.expectEmptyJSONResponse(removal_response);

        // verify removal from database
        test_user_data = await USERS_COLLECTION.findOne({uid: test_user2_data.uid, cover: '', pfp: ''});
        expect(test_user_data).not.toEqual(null);

        // verify removal from file system
        expect(fs.existsSync(shared.getProfileUploadURI(UPLOAD_RESPONSE.body.newData.cover))).toBe(false);
        expect(fs.existsSync(shared.getProfileUploadURI(UPLOAD_RESPONSE.body.newData.pfp))).toBe(false);
    });
});
