// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';



function Comments() {
    return (
        <div id='comments-screen' className='hide'>
            <article id='comments-screen-post'>
                <button>&larr;</button>

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

            <form id='comments-screen-reply-form' action='/' method='post'>
                <input type='text' name='replyBody' placeholder='Write your reply here' />

                <button type='submit'>Send</button>
            </form>

            <section id='comments-screen-comments'>
                <h1>Comments</h1>

                <div className='comment'>
                    <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>

                    <div>
                        <div className='comment-info'>
                            <span>@Username</span>
                            <span>0 hrs</span>
                        </div>

                        <p>
                            This is a comment.
                        </p>

                        <div className='comment-likes-dislikes'>
                            <div className='likes'>
                                <img src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img>
                                <img className='hide' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img>
                                <span>50</span>
                            </div>

                            <div className='dislikes'>
                                <img src={NoFill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                                <img className='hide' src={Fill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                                <span>50</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='comment'>
                    <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>

                    <div>
                        <div className='comment-info'>
                            <span>@Username</span>
                            <span>0 hrs</span>
                        </div>

                        <p>
                            <span className='reply-username'>@Username</span> this is a reply.
                        </p>

                        <div className='comment-likes-dislikes'>
                            <div className='likes'>
                                <img src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img>
                                <img className='hide' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img>
                                <span>50</span>
                            </div>

                            <div className='dislikes'>
                                <img src={NoFill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                                <img className='hide' src={Fill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                                <span>50</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Comments;
