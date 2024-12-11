import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import shared from '../shared';



function MessagesPage() {
    const FORM_MESSAGE_TIMEOUT_FUNCTION = React.useRef(null);
    const [chats, loadChats] = React.useState([]);

    function onSubmit(event) {
        event.preventDefault();

        const FORM = $(event.target);
        const FORM_DATA = {};

        FORM.children('input').each((_, input) => {
            FORM_DATA[input.name] = input.value;
        });

        axios.post(shared.resolveBackendRoute('/chats'), FORM_DATA, {withCredentials: true})
        .then((response) => {
            if (response.status === 200) {
                if ('errorMessage' in response.data) {
                    const MESSAGE = FORM.children('span').first();

                    MESSAGE.text(response.data.errorMessage);
                    MESSAGE.removeClass('hide');

                    clearTimeout(FORM_MESSAGE_TIMEOUT_FUNCTION.current);

                    FORM_MESSAGE_TIMEOUT_FUNCTION.current = setTimeout(() => {
                        MESSAGE.addClass('hide');
                    }, 4000);
                }
                else if ('chatData' in response.data) {
                    // update chats list
                    loadChats((oldChats) => {
                        return [...oldChats, response.data.chatData];
                    });
                }
            }
        });
    };

    return (
        <div id='messages-page' className=''>
            <form id='messages-page-chat-start-form' action='' method='post' encType='multipart/form-data' onSubmit={onSubmit}>
                <input type='text' name='chatName' placeholder='Chat Name' autoComplete='off' />
                <input type='text' name='username' placeholder='@Username' autoComplete='off' />
                <input type='text' name='message' placeholder='Enter message' autoComplete='off' />

                <span className='hide'>Error</span>

                <button type='submit'>Start Chat</button>
            </form>

            <div id='messages-page-chats'>
                {
                    chats.map((chatData, index) => {
                        let recipient_pfp = '/pfp/Default_Profile_Picture.png';

                        if (chatData.recipientPfp.length > 0) {
                            recipient_pfp = shared.resolveBackendRoute(`/static/users/profile/${chatData.recipientPfp}`);
                        }

                        return (
                            <div className='chat' key={index} data-cid={chatData.cid}>
                                <img id='account-page-profile-picture' src={recipient_pfp} alt='User' />

                                <div>
                                    <span className='chat-info-username'>@{chatData.recipientUsername}</span>
                                    <span className='chat-info-chat-name'>{chatData.chatName}</span>

                                    <p>{chatData.recentMessage}</p>
                                </div>

                                <button>X</button>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
};

export default MessagesPage;
