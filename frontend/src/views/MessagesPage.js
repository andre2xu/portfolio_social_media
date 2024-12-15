import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import { useNavigate } from 'react-router-dom';
import shared from '../shared';



function MessagesPage({displayConfirmationDialog}) {
    const FORM_MESSAGE_TIMEOUT_FUNCTION = React.useRef(null);
    const [chats, loadChats] = React.useState([]);

    const redirectTo = useNavigate();

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

        // clear form
        FORM.children('input').each((_, input) => {
            input.value = '';
        });
    };

    function onClickChat(event) {
        const ELEMENT_CLICKED = event.target;

        if (ELEMENT_CLICKED instanceof HTMLButtonElement && ELEMENT_CLICKED.innerText.toLowerCase() === 'x') {
            displayConfirmationDialog(
                () => {
                    const CHAT = $(ELEMENT_CLICKED).closest('.chat');

                    axios.delete(shared.resolveBackendRoute(`/chats/${CHAT.data('cid')}`), {withCredentials: true})
                    .then((response) => {
                        if (response.status === 200 && 'status' in response.data) {
                            if (response.data.status === 'success') {
                                // remove chat from chats list
                                CHAT.remove();
                            }
                        }
                    });
                },
                () => {},
                "Are you sure you want to delete this chat? If you do, it will no longer be available for you and the recipient."
            );
        }
        else if (ELEMENT_CLICKED instanceof HTMLImageElement && ELEMENT_CLICKED.alt === 'User') {
            const OTHER_USER_USERNAME = $(ELEMENT_CLICKED).closest('.chat').find('.chat-info-username').first().text().substring(1);

            redirectTo(`/profile/${OTHER_USER_USERNAME}`);
        }
        else {
            let chat = $(ELEMENT_CLICKED);

            if (chat.hasClass('chat') === false) {
                chat = chat.closest('.chat');
            }

            // enter chat
            redirectTo(`/chat/${chat.data('cid')}`);
        }
    };

    React.useEffect(() => {
        axios.get(shared.resolveBackendRoute('/chats'), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'chatsStartedByUser' in response.data && 'chatsStartedByOthers' in response.data) {
                loadChats([...response.data.chatsStartedByUser, ...response.data.chatsStartedByOthers]);
            }
        });
    }, []);

    return (
        <div id='messages-page' className=''>
            <form id='messages-page-chat-start-form' action='' method='post' encType='multipart/form-data' onSubmit={onSubmit}>
                <input type='text' name='chatName' placeholder='Chat Name' autoComplete='off' />
                <input type='text' name='username' placeholder='@Username' autoComplete='off' />
                <input type='text' name='message' placeholder='Enter message' autoComplete='off' />

                <span className='hide'>Error</span>

                <button type='submit'>Start Chat</button>
            </form>

            <div id='messages-page-chats' onClick={onClickChat}>
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
