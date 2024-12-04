import React from 'react';
import $ from 'jquery';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import shared from '../shared';

// general views
import Post from '../components/Post';



function AccountPage({displayConfirmationDialog}) {
    const POSTS_FORM_MESSAGE_TIMEOUT_FUNCTION = React.useRef(null);
    const SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION = React.useRef(null);
    const LIKED_POSTS = React.useRef([]);
    const [posts, loadPosts] = React.useState([]);
    const PROFILE_DATA = React.useRef({
        username: 'User',
        pfp: '/pfp/Default_Profile_Picture.png'
    });

    const redirectTo = useNavigate();

    function changeTabs(event) {
        const PROFILE_SECTION = document.getElementById('account-page-profile');
        const SETTINGS_SECTION = document.getElementById('account-page-settings');

        switch (event.target.innerText) {
            case 'Profile':
                PROFILE_SECTION.classList.remove('hide');
                SETTINGS_SECTION.classList.add('hide');
                break;
            case 'Settings':
                SETTINGS_SECTION.classList.remove('hide');
                PROFILE_SECTION.classList.add('hide');
                break;
            default:
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

    function updateCover(event) {
        switch (event.target.innerText) {
            case 'Upload cover':
                $('#account-page-settings-form input[name="cover"]')[0].click(); // open file explorer
                break;
            case 'Remove cover':
                displayConfirmationDialog(
                    () => {
                        axios.put(shared.resolveBackendRoute('/account/remove'), {type: 'profile', target: 'cover'}, {withCredentials: true})
                        .then((response) => {
                            const MESSAGE = $('#account-page-settings-form-message');
                            MESSAGE.removeClass('hide');
                            MESSAGE.removeClass('success');

                            clearTimeout(SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current);
                            SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current = null;

                            if (response.status === 200) {
                                if (response.data.errorMessage !== undefined) {
                                    MESSAGE.text(response.data.errorMessage);
                                }
                                else {
                                    MESSAGE.addClass('success');
                                    MESSAGE.text('Cover deleted successfully');

                                    // reset profile cover to default
                                    $('#account-page-profile-cover')[0].removeAttribute('style');
                                }
                            }
                            else {
                                MESSAGE.text('Server error');
                            }

                            SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current = setTimeout(() => {
                                MESSAGE.addClass('hide');
                            }, 4000);
                        });
                    },
                    () => {},
                    "Are you sure you want to delete your profile background cover?"
                );
                break;
            default:
        }
    };

    function updatePhoto(event) {
        switch (event.target.innerText) {
            case 'Upload photo':
                $('#account-page-settings-form input[name="pfp"]')[0].click(); // open file explorer
                break;
            case 'Remove photo':
                displayConfirmationDialog(
                    () => {
                        axios.put(shared.resolveBackendRoute('/account/remove'), {type: 'profile', target: 'pfp'}, {withCredentials: true})
                        .then((response) => {
                            const MESSAGE = $('#account-page-settings-form-message');
                            MESSAGE.removeClass('hide');
                            MESSAGE.removeClass('success');

                            clearTimeout(SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current);
                            SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current = null;

                            if (response.status === 200) {
                                if (response.data.errorMessage !== undefined) {
                                    MESSAGE.text(response.data.errorMessage);
                                }
                                else {
                                    MESSAGE.addClass('success');
                                    MESSAGE.text('Profile picture deleted successfully');

                                    const DEFAULT_PFP_SRC = '/pfp/Default_Profile_Picture.png';

                                    PROFILE_DATA.current.pfp = DEFAULT_PFP_SRC;

                                    // reset profile picture to default
                                    $('#account-page-profile-picture').prop('src', DEFAULT_PFP_SRC);

                                    // reset profile picture in posts
                                    $('#account-page-posts-list .post .user-info img').each((_, pfp) => {
                                        pfp.src = DEFAULT_PFP_SRC;
                                    });
                                }
                            }
                            else {
                                MESSAGE.text('Server error');
                            }

                            SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current = setTimeout(() => {
                                MESSAGE.addClass('hide');
                            }, 4000);
                        });
                    },
                    () => {},
                    "Are you sure you want to delete your profile picture?"
                );
                break;
            default:
        }
    };

    function onChange(event) {
        const FORM_FIELD = event.target;

        if (FORM_FIELD instanceof HTMLInputElement) {
            if (FORM_FIELD.name === 'cover') {
                $('#account-page-settings-cover-filename').text(FORM_FIELD.value.split(/\\|\//).pop());
            }
            else if (FORM_FIELD.name === 'pfp') {
                $('#account-page-settings-pfp-filename').text(FORM_FIELD.value.split(/\\|\//).pop());
            }
        }
    };

    function onSubmitSettingsForm(event) {
        event.preventDefault();

        const FORM = event.target;
        const FORM_DATA = new FormData(FORM);

        axios.put(shared.resolveBackendRoute(new URL(FORM.action).pathname), FORM_DATA, {withCredentials: true})
        .then((response) => {
            const MESSAGE = $('#account-page-settings-form-message');
            MESSAGE.removeClass('hide');
            MESSAGE.removeClass('success');

            clearTimeout(SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current);
            SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current = null;

            if (response.status === 200) {
                if (response.data.errorMessage !== undefined) {
                    MESSAGE.text(response.data.errorMessage);
                }
                else if (response.data.newData !== undefined) {
                    MESSAGE.addClass('success');
                    MESSAGE.text('Update successful');

                    // update profile
                    $(['username', 'cover', 'pfp']).each((_, key) => {
                        if (response.data.newData[key] === undefined) {
                            response.data.newData[key] = '';
                        }
                    });

                    updateProfile(response.data.newData);
                }
                else {
                    MESSAGE.text('Profile data error');
                }
            }
            else {
                MESSAGE.text('Server error');
            }

            SETTINGS_FORM_MESSAGE_TIMEOUT_FUNCTION.current = setTimeout(() => {
                MESSAGE.addClass('hide');
            }, 4000);
        });
    };

    function onSubmitPostsForm(event) {
        event.preventDefault();

        const FORM = event.target;
        const FORM_DATA = new FormData(FORM);

        function displayError(message) {
            const MESSAGE = $('#account-page-post-form-error');
            MESSAGE.removeClass('hide');

            MESSAGE.text(message);

            clearTimeout(POSTS_FORM_MESSAGE_TIMEOUT_FUNCTION.current);
            POSTS_FORM_MESSAGE_TIMEOUT_FUNCTION.current = null;

            POSTS_FORM_MESSAGE_TIMEOUT_FUNCTION.current = setTimeout(() => {
                MESSAGE.addClass('hide');
            }, 4000);
        };

        axios.post(shared.resolveBackendRoute(new URL(FORM.action).pathname), FORM_DATA, {withCredentials: true})
        .then((response) => {
            if (response.status === 200) {
                if (response.data.errorMessage !== undefined) {
                    displayError(response.data.errorMessage);
                }
                else {
                    // update posts list
                    updatePostsList();

                    // clear posts form fields
                    $(FORM).find('input, textarea').each((_, field) => {
                        field.value = '';
                    });
                }
            }
            else {
                displayError("Server error");
            }
        });
    };

    function onClickPost(event) {
        const ELEMENT_CLICKED = event.target;

        if (ELEMENT_CLICKED instanceof HTMLButtonElement && ELEMENT_CLICKED.innerText === 'Delete' && $(ELEMENT_CLICKED.parentElement.parentElement).hasClass('post')) {
            // delete post

            displayConfirmationDialog(
                () => {
                    const POST_ID = ELEMENT_CLICKED.parentElement.parentElement.getAttribute('data-pid');

                    axios.delete(shared.resolveBackendRoute(`/post/${POST_ID}`), {withCredentials: true})
                    .then((response) => {
                        if (response.status === 200 && 'status' in response.data && response.data.status === 'success') {
                            $(`#account-page-posts-list .post[data-pid="${POST_ID}"]`).remove();

                            const POST_COUNT = $('#account-page-profile-info .profile-counts span').first();
                            const CURRENT_COUNT = parseInt(POST_COUNT.text());

                            POST_COUNT.text(CURRENT_COUNT - 1);
                        }
                    });
                },
                () => {},
                "Are you sure you want to delete this post? This cannot be undone."
            );
        }
        else if (ELEMENT_CLICKED instanceof HTMLImageElement) {
            if (ELEMENT_CLICKED.alt === 'Like Icon') {
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

    function updatePostsList() {
        axios.get(shared.resolveBackendRoute('/post'), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && 'posts' in response.data) {
                if ('likedPosts' in response.data && response.data.likedPosts.length > 0) {
                    LIKED_POSTS.current = response.data.likedPosts;
                }

                loadPosts(response.data.posts);
            }
        });
    };

    function deleteAccount() {
        displayConfirmationDialog(
            () => {
                axios.delete(shared.resolveBackendRoute('/account/delete'), {withCredentials: true})
                .then((response) => {
                    if (response.status === 200) {
                        // redirect user to login page
                        redirectTo('/login', {replace: true});
                    }
                });
            },
            () => {}
        );
    };

    React.useEffect(() => {
        // load profile info
        axios.get(shared.resolveBackendRoute('/account/info'), {withCredentials: true})
        .then((response) => {
            if (response.status === 200) {
                if (response.data.username.length > 0) {
                    PROFILE_DATA.current.username = response.data.username;

                    // retrieve followers
                    axios.get(shared.resolveBackendRoute(`/followers/${PROFILE_DATA.current.username}`), {withCredentials: true})
                    .then((response) => {
                        if (response.status === 200 && 'followers' in response.data) {

                            // update followers count
                            $('#account-page-profile-info .followers-count span').first().text(response.data.followers.length);
                        }
                    });
                }

                if (response.data.pfp.length > 0) {
                    PROFILE_DATA.current.pfp = shared.resolveBackendRoute(`/static/users/profile/${response.data.pfp}`);
                }

                updateProfile(response.data);
            }
        });

        // load posts
        updatePostsList();
    }, []);

    return (
        <div id='account-page' className=''>
            <div id='account-page-tabs' onClick={changeTabs}>
                <button>Profile</button>
                <button>Settings</button>
            </div>

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

                        <button className='account-page-lists-show-more hide'>Show more</button>
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

                        <button className='account-page-lists-show-more hide'>Show more</button>
                    </section>

                    <div id='account-page-posts-list' className='' onClick={onClickPost}>
                        {/* NOTE: the post form AND the 'delete' option in posts should only appear when the user that's logged in is viewing their own profile */}

                        <form id='account-page-post-form' action='/post' method='post' encType='multipart/form-data' onSubmit={onSubmitPostsForm}>
                            <textarea name='postBody' placeholder='Enter post body'></textarea>

                            <input type='text' name='postTags' placeholder='tag1, tag2, tag3, ...' />

                            <div>
                                <input type='file' name='postMedia' accept='image/png, image/jpg, image/jpeg, image/gif, video/mp4' />

                                <button type='submit'>Post</button>
                            </div>

                            <span id='account-page-post-form-error' className='hide'>Error message</span>
                        </form>

                        {
                            posts.map((postData, index) => {
                                let is_liked_by_poster = false;

                                if (LIKED_POSTS.current.length > 0 && LIKED_POSTS.current.includes(postData.pid)) {
                                    is_liked_by_poster = true;
                                }

                                if (postData.media.length > 0) {
                                    // with media
                                    return (
                                        <Post
                                            key={index}
                                            userInfo={{pfp: PROFILE_DATA.current.pfp, username: PROFILE_DATA.current.username}}
                                            postInfo={{pid: postData.pid, body: postData.body, tags: postData.tags, date: postData.date, likes: postData.likes.length, comments: postData.comments}}
                                            media={{src: shared.resolveBackendRoute(`/static/users/posts/${postData.media[0].src}`), type: postData.media[0].type}}
                                            isLiked={is_liked_by_poster}
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
                                            isLiked={is_liked_by_poster}
                                        />
                                    );
                                }
                            })
                        }
                    </div>
                </div>
            </div>

            <div id='account-page-settings' className='hide'>
                <div id='account-page-settings-general' className='settings-group'>
                    <h1>General</h1>

                    <div id='account-page-settings-cover' className='file-upload-container'>
                        <span id='account-page-settings-cover-filename'>No cover selected</span>

                        <div onClick={updateCover}>
                            <button>Upload cover</button>
                            <button>Remove cover</button>
                        </div>
                    </div>

                    <div id='account-page-settings-pfp' className='file-upload-container'>
                        <span id='account-page-settings-pfp-filename'>No photo selected</span>

                        <div onClick={updatePhoto}>
                            <button>Upload photo</button>
                            <button>Remove photo</button>
                        </div>
                    </div>

                    <form id='account-page-settings-form' action='/account/update' method='post' encType='multipart/form-data' onChange={onChange} onSubmit={onSubmitSettingsForm}>
                        <input type='file' name='cover' hidden aria-hidden />
                        <input type='file' name='pfp' hidden aria-hidden />

                        <input type='text' name='newUsername' placeholder='New Username' />
                        <input type='password' name='newPassword' placeholder='New Password' />

                        <span id='account-page-settings-form-message' className='hide'>Message</span>

                        <button type='submit'>Save</button>
                    </form>
                </div>

                <div id='account-page-settings-account-deletion' className='settings-group'>
                    <h1>Delete Account</h1>

                    <p>
                        This action will erase all your data including any posts you've made and any media you've uploaded. It cannot be undone. Clicking the button below means that you understand and acknowledge this.
                    </p>

                    <button onClick={deleteAccount}>Delete</button>
                </div>
            </div>
        </div>
    );
};

export default AccountPage;
