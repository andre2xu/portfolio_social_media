import React from 'react';
import $ from 'jquery';
import axios from 'axios';
import shared from '../shared';
import { useParams, useNavigate } from 'react-router-dom';

// general views
import Post from '../components/Post';



function ProfilePage() {
    const LIKED_POSTS = React.useRef([]);
    const [posts, loadPosts] = React.useState([]);
    const [followers, loadFollowers] = React.useState([]);
    const [following, loadFollowing] = React.useState([]);
    const PROFILE_DATA = React.useRef({
        username: 'User',
        pfp: '/pfp/Default_Profile_Picture.png'
    });

    function onClickPost(event) {
        const ELEMENT_CLICKED = event.target;

        if (ELEMENT_CLICKED instanceof HTMLImageElement) {
            if (ELEMENT_CLICKED.alt === 'Like Icon') {
                // like or unlike a post

                axios.put(shared.resolveBackendRoute('/post/like'), {pid: $(ELEMENT_CLICKED).closest('.post').data('pid')}, {withCredentials: true})
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
            else if (ELEMENT_CLICKED.alt === 'Comment Icon') {
                // take the user to the post's comments section
                redirectTo(`/post/${$(ELEMENT_CLICKED).closest('.post').data('pid')}`);
            }
        }
    };

    function changeSection(event) {
        // this handles changing between posts, following, or followers

        let element_clicked = $(event.target);

        if (element_clicked.hasClass('profile-counts') === false) {
            element_clicked = element_clicked.parent();
        }

        const SECTION = element_clicked.children('span').last().text();
        const SECTIONS = $('#account-page-profile-lists');

        SECTIONS.children().addClass('hide');

        switch (SECTION) {
            case 'Posts':
                SECTIONS.children('#account-page-posts-list').removeClass('hide');
                break;
            case 'Following':
                SECTIONS.children('#account-page-following-list').removeClass('hide');
                break;
            case 'Followers':
                SECTIONS.children('#account-page-followers-list').removeClass('hide');
                break;
            default:
        }
    };

    function onClickFollowOrUnfollow(event) {
        const BUTTON = event.target;

        if (BUTTON.innerText === 'Follow') {
            axios.post(shared.resolveBackendRoute('/follow'), {username: PROFILE_DATA.current.username}, {withCredentials: true})
            .then((response) => {
                if (response.status === 200 && 'status' in response.data && 'followerAdded' in response.data && response.data.status === 'success') {
                    // change the follow button to an unfollow button
                    BUTTON.innerText = 'Unfollow';

                    // increment followers count
                    const FOLLOWERS_COUNT = $('#account-page-profile-info .followers-count span').first();

                    FOLLOWERS_COUNT.text(parseInt(FOLLOWERS_COUNT.text()) + 1);

                    // update followers list
                    loadFollowers((oldFollowersList) => {
                        return [...oldFollowersList, response.data.followerAdded];
                    });
                }
            });
        }
        else if (BUTTON.innerText === 'Unfollow') {
            axios.delete(shared.resolveBackendRoute(`/follow/${PROFILE_DATA.current.username}`), {withCredentials: true})
            .then((response) => {
                if (response.status === 200 && 'status' in response.data && 'followerRemoved' in response.data && response.data.status === 'success') {
                    // change the unfollow button to a follow button
                    BUTTON.innerText = 'Follow';

                    // decrement followers count
                    const FOLLOWERS_COUNT = $('#account-page-profile-info .followers-count span').first();

                    FOLLOWERS_COUNT.text(parseInt(FOLLOWERS_COUNT.text()) - 1);

                    // update followers list
                    loadFollowers((oldFollowersList) => {
                        return oldFollowersList.filter((userInfo) => {
                            return userInfo.username !== response.data.followerRemoved.username;
                        });
                    });
                }
            });
        }
    };

    function onClickUser(event) {
        const ELEMENT_CLICKED = event.target;

        if ((ELEMENT_CLICKED instanceof HTMLImageElement && ELEMENT_CLICKED.alt === 'User') || (ELEMENT_CLICKED instanceof HTMLSpanElement && ELEMENT_CLICKED.innerText[0] === '@')) {
            const USERNAME = $(ELEMENT_CLICKED.parentElement).children('span').first().text().substring(1);

            // redirect to the profile page of the user that was clicked
            redirectTo(`/profile/${USERNAME}`);
            redirectTo(0); // force re-render
        }
    };

    function updateProfile(newData) {
        if (typeof newData !== 'object' || ('username' in newData && 'cover' in newData && 'pfp' in newData) === false || (typeof newData.username === 'string' && typeof newData.cover === 'string' && typeof newData.pfp === 'string') === false) {
            throw TypeError("Invalid profile data");
        }

        if (newData.username.length > 0) {
            $('#account-page-profile-info span').first().text(`@${newData.username}`);

            // update username in posts
            $('#account-page-posts-list .post .user-info span').each((_, username) => {
                username.innerText = newData.username;
            });
        }

        if (newData.cover.length > 0) {
            $('#account-page-profile-cover').css({backgroundImage: `url("${shared.getUserProfileStaticFileURI(newData.cover)}")`});
        }

        if (newData.pfp.length > 0) {
            const PROFILE_PICTURE_SRC = shared.getUserProfileStaticFileURI(newData.pfp);

            PROFILE_DATA.current.pfp = PROFILE_PICTURE_SRC;

            $('#account-page-profile-picture').prop('src', PROFILE_PICTURE_SRC);

            // update profile picture in posts
            $('#account-page-posts-list .post .user-info img').each((_, pfp) => {
                pfp.src = PROFILE_PICTURE_SRC;
            });
        }
    };

    const URL_PARAMETERS = useParams();
    const redirectTo = useNavigate();

    React.useEffect(() => {
        // load profile info
        axios.get(shared.resolveBackendRoute(`/account/info/${URL_PARAMETERS.username}`), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object') {
                if (Object.keys(response.data).length > 0) {
                    if (response.data.username.length > 0) {
                        PROFILE_DATA.current.username = response.data.username;
                    }

                    if (response.data.pfp.length > 0) {
                        PROFILE_DATA.current.pfp = shared.getUserProfileStaticFileURI(response.data.pfp);
                    }

                    updateProfile(response.data);
                }
                else {
                    // profile page owner does not exist so redirect to explore page
                    redirectTo('/');
                }
            }
        });

        // retrieve & load posts
        axios.get(shared.resolveBackendRoute(`/post/${URL_PARAMETERS.username}`), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && 'posts' in response.data) {
                if ('likedPosts' in response.data && response.data.likedPosts.length > 0) {
                    LIKED_POSTS.current = response.data.likedPosts;
                }

                loadPosts(response.data.posts);
            }
        });

        // retrieve followers
        axios.get(shared.resolveBackendRoute(`/followers/${URL_PARAMETERS.username}`), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'followers' in response.data) {
                // update followers count
                $('#account-page-profile-info .followers-count span').first().text(response.data.followers.length);

                if ('followedByUser' in response.data) {
                    // change the follow button to an unfollow button
                    $('#account-page-profile-info > div button').text('Unfollow');
                }

                // update followers list
                loadFollowers(response.data.followers);
            }
        });

        // retrieve following
        axios.get(shared.resolveBackendRoute(`/following/${URL_PARAMETERS.username}`), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'following' in response.data) {
                // update following count
                $('#account-page-profile-info .following-count span').first().text(response.data.following.length);

                // update following list
                loadFollowing(response.data.following);
            }
        });

    }, [URL_PARAMETERS, redirectTo]);

    return (
        <div id='account-page' className=''>
            <div id='account-page-profile' className=''>
                <div id='account-page-profile-cover'></div>

                <div id='account-page-profile-info-container'>
                    <img id='account-page-profile-picture' src='/pfp/Default_Profile_Picture.png' alt='User' />

                    <div id='account-page-profile-info'>
                        <span>@</span>

                        <div onClick={changeSection}>
                            <div className='profile-counts'>
                                <span>{posts.length}</span>
                                <span>Posts</span>
                            </div>

                            <div className='profile-counts following-count'>
                                <span>0</span>
                                <span>Following</span>
                            </div>

                            <div className='profile-counts followers-count'>
                                <span>0</span>
                                <span>Followers</span>
                            </div>
                        </div>

                        <div onClick={onClickFollowOrUnfollow}>
                            <button>Follow</button>
                        </div>
                    </div>
                </div>

                <div id='account-page-profile-lists'>
                    <section id='account-page-following-list' className='hide' onClick={onClickUser}>
                        <h1>Following</h1>

                        <div className='users-list'>
                            {
                                following.map((followingData, index) => {
                                    let pfp = '/pfp/Default_Profile_Picture.png';

                                    if (followingData.pfp.length > 0) {
                                        pfp = shared.getUserProfileStaticFileURI(followingData.pfp);
                                    }

                                    return (
                                        <div className='user' key={index}>
                                            <img src={pfp} alt='User' />

                                            <span>@{followingData.username}</span>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        <button className='account-page-lists-show-more hide'>Show more</button>
                    </section>

                    <section id='account-page-followers-list' className='hide' onClick={onClickUser}>
                        <h1>Followers</h1>

                        <div className='users-list'>
                            {
                                followers.map((followerData, index) => {
                                    let pfp = '/pfp/Default_Profile_Picture.png';

                                    if (followerData.pfp.length > 0) {
                                        pfp = shared.getUserProfileStaticFileURI(followerData.pfp);
                                    }

                                    return (
                                        <div className='user' key={index}>
                                            <img src={pfp} alt='User' />

                                            <span>@{followerData.username}</span>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        <button className='account-page-lists-show-more hide'>Show more</button>
                    </section>

                    <div id='account-page-posts-list' className='' onClick={onClickPost}>
                        {
                            posts.map((postData, index) => {
                                let is_liked_by_the_user_logged_in = false;

                                if (LIKED_POSTS.current.length > 0 && LIKED_POSTS.current.includes(postData.pid)) {
                                    is_liked_by_the_user_logged_in = true;
                                }

                                if (postData.media.length > 0) {
                                    // with media
                                    return (
                                        <Post
                                            key={index}
                                            userInfo={{pfp: PROFILE_DATA.current.pfp, username: PROFILE_DATA.current.username}}
                                            postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes.length, comments: postData.comments}}
                                            media={{src: shared.getUserPostMediaURI(postData.media[0].src), type: postData.media[0].type}}
                                            isDeletable={false}
                                            isLiked={is_liked_by_the_user_logged_in}
                                        />
                                    );
                                }
                                else {
                                    // without media
                                    return (
                                        <Post
                                            key={index}
                                            userInfo={{pfp: PROFILE_DATA.current.pfp, username: PROFILE_DATA.current.username}}
                                            postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes.length, comments: postData.comments}}
                                            isDeletable={false}
                                            isLiked={is_liked_by_the_user_logged_in}
                                        />
                                    );
                                }
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
