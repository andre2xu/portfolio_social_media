import React from 'react';
import axios from 'axios';
import shared from '../shared';
import { useParams } from 'react-router-dom';

// general views
import Post from '../components/Post';



function ProfilePage() {
    const URL_PARAMETERS = useParams();
    const [posts, loadPosts] = React.useState([]);
    const PROFILE_DATA = React.useRef({
        username: 'User',
        pfp: '/pfp/Default_Profile_Picture.png'
    });

    function onClickPost(event) {
        
    };

    React.useEffect(() => {
        // retrieve & load posts
        axios.get(shared.resolveBackendRoute(`/post/${URL_PARAMETERS.username}`), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && 'posts' in response.data) {
                loadPosts(response.data.posts);
            }
        });

    }, [URL_PARAMETERS]);

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
                                if (postData.media.length > 0) {
                                    // with media
                                    return (
                                        <Post
                                            key={index}
                                            userInfo={{pfp: PROFILE_DATA.current.pfp, username: PROFILE_DATA.current.username}}
                                            postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: 0, comments: 0}}
                                            media={{src: shared.resolveBackendRoute(`/static/users/posts/${postData.media[0].src}`), type: postData.media[0].type}}
                                            isDeletable={false}
                                        />
                                    );
                                }
                                else {
                                    // without media
                                    return (
                                        <Post
                                            key={index}
                                            userInfo={{pfp: PROFILE_DATA.current.pfp, username: PROFILE_DATA.current.username}}
                                            postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: 0, comments: 0}}
                                            isDeletable={false}
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
