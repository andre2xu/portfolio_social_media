function ChatScreen() {
    return (
        <div id='chat-screen' className=''>
            <div id='chat-screen-chat-info'>
                <button>&larr;</button>

                <h1>Chat Name</h1>
                <h2>@Username</h2>
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
}

export default ChatScreen;
