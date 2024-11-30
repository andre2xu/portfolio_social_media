function Comment({
    userData={pfp: '/pfp/Default_Profile_Picture.png', username: ''},
    commentData={comment: '', date: 'DD/MM/YYYY'}
}) {
    return (
        <div className='comment'>
            <img src={userData.pfp} alt='User'></img>

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
                </div>
            </div>
        </div>
    );
};

export default Comment;
