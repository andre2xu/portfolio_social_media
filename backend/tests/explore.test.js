const shared = require('./shared.test');
const request = require('supertest');
const crypto = require('crypto');



// NOTE: Start the server first before running the tests

let test_user1_data = {};
let test_user2_data = {};
let test_post1_data = {};
let test_post2_data = {};
let test_post3_data = {};
let mongo_client = undefined;

beforeAll(async () => {
    // create test users
    test_user1_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');
    test_user2_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');

    mongo_client = await shared.openDatabaseConnection();

    // create a test posts
    let post_response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user1_data.loginToken)
        .field('postBody', "I went on holidays with my friends!")
        .field('postTags', 'explore, funny, adventure');

    shared.expectEmptyJSONResponse(post_response);

    post_response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user2_data.loginToken)
        .field('postBody', "What its like studying Computer Science")
        .field('postTags', 'explore, academic, tech');

    shared.expectEmptyJSONResponse(post_response);

    post_response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user2_data.loginToken)
        .field('postBody', "This post won't appear in the explore page")
        .field('postTags', 'onlyvisibleinprofilepage, kindahidden');

    shared.expectEmptyJSONResponse(post_response);

    // save test post data locally
    const POSTS_COLLECTION = mongo_client.db('socialmedia').collection('Posts');

    test_post1_data = await POSTS_COLLECTION.findOne({body: "I went on holidays with my friends!"});
    test_post2_data = await POSTS_COLLECTION.findOne({body: "What its like studying Computer Science"});
    test_post3_data = await POSTS_COLLECTION.findOne({body: "This post won't appear in the explore page"});

    expect(test_post1_data !== null && Object.keys(test_post1_data).length > 0).toBe(true);
    expect(test_post2_data !== null && Object.keys(test_post2_data).length > 0).toBe(true);
    expect(test_post3_data !== null && Object.keys(test_post3_data).length > 0).toBe(true);
});

afterAll(async () => {
    shared.deleteTestUsers([
        test_user1_data.uid,
        test_user2_data.uid
    ]);

    mongo_client.close();

    // delete test posts
    const POSTS_COLLECTION = mongo_client.db('socialmedia').collection('Posts');

    await POSTS_COLLECTION.deleteMany({pid: {$in: [
        test_post1_data.pid,
        test_post2_data.pid,
        test_post3_data.pid
    ]}});
});

describe("Explore Page", () => {
    it("Retrieving all posts. Return 200 and list of posts", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/explore').send();

        shared.expectJSONResponse(RESPONSE);

        expect(RESPONSE.body.posts !== undefined && Array.isArray(RESPONSE.body.posts)).toBe(true);
    });
});
