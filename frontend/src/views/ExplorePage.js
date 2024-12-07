import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import shared from '../shared';

// static
import Fill_Icon_MagnifyingGlass from '../static/icons/Icon_MagnifyingGlass_Fill.svg';

// general views
import Post from '../components/Post';



function ExplorePage({isLoggedIn}) {
    const [posts, loadPosts] = React.useState([]);

    function search(event) {
        event.preventDefault();
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

            <div id='explore-page-posts'>
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
