import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import shared from '../shared';
import { useNavigate, useParams } from 'react-router-dom';

// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';



function Comments() {
    const URL_PARAMETERS = useParams();
    const redirectTo = useNavigate();

    function goBack() {
        redirectTo(-1);
    };

    React.useEffect(() => {
        // load post data
        axios.get(shared.resolveBackendRoute(`/comments/${URL_PARAMETERS.pid}`), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && 'postData' in response.data && 'userData' in response.data) {
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
            }
        });
    }, [URL_PARAMETERS]);

    return (
        <div id='comments-screen' className=''>
            <article id='comments-screen-post'>
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
                        <img src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img>
                        <img className='hide' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img>
                        <span>100</span>
                    </div>

                    <div className='comments'>
                        <img src={NoFill_Icon_Message} alt='Comment Icon'></img>
                        <span>0</span>
                    </div>
                </div>
            </article>

            <form id='comments-screen-reply-form' action='/' method='post'>
                <input type='text' name='replyBody' placeholder='Write your reply here' />

                <button type='submit'>Send</button>
            </form>

            <section id='comments-screen-comments'>
                <h1>Comments</h1>

                <div className='comment'>
                    <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>

                    <div>
                        <div className='comment-info'>
                            <span>@Username</span>
                            <span>0 hrs</span>
                        </div>

                        <p>
                            This is a comment.
                        </p>

                        <div className='comment-likes-dislikes'>
                            <div className='likes'>
                                <img src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img>
                                <img className='hide' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img>
                                <span>50</span>
                            </div>

                            <div className='dislikes'>
                                <img src={NoFill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                                <img className='hide' src={Fill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                                <span>50</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='comment'>
                    <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>

                    <div>
                        <div className='comment-info'>
                            <span>@Username</span>
                            <span>0 hrs</span>
                        </div>

                        <p>
                            <span className='reply-username'>@Username</span> this is a reply.
                        </p>

                        <div className='comment-likes-dislikes'>
                            <div className='likes'>
                                <img src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img>
                                <img className='hide' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img>
                                <span>50</span>
                            </div>

                            <div className='dislikes'>
                                <img src={NoFill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                                <img className='hide' src={Fill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                                <span>50</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Comments;
