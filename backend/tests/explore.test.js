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
    test_user1_data = await shared.createTestUser(`${crypto.randomBytes(2).toString('hex').concat('usemefortesting')}`, '!aB0aaaaaaaaaaaa');
    test_user2_data = await shared.createTestUser(`${crypto.randomBytes(2).toString('hex').concat('usemefortesting')}`, '!aB0aaaaaaaaaaaa');

    mongo_client = await shared.openDatabaseConnection();

    // create a test posts
    let post_response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user1_data.loginToken)
        .field('postBody', "I went on holidays with my friends! We did bvwieibfw and swam at the beach.")
        .field('postTags', 'explore, jfiojoif, adventure');

    shared.expectEmptyJSONResponse(post_response);

    post_response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user2_data.loginToken)
        .field('postBody', "What its like studying Computer Science")
        .field('postTags', 'explore, academic, tech, sharedtag4testing');

    shared.expectEmptyJSONResponse(post_response);

    post_response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user2_data.loginToken)
        .field('postBody', "This post won't appear in the explore page because of bvwieibfw")
        .field('postTags', 'onlyvisibleinprofilepage, kindahidden, sharedtag4testing');

    shared.expectEmptyJSONResponse(post_response);

    // save test post data locally
    const POSTS_COLLECTION = mongo_client.db('socialmedia').collection('Posts');

    test_post1_data = await POSTS_COLLECTION.findOne({body: "I went on holidays with my friends! We did bvwieibfw and swam at the beach."});
    test_post2_data = await POSTS_COLLECTION.findOne({body: "What its like studying Computer Science"});
    test_post3_data = await POSTS_COLLECTION.findOne({body: "This post won't appear in the explore page because of bvwieibfw"});

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

    it("Verify liked post. Return 200 and list of posts (one of which has a like)", async () => {
        // like a post
        let post_like_response = await request(shared.BACKEND_URL).put('/post/like').set('Cookie', test_user1_data.loginToken).send({pid: test_post1_data.pid});

        shared.expectJSONResponse(post_like_response);

        expect(post_like_response.body).toEqual({
            action: 'added',
            count: 1
        });

        // retrieve list of posts and verify the like exists
        const RESPONSE = await request(shared.BACKEND_URL).get('/explore').set('Cookie', test_user1_data.loginToken).send();

        shared.expectJSONResponse(RESPONSE);
        expect(RESPONSE.body.posts !== undefined && Array.isArray(RESPONSE.body.posts)).toBe(true);

        let liked_post = undefined;

        RESPONSE.body.posts.forEach((postData) => {
            if (postData.pid === test_post1_data.pid) {
                liked_post = postData;
            }
        });

        expect(liked_post !== undefined && liked_post.likedByUser).toBe(true);

        // unlike the post
        post_like_response = await request(shared.BACKEND_URL).put('/post/like').set('Cookie', test_user1_data.loginToken).send({pid: test_post1_data.pid});

        shared.expectJSONResponse(post_like_response);

        expect(post_like_response.body).toEqual({
            action: 'removed',
            count: 0
        });
    });
});

