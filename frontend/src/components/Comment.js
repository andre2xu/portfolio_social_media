import React from 'react';
import $ from 'jquery';
import shared from '../shared';

// static
import NoFill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_NoFill.svg';
import Fill_Icon_ThumbsUp from '../static/icons/Icon_ThumbsUp_Fill.svg';



function Comment({
    userData={pfp: '', username: ''},
    commentData={cid: '', comment: '', date: 'DD/MM/YYYY', ownedByUser: undefined, likes: [], dislikes: [], likedByUser: undefined, dislikedByUser: undefined}
}) {
    React.useEffect(() => {
        // highlight all usernames in the comments
        const COMMENT_BODY = $(`[data-cid="${commentData.cid}"] > div p`);

        const USERNAME_PATTERN = /@[a-zA-Z0-9]{1,20}/g;
        const ALL_USERNAMES = COMMENT_BODY.text().match(USERNAME_PATTERN);

        if (ALL_USERNAMES !== null) {
            let new_comment_html = COMMENT_BODY.html();

            $(ALL_USERNAMES).each((_, username) => {
                new_comment_html = new_comment_html.replace(username, `<span class="reply-username">${username}</span>`);
            });

            COMMENT_BODY.html(new_comment_html);
        }
    }, [commentData.cid]);

    return (
        <div className='comment' data-cid={commentData.cid} data-likedbyuser={commentData.likedByUser} data-dislikedbyuser={commentData.dislikedByUser}>
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
