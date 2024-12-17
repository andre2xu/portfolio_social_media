import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import debounce from 'lodash.debounce';
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

        const SEARCH_BAR = document.getElementById('explore-page-searchbar-input');

        if (SEARCH_BAR.value.length > 0) {
            const TOKENS = SEARCH_BAR.value.split(/\s/);

            if (TOKENS.length === 1 && TOKENS[0].length > 1 && TOKENS[0][0] === '@') {
                // search query is a user so redirect to their profile page
                const USERNAME = TOKENS[0].substring(1);

                redirectTo(`/profile/${USERNAME}`);
            }
            else {
                // search query is either a tag or a post's content. Let the backend handle the processing
                axios.get(shared.resolveBackendRoute(`/explore/${encodeURIComponent(SEARCH_BAR.value)}`), {withCredentials: true})
                .then((response) => {
                    if (response.status === 200 && 'result' in response.data) {
                        loadPosts(response.data.result);
                    }
                })
                .catch(() => {
                    redirectTo('/error/500');
                });
            }
        }
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
                })
                .catch(() => {
                    redirectTo('/error/500');
                });
            }
        }
    };

    function onClickSearchResult(event) {
        let element_clicked = event.target;

        if (element_clicked instanceof HTMLLIElement === false) {
            element_clicked = element_clicked.parentElement;
        }

        const POST_ID = element_clicked.getAttribute('data-pid');
        const USERNAME = element_clicked.getAttribute('data-user');

        if (POST_ID !== null) {
            redirectTo(`/post/${POST_ID}`);
        }
        else if (USERNAME !== null) {
            redirectTo(`/profile/${USERNAME}`);
        }
    };

    React.useEffect(() => {
        axios.get(shared.resolveBackendRoute('/explore'), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'posts' in response.data) {
                loadPosts(response.data.posts);
            }
        })
        .catch(() => {
            redirectTo('/error/500');
        });
    }, [redirectTo]);

    React.useEffect(() => {
        const SEARCH_RESULTS_LIST = $('#explore-page-searchbar-results');

        $('#explore-page-searchbar-input').on('keyup', debounce((event) => {
            // hide and reset the list
            SEARCH_RESULTS_LIST.addClass('hide');
            SEARCH_RESULTS_LIST.empty();

            const SEARCH_QUERY = event.target.value;

            if (SEARCH_QUERY.length > 0) {
                axios.get(shared.resolveBackendRoute(`/search/${encodeURIComponent(SEARCH_QUERY)}`))
                .then((response) => {
                    if (response.status === 200 && 'type' in response.data && 'result' in response.data) {
                        if (response.data.result.length > 0) {
                            // populate the list
                            switch (response.data.type) {
                                case 'user':
                                    $(response.data.result).each((_, result) => {
                                        let pfp_src = '/pfp/Default_Profile_Picture.png';

                                        if (result.pfp.length > 0) {
                                            pfp_src = shared.getUserProfileStaticFileURI(result.pfp);
                                        }

                                        const LIST_ITEM = document.createElement('li');
                                        LIST_ITEM.setAttribute('data-user', result.username);
                                        LIST_ITEM.innerHTML = `<img src="${pfp_src}" alt="User"></img> @${result.username}`;

                                        SEARCH_RESULTS_LIST.append(LIST_ITEM);
                                    });

                                    SEARCH_RESULTS_LIST.removeClass('hide');
                                    break;
                                case 'tag':
                                case 'content':
                                    $(response.data.result).each((_, result) => {
                                        const LIST_ITEM = document.createElement('li');
                                        LIST_ITEM.setAttribute('data-pid', result.pid);
                                        LIST_ITEM.innerHTML = `<b>@${result.username}:</b> ${result.body}`;

                                        SEARCH_RESULTS_LIST.append(LIST_ITEM);
                                    });

                                    SEARCH_RESULTS_LIST.removeClass('hide');
                                    break;
                                default:
                                    // hide and reset the list
                                    SEARCH_RESULTS_LIST.addClass('hide');
                                    SEARCH_RESULTS_LIST.empty();
                            }
                        }
                    }
                })
                .catch(() => {
                    redirectTo('/error/500');
                });
            }
        }, 700));

        $(document.body).on('click', (event) => {
            const ELEMENT_CLICKED = event.target;

            if (ELEMENT_CLICKED.id !== 'explore-page-searchbar-results' && ELEMENT_CLICKED.id !== 'explore-page-searchbar-input' && $.contains(SEARCH_RESULTS_LIST, ELEMENT_CLICKED) === false) {
                // hide and reset the list
                SEARCH_RESULTS_LIST.addClass('hide');
                SEARCH_RESULTS_LIST.empty();
            }
        });

        return () => {
            // remove event listeners when the component is destroyed
            $('#explore-page-searchbar-input').off();
            $(document.body).off();
        }
    }, [redirectTo]);

    return (
        <div id='explore-page' className=''>
            <form id='explore-page-searchbar' onSubmit={search}>
                <div>
                    <input id='explore-page-searchbar-input' type='text' placeholder='#topic, @username, content' autoComplete='off' />

                    <button type='submit'>
                        <img src={Fill_Icon_MagnifyingGlass} alt='Search'></img>
                    </button>

                    <ul id='explore-page-searchbar-results' className='hide' onClick={onClickSearchResult}></ul>
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
                            USER_INFO.pfp = shared.getUserProfileStaticFileURI(postData.pfp);
                        }

                        if (postData.media.length > 0) {
                            // with media
                            return (
                                <Post
                                    key={index}
                                    userInfo={USER_INFO}
                                    postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes, comments: postData.comments}}
                                    media={{src: shared.getUserPostMediaURI(postData.media[0].src), type: postData.media[0].type}}
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
                                    postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes, comments: postData.comments}}
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
