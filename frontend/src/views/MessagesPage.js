import React from 'react';
import axios from 'axios';
import $ from 'jquery';
import shared from '../shared';



function MessagesPage() {
    const FORM_MESSAGE_TIMEOUT_FUNCTION = React.useRef(null);

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
                <div className='chat'>
                    <img id='account-page-profile-picture' src='/pfp/Default_Profile_Picture.png' alt='User' />

                    <div>
                        <span className='chat-info-username'>@Username</span>
                        <span className='chat-info-chat-name'>Chat Name</span>

                        <p>Hi, this is a message</p>
                    </div>

                    <button>X</button>
                </div>

                <div className='chat'>
                    <img id='account-page-profile-picture' src='/pfp/Default_Profile_Picture.png' alt='User' />

                    <div>
                        <span className='chat-info-username'>@Username</span>
                        <span className='chat-info-chat-name'>Chat Name</span>

                        <p>iwjdijq0ijdq0wjd0qwjd0qwjd0q8wdj8qww0juwqd8w08qdd8jwq8dh08wq08hdhqw0h8dh80qwd</p>
                    </div>

                    <button>X</button>
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
