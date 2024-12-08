import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import { Link, useNavigate } from 'react-router-dom';
import shared from '../shared';

// static
import Fill_Icon_MagnifyingGlass from '../static/icons/Icon_MagnifyingGlass_Fill.svg';

// general views
import Post from '../components/Post';



function ExplorePage({isLoggedIn}) {
    const [posts, loadPosts] = React.useState([]);

    const redirectTo = useNavigate();

    function search(event) {
        event.preventDefault();
    };

    function onClickPost(event) {
        const ELEMENT_CLICKED = event.target;

        if (ELEMENT_CLICKED instanceof HTMLImageElement) {
            if (ELEMENT_CLICKED.alt === 'User') {
                const POSTER_USERNAME = $(ELEMENT_CLICKED).closest('.post').find('.user-info span').text();

                redirectTo(`/profile/${POSTER_USERNAME}`);
            }
            else if (ELEMENT_CLICKED.alt === 'Comment Icon') {
                const POST_ID = $(ELEMENT_CLICKED).closest('.post').data('pid');

                redirectTo(`/post/${POST_ID}`);
            }
            else if (ELEMENT_CLICKED.alt === 'Like Icon') {
                const POST_ID = $(ELEMENT_CLICKED).closest('.post').data('pid');

                axios.put(shared.resolveBackendRoute('/post/like'), {pid: POST_ID}, {withCredentials: true})
                .then((response) => {
                    if (response.status === 200 && 'action' in response.data && 'count' in response.data) {
                        const LIKES_CONTAINER = $(ELEMENT_CLICKED).parent();
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

    React.useEffect(() => {
        axios.get(shared.resolveBackendRoute('/explore'), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'posts' in response.data) {
                loadPosts(response.data.posts);
            }
        });
    }, []);

    return (
        <div id='explore-page' className=''>
            <form id='explore-page-searchbar' onSubmit={search}>
                <div>
                    <input type='text' placeholder='#topic, @username, any' />

                    <button type='submit'>
                        <img src={Fill_Icon_MagnifyingGlass} alt='Search'></img>
                    </button>

                    <ul id='explore-page-searchbar-results' className='hide'>
                        <li>Search result 1</li>
                        <li>Search result 2</li>
                        <li>Search result 3</li>
                    </ul>
                </div>
            </form>

            { isLoggedIn ?
                null :
                <div id='explore-page-login-prompt'>
                    <p>You need to sign in to make a post</p>
                    <Link to={'/login'}>Login</Link>
                </div>
            }

            <div id='explore-page-posts' onClick={onClickPost}>
                {
                    posts.map((postData, index) => {
                        const USER_INFO = {
                            pfp: '/pfp/Default_Profile_Picture.png',
                            username: postData.username
                        };

                        if (postData.pfp.length > 0) {
                            USER_INFO.pfp = shared.resolveBackendRoute(`/static/users/profile/${postData.pfp}`);
                        }

                        if (postData.media.length > 0) {
                            // with media
                            return (
                                <Post
                                    key={index}
                                    userInfo={USER_INFO}
                                    postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes.length, comments: postData.comments}}
                                    media={{src: shared.resolveBackendRoute(`/static/users/posts/${postData.media[0].src}`), type: postData.media[0].type}}
                                    isLiked={postData.likedByUser}
                                    isDeletable={false}
                                />
                            );
                        }
                        else {
                            // without media
                            return (
                                <Post
                                    key={index}
                                    userInfo={USER_INFO}
                                    postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes.length, comments: postData.comments}}
                                    isLiked={postData.likedByUser}
                                    isDeletable={false}
                                />
                            );
                        }
                    })
                }
            </div>
        </div>
    );
};

export default ExplorePage;
