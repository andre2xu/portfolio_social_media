// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';



function ExplorePage() {
    return (
        <div id='explore-page'>
            <div id='explore-page-login-prompt'>
                <p>You need to sign in to make a post</p>
                <button>Login</button>
            </div>

            <div id='explore-page-posts'>
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
    );
};

export default ExplorePage;
