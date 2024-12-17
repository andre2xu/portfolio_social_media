import React from 'react';
import $ from 'jquery';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import shared from '../shared';



function NotificationsPage() {
    const [notifications, loadNotifications] = React.useState([]);

    const redirectTo = useNavigate();

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

    function onToggleSetting(event) {
        let element_clicked = $(event.target);

        const TOGGLE_BUTTON = element_clicked.closest('.toggle-button');

        if (TOGGLE_BUTTON[0] !== undefined) {
            const THUMB = TOGGLE_BUTTON.children('.thumb');
            const BAR = TOGGLE_BUTTON.children('.bar');

            if (TOGGLE_BUTTON.attr('data-enabled') === '0') {
                // enable setting
                $({pos: 0}).animate(
                    {pos: 100},
                    {
                        duration: 100,
                        step: (now) => {
                            THUMB.css({
                                left: `${now}%`,
                                transform: `translateX(-${now}%)`
                            });

                            if (now >= 40) {
                                BAR.css({width: `${now - 20}%`});
                            }
                        },
                        complete: () => {
                            TOGGLE_BUTTON.attr('data-enabled', '1');

                            axios.put(shared.resolveBackendRoute('/notifications/settings'), {setting: TOGGLE_BUTTON.data('setting'), action: 'enable'}, {withCredentials: true})
                            .catch(() => {
                                redirectTo('/error/500');
                            });
                        }
                    }
                );
            }
            else if (TOGGLE_BUTTON.attr('data-enabled') === '1') {
                // disable setting
                $({pos: 100}).animate(
                    {pos: 0},
                    {
                        duration: 100,
                        step: (now) => {
                            THUMB.css({
                                left: `${now}%`,
                                transform: `translateX(-${now}%)`
                            });

                            if (now >= 40) {
                                BAR.css({width: `${now - 20}%`});
                            }
                            else {
                                BAR.css({width: '0%'});
                            }
                        },
                        complete: () => {
                            TOGGLE_BUTTON.attr('data-enabled', '0');

                            axios.put(shared.resolveBackendRoute('/notifications/settings'), {setting: TOGGLE_BUTTON.data('setting'), action: 'disable'}, {withCredentials: true})
                            .catch(() => {
                                redirectTo('/error/500');
                            });
                        }
                    }
                );
            }
        }
    };

    React.useEffect(() => {
        axios.get(shared.resolveBackendRoute('/notifications/settings'), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'settings' in response.data) {
                const USER_SETTINGS = response.data.settings;

                $('#notifications-page-settings').find('.toggle-button').each((_, toggleButton) => {
                    const SETTING = toggleButton.getAttribute('data-setting');
                    const ENABLED_STATUS = USER_SETTINGS[SETTING];

                    if (ENABLED_STATUS !== undefined) {
                        toggleButton.setAttribute('data-enabled', ENABLED_STATUS);

                        if (ENABLED_STATUS === 1) {
                            // toggle button bar
                            $(toggleButton.firstElementChild).css({width: '80%'});

                            // toggle button thumb
                            $(toggleButton.lastElementChild).css({
                                left: '100%',
                                transform: 'translateX(-100%)'
                            });
                        }
                    }
                });
            }
        })
        .catch(() => {
            redirectTo('/error/500');
        });
    }, [redirectTo]);

    React.useEffect(() => {
        axios.get(shared.resolveBackendRoute('/notifications'), {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && 'notifications' in response.data) {
                loadNotifications(response.data.notifications);
            }
        })
        .catch(() => {
            redirectTo('/error/500');
        });
    }, [redirectTo]);

    return (
        <div id='notifications-page' className=''>
            <div id='notifications-page-tabs' onClick={changeTabs}>
                <button>Notifications</button>
                <button>Settings</button>
            </div>

            <div id='notifications-page-messages' className=''>
                {
                    notifications.map((notificationData, index) => {
                        return (
                            <div className='notification' key={index}>
                                <h1>{notificationData.title}</h1>
                                <p>{notificationData.body}</p>
                            </div>
                        );
                    })
                }
            </div>

            <div id='notifications-page-settings' className='hide' onClick={onToggleSetting}>
                <div className='settings-group'>
                    <h1>Chats</h1>

                    <div className='setting'>
                        <p>Tell me if a follower started a chat with me.</p>

                        <div className='toggle-button' data-enabled='0' data-setting='followerStartedChat'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>

                    <div className='setting'>
                        <p>Tell me if a stranger started a chat with me.</p>

                        <div className='toggle-button' data-enabled='0' data-setting='strangerStartedChat'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>
                </div>

                <div className='settings-group'>
                    <h1>Posts</h1>

                    <div className='setting'>
                        <p>Notify me when someone liked one of my posts.</p>

                        <div className='toggle-button' data-enabled='0' data-setting='newPostLike'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>

                    <div className='setting'>
                        <p>Notify me when there's a new comment in one of my posts.</p>

                        <div className='toggle-button' data-enabled='0' data-setting='newPostComment'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>
                </div>

                <div className='settings-group'>
                    <h1>Network</h1>

                    <div className='setting'>
                        <p>Let me know if someone followed me.</p>

                        <div className='toggle-button' data-enabled='0' data-setting='newFollower'>
                            <div className='bar'></div>
                            <div className='thumb'></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
