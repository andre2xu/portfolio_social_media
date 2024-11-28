// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';



function Post({
    userInfo={pfp: '/pfp/Default_Profile_Picture.png', username: 'User'},
    postInfo={pid: '', body: '', tags: [], date: 'DD/MM/YYYY', likes: 0, comments: 0},
    media={src: '', type: 'image'},
    isDeletable=true
}) {
    return (
        <article className='post' data-pid={postInfo.pid}>
            <div className='user-info'>
                <img src={userInfo.pfp} alt='User'></img>
                <span>{userInfo.username}</span>
            </div>

            <div className='post-content'>
                <p>
                    {postInfo.body}
                </p>

                { media.type === 'image' && typeof media.src === 'string' && media.src.length > 0 ? <img src={media.src} alt='Post'></img> : null }

                { media.type === 'video' && typeof media.src === 'string' && media.src.length > 0 ? <video src={media.src} loop controls controlsList='nodownload' disablePictureInPicture></video> : null }

                <ul>
                    {
                        postInfo.tags.map((tag, index) => {
                            return <li key={index}>#{tag}</li>;
                        })
                    }
                </ul>
            </div>

            <div className='post-info'>
                <span className='publish-date'>{postInfo.date}</span>

                <div className='likes'>
                    <img className='no-fill' src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img>
                    <img className='fill hide' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img>
                    <span>{postInfo.likes}</span>
                </div>

                <div className='comments'>
                    <img src={NoFill_Icon_Message} alt='Comment Icon'></img>
                    <span>{postInfo.comments}</span>
                </div>

                { isDeletable ? <button>Delete</button> : null }
            </div>
        </article>
    );
};

export default Post;
