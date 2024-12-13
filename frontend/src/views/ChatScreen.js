import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import { useNavigate, useParams } from 'react-router-dom';
import shared from '../shared';



function ChatScreen() {
    const URL_PARAMETERS = useParams();
    const redirectTo = useNavigate();

    function goBack() {
        redirectTo(-1);
    };

    React.useEffect(() => {
        axios.get(shared.resolveBackendRoute(`/messages/${URL_PARAMETERS.cid}`), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'chatData' in response.data && 'messages' in response.data) {
                const CHAT_DATA = response.data.chatData;
                const CHAT_INFO = $('#chat-screen-chat-info');

                // display the chat's name
                CHAT_INFO.children('h1').text(CHAT_DATA.chatName);

                // display the username of the other user
                if ('userIsChatOwner' in CHAT_DATA) {
                    CHAT_INFO.children('h2').text(`@${CHAT_DATA.recipient}`);
                }
                else if ('userIsRecipient' in CHAT_DATA) {
                    CHAT_INFO.children('h2').text(`@${CHAT_DATA.owner}`);
                }
            }
        });
    }, [URL_PARAMETERS.cid]);

    return (
        <div id='chat-screen' className=''>
            <div id='chat-screen-chat-info'>
                <button onClick={goBack}>&larr;</button>

                <h1> </h1>
                <h2> </h2>
            </div>

            <div id='chat-screen-conversation'>
                <div className='message sender'>
                    Hey I'm sending this message to you
                </div>

                <div className='message recipient'>
                    Ok, I received it
                </div>
            </div>

            <form id='chat-screen-message-form' action='' method='post'>
                <input type='text' name='message' placeholder='Message' />

                <button type='submit'>Send</button>
            </form>
        </div>
    );
};

export default ChatScreen;
