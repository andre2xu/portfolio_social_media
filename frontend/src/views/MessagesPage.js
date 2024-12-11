import axios from 'axios';
import $ from 'jquery';
import shared from '../shared';



function MessagesPage() {
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
                console.log(response.data);
            }
        });
    };

    return (
        <div id='messages-page' className=''>
            <form id='messages-page-chat-start-form' action='' method='post' encType='multipart/form-data' onSubmit={onSubmit}>
                <input type='text' name='chatName' placeholder='Chat Name' />
                <input type='text' name='username' placeholder='@Username' />
                <input type='text' name='message' placeholder='Enter message' />

                <span>That user doesn't exist</span>

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
