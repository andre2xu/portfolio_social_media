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
    const PROFILE_DATA = React.useRef({
        username: 'User',
        pfp: '/pfp/Default_Profile_Picture.png'
    });

    function onClickPost(event) {
        
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

        const PROFILE_STATIC_ASSETS_PATH = shared.resolveBackendRoute('/static/users/profile/');

        if (newData.cover.length > 0) {
            $('#account-page-profile-cover').css({backgroundImage: `url("${PROFILE_STATIC_ASSETS_PATH}/${newData.cover}")`});
        }

        if (newData.pfp.length > 0) {
            const PROFILE_PICTURE_SRC = `${PROFILE_STATIC_ASSETS_PATH}/${newData.pfp}`;

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
                        PROFILE_DATA.current.pfp = shared.resolveBackendRoute(`/static/users/profile/${response.data.pfp}`);
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

    }, [URL_PARAMETERS, redirectTo]);

    return (
        <div id='account-page' className=''>
            <div id='account-page-profile' className=''>
                <div id='account-page-profile-cover'></div>

                <div id='account-page-profile-info-container'>
                    <img id='account-page-profile-picture' src='/pfp/Default_Profile_Picture.png' alt='User' />

                    <div id='account-page-profile-info'>
                        <span>@</span>

                        <div>
                            <div className='profile-counts'>
                                <span>0</span>
                                <span>Posts</span>
                            </div>

                            <div className='profile-counts'>
                                <span>0</span>
                                <span>Following</span>
                            </div>

                            <div className='profile-counts'>
                                <span>0</span>
                                <span>Followers</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div id='account-page-profile-lists'>
                    <section id='account-page-following-list' className='hide'>
                        <h1>Following</h1>

                        <div className='users-list'>
                            <div className='user'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                                <span>@Username</span>

                                <button>Unfollow</button>
                            </div>

                            <div className='user'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                                <span>@Username</span>

                                <button>Unfollow</button>
                            </div>

                            <div className='user'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                                <span>@Username</span>

                                <button>Unfollow</button>
                            </div>
                        </div>

                        <button className='account-page-lists-show-more'>Show more</button>
                    </section>

                    <section id='account-page-followers-list' className='hide'>
                        <h1>Followers</h1>

                        <div className='users-list'>
                            <div className='user'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                                <span>@Username</span>

                                <button>Follow</button>
                            </div>

                            <div className='user'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                                <span>@Username</span>

                                <button>Unfollow</button>
                            </div>

                            <div className='user'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                                <span>@Username</span>

                                <button>Follow</button>
                            </div>
                        </div>

                        <button className='account-page-lists-show-more'>Show more</button>
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
                                            postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes.length, comments: 0}}
                                            media={{src: shared.resolveBackendRoute(`/static/users/posts/${postData.media[0].src}`), type: postData.media[0].type}}
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
                                            postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes.length, comments: 0}}
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
