import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import shared from '../shared';
import { useNavigate, useParams } from 'react-router-dom';

// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';

// general views
import Comment from '../components/Comment';



function Comments({displayConfirmationDialog}) {
    const [comments, loadComments] = React.useState([]);

    const URL_PARAMETERS = useParams();
    const redirectTo = useNavigate();

    function onClickPost(event) {
        const ELEMENT_CLICKED = event.target;

        if (ELEMENT_CLICKED instanceof HTMLImageElement) {
            if (ELEMENT_CLICKED.alt === 'Like Icon') {
                // like or unlike a post

                axios.put(shared.resolveBackendRoute('/post/like'), {pid: URL_PARAMETERS.pid}, {withCredentials: true})
                .then((response) => {
                    if (response.status === 200 && 'action' in response.data && 'count' in response.data) {
                        const LIKES_CONTAINER = $('#comments-screen-post .post-info .likes');
                        const NO_FILL_LIKE_BUTTON = LIKES_CONTAINER.children('.no-fill').first();
                        const FILL_LIKE_BUTTON = LIKES_CONTAINER.children('.fill').first();
                        const LIKE_COUNTER = LIKES_CONTAINER.children('span').first();

                        switch (response.data.action) {
                            case 'added':
                                NO_FILL_LIKE_BUTTON.addClass('hide');
                                FILL_LIKE_BUTTON.removeClass('hide');
                                break;
                            case 'removed':
                                FILL_LIKE_BUTTON.addClass('hide');
                                NO_FILL_LIKE_BUTTON.removeClass('hide');
                                break;
                            default:
                        }

                        LIKE_COUNTER.text(response.data.count);
                    }
                });
            }
        }
    };

    function onClickComment(event) {
        event.preventDefault();

        const ELEMENT_CLICKED = event.target;
        const COMMENT = $(ELEMENT_CLICKED).closest('.comment');
        const COMMENT_ID = COMMENT.data('cid');

        if (ELEMENT_CLICKED instanceof HTMLButtonElement && ELEMENT_CLICKED.innerText === 'Delete') {
            displayConfirmationDialog(
                () => {
                    axios.delete(shared.resolveBackendRoute(`/comments/${COMMENT_ID}`), {withCredentials: true})
                    .then((response) => {
                        if (response.status === 200 && 'status' in response.data && response.data.status === 'success') {
                            // delete comment
                            COMMENT.remove();

                            // update comment count on post
                            const COMMENT_COUNT = $('#comments-screen-post .post-info .comments span').first();
                            const CURRENT_COUNT = parseInt(COMMENT_COUNT.text());

                            COMMENT_COUNT.text(CURRENT_COUNT - 1);
                        }
                    });
                },
                () => {},
                "Are you sure you want to delete this comment?"
            );
        }
        else if (ELEMENT_CLICKED instanceof HTMLImageElement) {
            const LIKES_CONTAINER = $(`#comments-screen-comments [data-cid="${COMMENT_ID}"] .likes`);
            const NO_FILL_LIKE_BUTTON = LIKES_CONTAINER.children('.no-fill').first();
            const FILL_LIKE_BUTTON = LIKES_CONTAINER.children('.fill').first();
            const LIKE_COUNTER = LIKES_CONTAINER.children('span').first();

            const DISLIKES_CONTAINER = LIKES_CONTAINER.siblings('.dislikes');
            const NO_FILL_DISLIKE_BUTTON = DISLIKES_CONTAINER.children('.no-fill').first();
            const FILL_DISLIKE_BUTTON = DISLIKES_CONTAINER.children('.fill').first();
            const DISLIKE_COUNTER = DISLIKES_CONTAINER.children('span').first();

            if (ELEMENT_CLICKED.alt === 'Like Icon') {
                axios.put(shared.resolveBackendRoute(`/comments/like`), {cid: COMMENT_ID}, {withCredentials: true})
                .then((response) => {
                    if (response.status === 200 && 'action' in response.data && 'count' in response.data) {
                        switch (response.data.action) {
                            case 'added':
                                NO_FILL_LIKE_BUTTON.addClass('hide');
                                FILL_LIKE_BUTTON.removeClass('hide');
                                COMMENT.data('likedbyuser', true);

                                // remove dislike
                                if (COMMENT.data('dislikedbyuser') === true) {
                                    NO_FILL_DISLIKE_BUTTON.removeClass('hide');
                                    FILL_DISLIKE_BUTTON.addClass('hide');

                                    const CURRENT_DISLIKE_COUNT = parseInt(DISLIKE_COUNTER.text());
                                    if (CURRENT_DISLIKE_COUNT > 0) DISLIKE_COUNTER.text(CURRENT_DISLIKE_COUNT - 1);

                                    COMMENT.removeData('dislikedbyuser');
                                }

                                break;
                            case 'removed':
                                FILL_LIKE_BUTTON.addClass('hide');
                                NO_FILL_LIKE_BUTTON.removeClass('hide');
                                COMMENT.removeData('likedbyuser');
                                break;
                            default:
                        }

                        LIKE_COUNTER.text(response.data.count);
                    }
                });
            }
            else if (ELEMENT_CLICKED.alt === 'Dislike Icon') {
                axios.put(shared.resolveBackendRoute(`/comments/dislike`), {cid: COMMENT_ID}, {withCredentials: true})
                .then((response) => {
                    if (response.status === 200 && 'action' in response.data && 'count' in response.data) {
                        switch (response.data.action) {
                            case 'added':
                                NO_FILL_DISLIKE_BUTTON.addClass('hide');
                                FILL_DISLIKE_BUTTON.removeClass('hide');
                                COMMENT.data('dislikedbyuser', true);

                                // remove like
                                if (COMMENT.data('likedbyuser') === true) {
                                    NO_FILL_LIKE_BUTTON.removeClass('hide');
                                    FILL_LIKE_BUTTON.addClass('hide');

                                    const CURRENT_LIKE_COUNT = parseInt(LIKE_COUNTER.text());
                                    if (CURRENT_LIKE_COUNT > 0) LIKE_COUNTER.text(CURRENT_LIKE_COUNT - 1);

                                    COMMENT.removeData('likedbyuser');
                                }

                                break;
                            case 'removed':
                                FILL_DISLIKE_BUTTON.addClass('hide');
                                NO_FILL_DISLIKE_BUTTON.removeClass('hide');
                                COMMENT.removeData('dislikedbyuser');
                                break;
                            default:
                        }

                        DISLIKE_COUNTER.text(response.data.count);
                    }
                });
            }
        }
    };

    function onSubmit(event) {
        event.preventDefault();

        const FORM = event.target;
        const FORM_FIELDS = $(FORM).children('input');
        const FORM_DATA = {};

        FORM_FIELDS.each((_, input) => {
            FORM_DATA[input.name] = input.value;
        });

        axios.post(shared.resolveBackendRoute(new URL(FORM.action).pathname), FORM_DATA, {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'userData' in response.data && 'commentData' in response.data) {
                // clear reply form
                FORM_FIELDS.each((_, input) => {
                    input.value = '';
                });

                // update comments list
                const NEW_COMMENTS_LIST = comments.concat(response.data);

                // update comment count on post
                $('#comments-screen-post .post-info .comments span').first().text(NEW_COMMENTS_LIST.length);

                loadComments(NEW_COMMENTS_LIST);
            }
        });
    };

    function goBack() {
        redirectTo(-1);
    };

    React.useEffect(() => {
        // load post data
        axios.get(shared.resolveBackendRoute(`/comments/${URL_PARAMETERS.pid}`), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && 'postData' in response.data && 'userData' in response.data && 'comments' in response.data) {
                const POST = $('#comments-screen-post');

                // load username & profile picture
                const USER_INFO = POST.children('.user-info').first();

                USER_INFO.children('span').text(response.data.userData.username);

                if (response.data.userData.pfp.length > 0) {
                    USER_INFO.children('img').attr('src', shared.resolveBackendRoute(`/static/users/profile/${response.data.userData.pfp}`));
                }

                // load post content
                const POST_CONTENT = POST.children('.post-content').first();
                const POST_BODY = POST_CONTENT.children('p').first();

                POST_BODY.text(response.data.postData.body);

                if (response.data.postData.media.length > 0) {
                    const MEDIA_DATA = response.data.postData.media[0];

                    switch (MEDIA_DATA.type) {
                        case 'image':
                            const IMAGE = $(document.createElement('img'));

                            IMAGE.attr('src', shared.resolveBackendRoute(`/static/users/posts/${MEDIA_DATA.src}`));
                            IMAGE.attr('alt', 'Post');

                            IMAGE.insertAfter(POST_BODY);
                            break;
                        case 'video':
                            const VIDEO = $(document.createElement('video'));

                            VIDEO[0].loop = true;
                            VIDEO[0].controls = true;
                            VIDEO[0].disablePictureInPicture = true;

                            VIDEO.attr('controlsList', 'nodownload');
                            VIDEO.attr('src', shared.resolveBackendRoute(`/static/users/posts/${MEDIA_DATA.src}`));

                            VIDEO.insertAfter(POST_BODY);
                            break;
                        default:
                    }
                }

                // load tags
                const POST_TAGS_LIST = POST_CONTENT.children('ul').first();

                if (response.data.postData.tags.length > 0) {
                    response.data.postData.tags.forEach((tag) => {
                        const LIST_ITEM = document.createElement('li');
                        LIST_ITEM.innerText += `#${tag}`;

                        POST_TAGS_LIST.append(LIST_ITEM);
                    });
                }

                // load date
                const POST_INFO = POST.children('.post-info').first();

                POST_INFO.children('.publish-date').text(response.data.postData.date);

                // load likes
                const LIKES_CONTAINER = POST_INFO.children('.likes').first();

                LIKES_CONTAINER.children('span').text(response.data.postData.likes.length);

                if ('likedByUser' in response.data.postData) {
                    LIKES_CONTAINER.children('.no-fill').addClass('hide');
                    LIKES_CONTAINER.children('.fill').removeClass('hide');
                }

                // load comments
                if (response.data.comments.length > 0) {
                    // update comment count on post
                    $('#comments-screen-post .post-info .comments span').first().text(response.data.comments.length);

                    // create an array of comment objects with a new structure
                    const COMMENTS = response.data.comments.map((comment) => {
                        return {
                            userData: {
                                pfp: comment.pfp,
                                username: comment.username
                            },
                            commentData: {
                                cid: comment.cid,
                                comment: comment.comment,
                                date: comment.date,
                                ownedByUser: comment.ownedByUser, // can be 'undefined' or 'true'
                                likes: comment.likes,
                                dislikes: comment.dislikes,
                                likedByUser: comment.likedByUser, // can be 'undefined' or 'true'
                                dislikedByUser: comment.dislikedByUser // can be 'undefined' or 'true'
                            }
                        };
                    });

                    loadComments((commentsList) => {
                        // update comments list
                        return commentsList.concat(COMMENTS);
                    });
                }
            }
        });
    }, [URL_PARAMETERS]);

    return (
        <div id='comments-screen' className=''>
            <article id='comments-screen-post' onClick={onClickPost}>
                <button onClick={goBack}>&larr;</button>

                <div className='user-info'>
                    <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>
                    <span></span>
                </div>

                <div className='post-content'>
                    <p></p>

                    <ul></ul>
                </div>

                <div className='post-info'>
                    <span className='publish-date'>DD/MM/YYYY</span>

                    <div className='likes'>
                        <img className='no-fill' src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img>
                        <img className='hide fill' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img>
                        <span>0</span>
                    </div>

                    <div className='comments'>
                        <img src={NoFill_Icon_Message} alt='Comment Icon'></img>
                        <span>0</span>
                    </div>
                </div>
            </article>

            <form id='comments-screen-reply-form' action={`/comments/${URL_PARAMETERS.pid}`} method='post' onSubmit={onSubmit}>
                <input type='text' name='replyBody' placeholder='Write your reply here' />

                <button type='submit'>Send</button>
            </form>

            <section id='comments-screen-comments' onClick={onClickComment}>
                <h1>Comments</h1>

                {
                    comments.map((comment, index) => {
                        return <Comment key={index} userData={comment.userData} commentData={comment.commentData} />;
                    })
                }
            </section>
        </div>
    );
};

export default Comments;
