import shared from '../shared';

// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';



function Comment({
    userData={pfp: '', username: ''},
    commentData={cid: '', comment: '', date: 'DD/MM/YYYY', ownedByUser: undefined}
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
                        <img src={NoFill_Icon_ThumbsUp} alt='Like Icon'></img>
                        <img className='hide' src={Fill_Icon_ThumbsUp} alt='Like Icon'></img>
                        <span>50</span>
                    </div>

                    <div className='dislikes'>
                        <img src={NoFill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                        <img className='hide' src={Fill_Icon_ThumbsUp} alt='Dislike Icon'></img>
                        <span>50</span>
                    </div>

                    { commentData.ownedByUser === true ? <button>Delete</button> : null }
                </div>
            </div>
        </div>
    );
};

export default Comment;
