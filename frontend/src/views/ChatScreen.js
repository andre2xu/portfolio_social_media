import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import { useNavigate, useParams } from 'react-router-dom';
import shared from '../shared';



function ChatScreen() {
    const [messages, loadMessages] = React.useState([]);

    const URL_PARAMETERS = useParams();
    const redirectTo = useNavigate();

    function goBack() {
        redirectTo(-1);
    };

    React.useEffect(() => {
        // add user to the collection of backend web socket clients (i.e. make them available to receive live messages from other client web sockets)
        const CLIENT_WEB_SOCKET = new WebSocket(shared.getWebSocketServerURI());

        CLIENT_WEB_SOCKET.addEventListener('open', () => {
            // retrieve existing chat data
            axios.get(shared.resolveBackendRoute(`/messages/${URL_PARAMETERS.cid}`), {withCredentials: true})
            .then((response) => {
                if (response.status === 200 && 'chatData' in response.data && 'messages' in response.data) {
                    const CHAT_DATA = response.data.chatData;
                    const CHAT_INFO = $('#chat-screen-chat-info');

                    const WEB_SOCKET_USER_DATA = {
                        type: 'user',
                        username: ''
                    };

                    // display the chat's name
                    CHAT_INFO.children('h1').text(CHAT_DATA.chatName);

                    // display the username of the other user
                    if ('userIsChatOwner' in CHAT_DATA) {
                        CHAT_INFO.children('h2').text(`@${CHAT_DATA.recipient}`);

                        WEB_SOCKET_USER_DATA.username = CHAT_DATA.owner;
                    }
                    else if ('userIsRecipient' in CHAT_DATA) {
                        CHAT_INFO.children('h2').text(`@${CHAT_DATA.owner}`);

                        WEB_SOCKET_USER_DATA.username = CHAT_DATA.recipient;
                    }

                    // pass the user's username to the web socket server so that it can be binded to their web socket client instance
                    CLIENT_WEB_SOCKET.send(JSON.stringify(WEB_SOCKET_USER_DATA));

                    // load messages
                    loadMessages(response.data.messages);
                }
            });
        });

        return () => {
            CLIENT_WEB_SOCKET.close();
        }
    }, [URL_PARAMETERS.cid]);

    return (
        <div id='chat-screen' className=''>
            <div id='chat-screen-chat-info'>
                <button onClick={goBack}>&larr;</button>

                <h1> </h1>
                <h2> </h2>
            </div>

            <div id='chat-screen-conversation'>
                {
                    messages.map((messageData, index) => {
                        if ('sentByUser' in messageData) {
                            return (
                                <div key={index} className='message sender'>{messageData.message}</div>
                            );
                        }

                        return (
                            <div key={index} className='message recipient'>{messageData.message}</div>
                        );
                    })
                }
            </div>

            <form id='chat-screen-message-form' action='' method='post'>
                <input type='text' name='message' placeholder='Message' />

                <button type='submit'>Send</button>
            </form>
        </div>
    );
};

export default ChatScreen;
