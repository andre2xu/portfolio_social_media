// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';



function AccountPage() {
    return (
        <div id='account-page' className=''>
            <div id='account-page-tabs'>
                <button>Profile</button>
                <button>Settings</button>
            </div>

            <div id='account-page-profile'>
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
            </div>

            <div id='account-page-lists'>
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
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
}

export default AccountPage;
