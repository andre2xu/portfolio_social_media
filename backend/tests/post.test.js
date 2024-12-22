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
        // no request body
        let response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Post body missing"});

        // post body with no content
        response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken).send({postBody: ''});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Post body missing"});

        // post body with too many characters
        response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken).send({postBody: crypto.randomBytes(500).toString('hex')});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Only 500 characters are allowed for the body"});

        // missing tags
        response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken).send({postBody: 'a'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Post tags missing"});

        // invalid tag
        response = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken).send({postBody: 'a', postTags: 'valid tag with space, invalid_tag, validtag3'});

        shared.expectJSONResponse(response);
        expect(response.body).toEqual({errorMessage: "Only letters, numbers, spaces, and commas are allowed for tags"});
    });

    it("Making a post with no media. Return 200 and an empty JSON object.", async () => {
        const POST_BODY = "This is a new post.";
        const POST_TAGS = ['tag1', 'tag2', 'tag3'];

        const RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
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
        const POST_BODY = "This is a new post.";
        const POST_TAGS = ['tag1', 'tag2', 'tag3'];

        const RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
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
        const POST_BODY = "This is a new post.";
        const POST_TAGS = ['tag1', 'tag2', 'tag3'];

        const RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
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
        // test user has no post
        let post_retrieval_response = await request(shared.BACKEND_URL).get(`/post/${test_user_data.username}`).send();

        shared.expectEmptyJSONResponse(post_retrieval_response);

        // make a post (with no media) for the test user
        const POST_BODY = "Just a test";
        const POST_TAGS = 'tag1, tag2, tag3';

        const POST_RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
            .field('postBody', POST_BODY)
            .field('postTags', POST_TAGS);

        shared.expectEmptyJSONResponse(POST_RESPONSE);

        // retrieve the test user's posts (a list) and verify it has the one that was made
        post_retrieval_response = await request(shared.BACKEND_URL).get(`/post/${test_user_data.username}`).send();

        shared.expectJSONResponse(post_retrieval_response);

        expect(post_retrieval_response.body.posts !== undefined && Array.isArray(post_retrieval_response.body.posts) && post_retrieval_response.body.posts.length === 1).toBe(true);

        const POST = post_retrieval_response.body.posts[0];

        expect(POST.body).toEqual(POST_BODY);
        expect(POST.tags.join(', ')).toEqual(POST_TAGS);

        // make the test user like the post
        const LIKE_RESPONSE = await request(shared.BACKEND_URL).put('/post/like').set('Cookie', test_user_data.loginToken).send({pid: POST.pid});

        shared.expectJSONResponse(LIKE_RESPONSE);

        // retrieve the post again and check if it has the test user's like (login token required)
        post_retrieval_response = await request(shared.BACKEND_URL).get(`/post/${test_user_data.username}`).set('Cookie', test_user_data.loginToken).send();

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

    it("Passing the login token of a user that exists. Return 200 and an empty JSON object or a list of their posts.", async () => {
        // test user has no post
        let post_retrieval_response = await request(shared.BACKEND_URL).get('/post').set('Cookie', test_user_data.loginToken).send();

        shared.expectEmptyJSONResponse(post_retrieval_response);

        // make a post (with no media) for the test user
        const POST_BODY = "Just a test";
        const POST_TAGS = 'tag1, tag2, tag3';

        const POST_RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
            .field('postBody', POST_BODY)
            .field('postTags', POST_TAGS);

        shared.expectEmptyJSONResponse(POST_RESPONSE);

        // retrieve the test user's posts (a list) and verify it has the one that was made
        post_retrieval_response = await request(shared.BACKEND_URL).get('/post').set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(post_retrieval_response);

        expect(post_retrieval_response.body.posts !== undefined && Array.isArray(post_retrieval_response.body.posts) && post_retrieval_response.body.posts.length === 1).toBe(true);

        const POST = post_retrieval_response.body.posts[0];

        expect(POST.body).toEqual(POST_BODY);
        expect(POST.tags.join(', ')).toEqual(POST_TAGS);

        // make the test user like the post
        const LIKE_RESPONSE = await request(shared.BACKEND_URL).put('/post/like').set('Cookie', test_user_data.loginToken).send({pid: POST.pid});

        shared.expectJSONResponse(LIKE_RESPONSE);

        // retrieve the post again and check if it has the test user's like (login token required)
        post_retrieval_response = await request(shared.BACKEND_URL).get('/post').set('Cookie', test_user_data.loginToken).send();

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

describe("Post Deletion", () => {
    it("No login token passed. Return 200 and a fail status", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).delete(`/post/abc`).send();

        shared.expectJSONResponse(RESPONSE);

        expect(RESPONSE.body).toEqual({status: 'failed'});
    });

    it("Deleting a post that doesn't exist or isn't owned by the requesting user. Return 200 and a fail status", async () => {
        // non-existent post id
        let response = await request(shared.BACKEND_URL).delete(`/post/abc`).set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({status: 'failed'});

        // create a temporary real post
        const POST_CREATION_RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
            .field('postBody', "Delete me plz.")
            .field('postTags', 'tag1, tag2, tag3');

        shared.expectEmptyJSONResponse(POST_CREATION_RESPONSE);

        const DATABASE = mongo_client.db('socialmedia');
        const POSTS_COLLECTION = DATABASE.collection('Posts');

        const POST = await POSTS_COLLECTION.findOne({uid: test_user_data.uid});
        expect(POST).not.toEqual(null);

        // non-existent user (i.e. user who doesn't own the temporary post)
        const LOGIN_TOKEN = jwt.sign(
            {uid: 'idontexist'},
            process.env.LTS
        );

        response = await request(shared.BACKEND_URL).delete(`/post/${POST.pid}`).set('Cookie', `LT=${LOGIN_TOKEN}`).send();

        shared.expectJSONResponse(response);

        expect(response.body).toEqual({status: 'failed'});

        // delete temporary post
        await POSTS_COLLECTION.deleteOne({pid: POST.pid});
    });

    it("Delete post with no media. Return 200 and a success status", async () => {
        const DATABASE = mongo_client.db('socialmedia');
        const POSTS_COLLECTION = DATABASE.collection('Posts');

        // create a temporary post
        const POST_CREATION_RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
            .field('postBody', "Delete me plz.")
            .field('postTags', 'tag1, tag2, tag3');

        shared.expectEmptyJSONResponse(POST_CREATION_RESPONSE);

        let post = await POSTS_COLLECTION.findOne({uid: test_user_data.uid});
        expect(post).not.toEqual(null);

        // delete the post
        const POST_DELETION_RESPONSE = await request(shared.BACKEND_URL).delete(`/post/${post.pid}`).set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(POST_DELETION_RESPONSE);

        expect(POST_DELETION_RESPONSE.body).toEqual({status: 'success'});

        // verify deletion
        post = await POSTS_COLLECTION.findOne({uid: test_user_data.uid, pid: post.pid});

        expect(post).toEqual(null);
    });

    it("Delete post with media. Return 200 and a success status", async () => {
        const DATABASE = mongo_client.db('socialmedia');
        const POSTS_COLLECTION = DATABASE.collection('Posts');

        // create a temporary post
        const POST_CREATION_RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
            .field('postBody', "Delete me plz.")
            .field('postTags', 'tag1, tag2, tag3')
            .attach('postMedia', shared.getPostTestDataURI('img.jpg'));

        shared.expectEmptyJSONResponse(POST_CREATION_RESPONSE);

        let post = await POSTS_COLLECTION.findOne({uid: test_user_data.uid});
        expect(post).not.toEqual(null);

        const UPLOADED_MEDIA = post.media[0].src;

        expect(fs.existsSync(shared.getPostMediaURI(UPLOADED_MEDIA), () => {})).toBe(true);

        // delete the post
        const POST_DELETION_RESPONSE = await request(shared.BACKEND_URL).delete(`/post/${post.pid}`).set('Cookie', test_user_data.loginToken).send();

        shared.expectJSONResponse(POST_DELETION_RESPONSE);

        expect(POST_DELETION_RESPONSE.body).toEqual({status: 'success'});

        // verify deletion
        post = await POSTS_COLLECTION.findOne({uid: test_user_data.uid, pid: post.pid});

        expect(post).toEqual(null);
        expect(fs.existsSync(shared.getPostMediaURI(UPLOADED_MEDIA), () => {})).toBe(false);
    });
});

describe("Liking Post", () => {
    it("No login token passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).put('/post/like').send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("No post id passed. Return 200 and an empty JSON object", async () => {
        const RESPONSE = await request(shared.BACKEND_URL).put('/post/like').set('Cookie', test_user_data.loginToken).send();

        shared.expectEmptyJSONResponse(RESPONSE);
    });

    it("Adding/removing a like. Return 200, action taken (added/removed), and the post's number of likes", async () => {
        const DATABASE = mongo_client.db('socialmedia');
        const POSTS_COLLECTION = DATABASE.collection('Posts');

        // create a temporary post
        const POST_CREATION_RESPONSE = await request(shared.BACKEND_URL).post('/post').set('Cookie', test_user_data.loginToken)
            .field('postBody', "Like me plz.")
            .field('postTags', 'tag1, tag2, tag3');

        shared.expectEmptyJSONResponse(POST_CREATION_RESPONSE);

        const POST = await POSTS_COLLECTION.findOne({uid: test_user_data.uid});
        expect(POST).not.toEqual(null);
        expect(Array.isArray(POST.likes) && POST.likes.length === 0).toBe(true);

        // like the post
        let post_like_response = await request(shared.BACKEND_URL).put('/post/like').set('Cookie', test_user_data.loginToken).send({pid: POST.pid});

        shared.expectJSONResponse(post_like_response);

        expect(post_like_response.body).toEqual({
            action: 'added',
            count: 1
        });

        // unlike the post
        post_like_response = await request(shared.BACKEND_URL).put('/post/like').set('Cookie', test_user_data.loginToken).send({pid: POST.pid});

        shared.expectJSONResponse(post_like_response);

        expect(post_like_response.body).toEqual({
            action: 'removed',
            count: 0
        });

        // delete the post
        await POSTS_COLLECTION.deleteOne({pid: POST.pid});
    });
});
