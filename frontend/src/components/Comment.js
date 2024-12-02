import shared from '../shared';

// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';



function Comment({
    userData={pfp: '', username: ''},
    commentData={cid: '', comment: '', date: 'DD/MM/YYYY', ownedByUser: undefined, likes: [], dislikes: [], likedByUser: undefined, dislikedByUser: undefined}
}) {
    return (
        <div className='comment' data-cid={commentData.cid}>
            {
                userData.pfp.length > 0 ? <img src={shared.resolveBackendRoute(`/static/users/profile/${userData.pfp}`)} alt='User'></img> : <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>
            }

            <div>
                <div className='comment-info'>
                    <span>@{userData.username}</span>
                    <span>{commentData.date}</span>
                </div>

                <p>{commentData.comment}</p>

                <div className='comment-likes-dislikes'>
                    <div className='likes'>
                        { commentData.likedByUser === true ? <img className='no-fill hide' src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img> : <img className='no-fill' src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img> }

                        { commentData.likedByUser === true ? <img className='fill' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img> : <img className='fill hide' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img> }

                        <span>{commentData.likes.length}</span>
                    </div>

                    <div className='dislikes'>
                        { commentData.dislikedByUser === true ? <img className='no-fill hide' src={NoFill_Icon_ThumbsUp} alt='Dislike Icon'></img> : <img className='no-fill' src={NoFill_Icon_ThumbsUp} alt='Dislike Icon'></img> }

                        { commentData.dislikedByUser === true ? <img className='fill' src={Fill_Icon_ThumbsUp} alt='Dislike Icon'></img> : <img className='fill hide' src={Fill_Icon_ThumbsUp} alt='Dislike Icon'></img> }

                        <span>{commentData.dislikes.length}</span>
                    </div>

                    { commentData.ownedByUser === true ? <button>Delete</button> : null }
                </div>
            </div>
        </div>
    );
};

export default Comment;
