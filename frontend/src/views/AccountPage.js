import $ from 'jquery';
import axios from 'axios';

// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';



function AccountPage() {
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

    function updateCover(event) {
        switch (event.target.innerText) {
            case 'Upload cover':
                $('#account-page-settings-form input[name="cover"]')[0].click(); // open file explorer
                break;
            case 'Remove cover':
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

    function onSubmit(event) {
        event.preventDefault();

        const FORM = event.target;
        const FORM_DATA = new FormData(FORM);

        axios.put(`http://localhost:8010${new URL(FORM.action).pathname}`, FORM_DATA, {withCredentials: true})
        .then((response) => {
            const MESSAGE = $('#account-page-settings-form-message');
            MESSAGE.removeClass('hide');
            MESSAGE.removeClass('success');

            if (response.status === 200) {
                if (response.data.errorMessage !== undefined) {
                    MESSAGE.text(response.data.errorMessage);
                }
                else {
                    MESSAGE.addClass('success');
                    MESSAGE.text('Update successful');
                }
            }
            else {
                MESSAGE.text('Server error');
            }

            setTimeout(() => {
                MESSAGE.addClass('hide');
            }, 4000);
        });
    };

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
                        <span>@Username</span>

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

                    <div id='account-page-posts-list' className=''>
                        {/* NOTE: the post form AND the 'delete' option in posts should only appear when the user that's logged in is viewing their own profile */}

                        <form id='account-page-post-form' action='/' method='post' encType='multipart/form-data'>
                            <textarea name='postBody' placeholder='Enter post body'></textarea>

                            <input type='text' name='postTags' placeholder='tag1, tag2, tag3, ...' />

                            <div>
                                <input type='file' name='postMedia' accept='image/png, image/jpg, image/jpeg, image/gif' />

                                <button type='submit'>Post</button>
                            </div>

                            <span id='account-page-post-form-error' className=''>Error message</span>
                        </form>

                        <article className='post'>
                            <div className='user-info'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>
                                <span>Username</span>
                            </div>

                            <div className='post-content'>
                                <p>
                                    This is a regular post.
                                </p>

                                <ul>
                                    <li>#vanilla</li>
                                    <li>#explore</li>
                                </ul>
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

                                <button>Delete</button>
                            </div>
                        </article>

                        <article className='post'>
                            <div className='user-info'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>
                                <span>Username</span>
                            </div>

                            <div className='post-content'>
                                <p>
                                    This is a picture.
                                </p>

                                <img src='/pfp/Default_Profile_Picture.png' alt='Post'></img>

                                <ul>
                                    <li>#pics</li>
                                    <li>#explore</li>
                                </ul>
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

                                <button>Delete</button>
                            </div>
                        </article>

                        <article className='post'>
                            <div className='user-info'>
                                <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>
                                <span>Username</span>
                            </div>

                            <div className='post-content'>
                                <p>
                                    This is a video.
                                </p>

                                <video src='https://www.pexels.com/download/video/5896379/?fps=23.97599983215332&h=1920&w=1080' loop controls controlsList='nodownload' disablePictureInPicture></video>

                                <ul>
                                    <li>#vids</li>
                                    <li>#explore</li>
                                </ul>
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

                                <button>Delete</button>
                            </div>
                        </article>
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

                    <form id='account-page-settings-form' action='/account/update' method='post' encType='multipart/form-data' onChange={onChange} onSubmit={onSubmit}>
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

                    <button>Delete</button>
                </div>
            </div>
        </div>
    );
}

export default AccountPage;