describe("Manual Search (occurs when user clicks on the search bar's button)", () => {
    it("Searching by tag. Return 200 and a list of posts or an empty JSON object", async () => {
        // tag not on any post
        let response = await request(shared.BACKEND_URL).get(`/explore/${encodeURIComponent('#doesntexist')}`).send();

        shared.expectEmptyJSONResponse(response);

        // unique tag (on test post 1)
        response = await request(shared.BACKEND_URL).get(`/explore/${encodeURIComponent('#jfiojoif')}`).send();

        shared.expectJSONResponse(response);
        expect(Array.isArray(response.body.result) && response.body.result.length === 1).toBe(true);

        let search_result = response.body.result[0];

        expect(search_result.username === test_user1_data.username && search_result.pfp === '').toBe(true);
        expect(search_result.pid === test_post1_data.pid && search_result.body === test_post1_data.body && search_result.date === test_post1_data.date && search_result.likes === test_post1_data.likes.length).toBe(true);
        expect(search_result.tags).toEqual(test_post1_data.tags);

        // shared tag (on test posts 2 and 3)
        response = await request(shared.BACKEND_URL).get(`/explore/${encodeURIComponent('#sharedtag4test')}`).send(); // the substring 'sharedtag4test' is present in at least one tag of each post

        shared.expectJSONResponse(response);
        expect(Array.isArray(response.body.result) && response.body.result.length === 2).toBe(true);
    });

    it ("Searching by post body. Return 200 and a list of posts or an empty JSON object", async () => {
        // body substring not on any post
        let response = await request(shared.BACKEND_URL).get(`/explore/${encodeURIComponent(crypto.randomBytes(10).toString('hex'))}`).send();

        shared.expectEmptyJSONResponse(response);

        // unique body substring (on test post 2)
        response = await request(shared.BACKEND_URL).get(`/explore/${encodeURIComponent('Computer Science')}`).send();

        shared.expectJSONResponse(response);
        expect(Array.isArray(response.body.result) && response.body.result.length === 1).toBe(true);

        search_result = response.body.result[0];

        expect(search_result.username === test_user2_data.username && search_result.pfp === '').toBe(true);
        expect(search_result.pid === test_post2_data.pid && search_result.body === test_post2_data.body && search_result.date === test_post2_data.date && search_result.likes === test_post2_data.likes.length).toBe(true);
        expect(search_result.tags).toEqual(test_post2_data.tags);

        // shared body substring (on test posts 1 and 3)
        response = await request(shared.BACKEND_URL).get(`/explore/${encodeURIComponent('bvwieibfw')}`).send();

        shared.expectJSONResponse(response);
        expect(Array.isArray(response.body.result) && response.body.result.length === 2).toBe(true);
    });
});

describe("Auto Search (occurs while user is typing in the search bar)", () => {
    it("Searching by tag. Return 200 and a list of posts or an empty JSON object", async () => {
        // tag not on any post
        let response = await request(shared.BACKEND_URL).get(`/search/${encodeURIComponent('#doesntexist')}`).send();

        shared.expectEmptyJSONResponse(response);

        // unique tag (on test post 1)
        response = await request(shared.BACKEND_URL).get(`/search/${encodeURIComponent('#jfiojoif ignoredbodysubstring #ignoredtag')}`).send();

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({
            type: 'tag',
            result: [
                {
                    pid: test_post1_data.pid,
                    body: test_post1_data.body,
                    username: test_user1_data.username
                }
            ]
        });

        // shared tag (on test posts 2 and 3)
        response = await request(shared.BACKEND_URL).get(`/search/${encodeURIComponent('#sharedtag4')}`).send();

        shared.expectJSONResponse(response);

        expect(response.body.result.length).toEqual(2);
    });

    it("Searching by user. Return 200 and a list of posts or an empty JSON object", async () => {
        // non-existing user
        let response = await request(shared.BACKEND_URL).get(`/search/${encodeURIComponent('#doesntexist')}`).send();

        shared.expectEmptyJSONResponse(response);

        // exact user match
        let search_query = encodeURIComponent(`@${test_user1_data.username} @ignoreduser ignoredbodysubstring #ignoredtag`);
        response = await request(shared.BACKEND_URL).get(`/search/${search_query}`).send();

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({
            type: 'user',
            result: [
                {
                    username: test_user1_data.username,
                    pfp: ''
                }
            ]
        });

        // multiple users (using a username substring)
        search_query = encodeURIComponent('@usemefortesting');
        response = await request(shared.BACKEND_URL).get(`/search/${search_query}`).send();

        shared.expectJSONResponse(response);

        expect(response.body.result.length).toEqual(2);
    });

    it("Searching by body substring. Return 200 and a list of posts or an empty JSON object", async () => {
        // body substring not on any post
        let response = await request(shared.BACKEND_URL).get(`/search/${encodeURIComponent('doesntexistabcdefg123')}`).send();

        shared.expectEmptyJSONResponse(response);

        // shared body substring (on test posts 1 and 3)
        response = await request(shared.BACKEND_URL).get(`/search/${encodeURIComponent('bvwieibfw')}`).send();

        shared.expectJSONResponse(response);

        expect(response.body.type).toEqual('content');

        expect(Array.isArray(response.body.result) && response.body.result.length === 2).toBe(true);

        expect(response.body.result.every((data) => {
            if ((data.pid === test_post1_data.pid && data.body === test_post1_data.body && data.username === test_user1_data.username) || (data.pid === test_post3_data.pid && data.body === test_post3_data.body && data.username === test_user2_data.username)) {
                return true;
            }

            return false;

        })).toBe(true);
    });
});
