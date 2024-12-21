const request = require('supertest');
const shared = require('./shared.test');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');



// NOTE: Start the server first before running the tests

let test_user_data = {};
let mongo_client = undefined;

beforeAll(async () => {
    test_user_data = await shared.createTestUser(crypto.randomBytes(5).toString('hex'), '!aB0aaaaaaaaaaaa');

    mongo_client = await shared.openDatabaseConnection();
});

afterAll(async () => {
    shared.deleteTestUsers([test_user_data.uid]);

    mongo_client.close();
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

    it("Making a post with no media. Return 200 and an empty JSON object.", async () => {
        const LOGIN_TOKEN = jwt.sign(
            {uid: test_user_data.uid},
            process.env.LTS
        );

        const POST_BODY = "This is a new post.";
        const POST_TAGS = ['tag1', 'tag2', 'tag3'];

        const RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`)
            .field('postBody', POST_BODY)
            .field('postTags', POST_TAGS.join(', '));

        shared.expectEmptyJSONResponse(RESPONSE);

        // verify in database
        const DATABASE = mongo_client.db('socialmedia');
        const POSTS_COLLECTION = DATABASE.collection('Posts');

        const POST = await POSTS_COLLECTION.findOne({uid: test_user_data.uid}, {projection: {_id: 0}});

        await POSTS_COLLECTION.deleteOne({uid: test_user_data.uid});

        expect(POST).not.toEqual(null);
        expect(POST.body !== undefined && POST.body === POST_BODY).toBe(true);
        expect(POST.tags !== undefined && POST.tags.every((element, index) => POST_TAGS[index] === element)).toBe(true);
    });

    it("Making a post with an image media. Return 200 and an empty JSON object.", async () => {
        const LOGIN_TOKEN = jwt.sign(
            {uid: test_user_data.uid},
            process.env.LTS
        );

        const POST_BODY = "This is a new post.";
        const POST_TAGS = ['tag1', 'tag2', 'tag3'];

        const RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`)
            .field('postBody', POST_BODY)
            .field('postTags', POST_TAGS.join(', '))
            .attach('postMedia', shared.getPostTestDataURI('img.jpg'));

        shared.expectEmptyJSONResponse(RESPONSE);

        // verify in database
        const DATABASE = mongo_client.db('socialmedia');
        const POSTS_COLLECTION = DATABASE.collection('Posts');

        const POST = await POSTS_COLLECTION.findOne({uid: test_user_data.uid}, {projection: {_id: 0}});

        await POSTS_COLLECTION.deleteOne({uid: test_user_data.uid});

        expect(POST).not.toEqual(null);

        expect(POST.body !== undefined && POST.body === POST_BODY).toBe(true);

        expect(POST.tags !== undefined && POST.tags.every((element, index) => POST_TAGS[index] === element)).toBe(true);

        expect(POST.media !== undefined && Array.isArray(POST.media) && POST.media.length === 1).toBe(true);

        expect(POST.media[0].src !== undefined && POST.media[0].type !== undefined).toBe(true);

        // verify uploaded image in file system
        const UPLOADED_IMAGE = shared.getPostMediaURI(POST.media[0].src);

        expect(fs.existsSync(UPLOADED_IMAGE)).toBe(true);

        // delete uploaded image
        fs.unlink(UPLOADED_IMAGE, () => {});
    });

    it("Making a post with a video media. Return 200 and an empty JSON object.", async () => {
        const LOGIN_TOKEN = jwt.sign(
            {uid: test_user_data.uid},
            process.env.LTS
        );

        const POST_BODY = "This is a new post.";
        const POST_TAGS = ['tag1', 'tag2', 'tag3'];

        const RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`)
            .field('postBody', POST_BODY)
            .field('postTags', POST_TAGS.join(', '))
            .attach('postMedia', shared.getPostTestDataURI('vid.mp4'));

        shared.expectEmptyJSONResponse(RESPONSE);

        // verify in database
        const DATABASE = mongo_client.db('socialmedia');
        const POSTS_COLLECTION = DATABASE.collection('Posts');

        const POST = await POSTS_COLLECTION.findOne({uid: test_user_data.uid}, {projection: {_id: 0}});

        await POSTS_COLLECTION.deleteOne({uid: test_user_data.uid});

        expect(POST).not.toEqual(null);

        expect(POST.body !== undefined && POST.body === POST_BODY).toBe(true);

        expect(POST.tags !== undefined && POST.tags.every((element, index) => POST_TAGS[index] === element)).toBe(true);

        expect(POST.media !== undefined && Array.isArray(POST.media) && POST.media.length === 1).toBe(true);

        expect(POST.media[0].src !== undefined && POST.media[0].type !== undefined).toBe(true);

        // verify uploaded video in file system
        const UPLOADED_VIDEO = shared.getPostMediaURI(POST.media[0].src);

        expect(fs.existsSync(UPLOADED_VIDEO)).toBe(true);

        // delete uploaded video
        fs.unlink(UPLOADED_VIDEO, () => {});
    });
});

describe("Post Retrieval", () => {
    it("No login token or username. Return 200 and an empty JSON object.", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/post').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Passing the username of a user that doesn't exist. Return 200 and an empty JSON object.", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).get('/post/idontexist').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Passing the username of a user that exists. Return 200 and an empty JSON object or a list of their posts.", async () => {
        const LOGIN_TOKEN = jwt.sign(
            {uid: test_user_data.uid},
            process.env.LTS
        );

        // test user has no post
        let post_retrieval_response = await request(shared.BACKEND_URL).get(`/post/${test_user_data.username}`).send();

        shared.expectEmptyJSONResponse(post_retrieval_response);

        // make a post (with no media) for the test user
        const POST_BODY = "Just a test";
        const POST_TAGS = 'tag1, tag2, tag3';

        const POST_RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', `LT=${LOGIN_TOKEN}`)
            .field('postBody', POST_BODY)
            .field('postTags', POST_TAGS);

        shared.expectEmptyJSONResponse(POST_RESPONSE);

        // retrieve a list of the user's posts and verify it has the one that was made
        post_retrieval_response = await request(shared.BACKEND_URL).get(`/post/${test_user_data.username}`).send();

        shared.expectJSONResponse(post_retrieval_response);

        expect(post_retrieval_response.body.posts !== undefined && Array.isArray(post_retrieval_response.body.posts) && post_retrieval_response.body.posts.length === 1).toBe(true);

        const POST = post_retrieval_response.body.posts[0];

        expect(POST.body).toEqual(POST_BODY);
        expect(POST.tags.join(', ')).toEqual(POST_TAGS);

        // make the test user like the post
        const LIKE_RESPONSE = await request(shared.BACKEND_URL).put('/post/like').set('Cookie', `LT=${LOGIN_TOKEN}`).send({pid: POST.pid});

        shared.expectJSONResponse(LIKE_RESPONSE);

        // retrieve the post again and check if it has the test user's like (login token required)
        post_retrieval_response = await request(shared.BACKEND_URL).get(`/post/${test_user_data.username}`).set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectJSONResponse(post_retrieval_response);

        expect(post_retrieval_response.body.likedPosts !== undefined).toBe(true);

        expect(Array.isArray(post_retrieval_response.body.posts[0].likes) && post_retrieval_response.body.posts[0].likes.includes(test_user_data.uid)).toBe(true);

        const LIKED_POSTS = post_retrieval_response.body.likedPosts;

        expect(Array.isArray(LIKED_POSTS) && LIKED_POSTS.length === 1 && LIKED_POSTS.includes(POST.pid)).toBe(true);

        // delete the post
        const DATABASE = mongo_client.db('socialmedia');
        const POSTS_COLLECTION = DATABASE.collection('Posts');

        await POSTS_COLLECTION.deleteOne({uid: test_user_data.uid});
    });
});
