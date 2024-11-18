function NotificationsPage() {
    function changeTabs(event) {
        const NOTIFICATIONS_SECTION = document.getElementById('notifications-page-messages');
        const SETTINGS_SECTION = document.getElementById('notifications-page-settings');

        switch (event.target.innerText) {
            case 'Notifications':
                NOTIFICATIONS_SECTION.classList.remove('hide');
                SETTINGS_SECTION.classList.add('hide');
                break;
            case 'Settings':
                SETTINGS_SECTION.classList.remove('hide');
                NOTIFICATIONS_SECTION.classList.add('hide');
                break;
            default:
        }
    };

    return (
        <div id='notifications-page' className=''>
            <div id='notifications-page-tabs' onClick={changeTabs}>
                <button>Notifications</button>
                <button>Settings</button>
            </div>

            <div id='notifications-page-messages' className=''>
                <div className='notification'>
                    <h1>Notification Title</h1>
                    <p>This is the notification body</p>
                </div>

                <div className='notification'>
                    <h1>Notification Title</h1>
                    <p>This is the notification body</p>
                </div>

                <div className='notification'>
                    <h1>Notification Title</h1>
                    <p>afdjnfiofnoinaoinfwioafawofjnaoifjwfhwfijafowioajhffhowhhfaahwhfuaanohfwohfuoah</p>
                </div>
            </div>

            <div id='notifications-page-settings' className='hide'>
                <div className='settings-group'>
                    <h1>Chats</h1>

                    <div className='setting'>
                        <p>Tell me if someone I follow messaged me.</p>

                        <div className='toggle-button'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>

                    <div className='setting'>
                        <p>Tell me if someone I don't follow messaged me.</p>

                        <div className='toggle-button'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>
                </div>

                <div className='settings-group'>
                    <h1>Posts</h1>

                    <div className='setting'>
                        <p>Notify me when someone liked one of my posts.</p>

                        <div className='toggle-button'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>

                    <div className='setting'>
                        <p>Notify me when there's a new comment in one of my posts.</p>

                        <div className='toggle-button'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>
                </div>

                <div className='settings-group'>
                    <h1>Network</h1>

                    <div className='setting'>
                        <p>Let me know if someone followed me.</p>

                        <div className='toggle-button'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificationsPage;
