import React from 'react';
import $ from 'jquery';
import axios from 'axios';
import { Link } from 'react-router-dom';

// static
import Logo from '../static/Logo.svg';
import NoFill_Icon_Account from '../static/icons/Icon_Account_NoFill.svg';
import Fill_Icon_Account from '../static/icons/Icon_Account_Fill.svg';
import NoFill_Icon_Bell from '../static/icons/Icon_Bell_NoFill.svg';
import Fill_Icon_Bell from '../static/icons/Icon_Bell_Fill.svg';
import NoFill_Icon_MagnifyingGlass from '../static/icons/Icon_MagnifyingGlass_NoFill.svg';
import Fill_Icon_MagnifyingGlass from '../static/icons/Icon_MagnifyingGlass_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';
import Fill_Icon_Message from '../static/icons/Icon_Message_Fill.svg';
import Icon_Exit from '../static/icons/Icon_Exit.svg';



function MainScreen({component}) {
    const [is_logged_in, setIsLoggedInFlag] = React.useState(false);

    function displayConfirmationDialog(confirmCallback, denyCallback, message, confirmText, denyText) {
        if (typeof confirmCallback !== 'function') {
            throw TypeError("A confirmation callback function is required");
        }

        if (typeof denyCallback !== 'function') {
            throw TypeError("A denial callback function is required");
        }

        const DIALOG = $('#main-screen-dialog');
        const DIALOG_BUTTONS = DIALOG.find('div button');

        // change messages
        if (typeof message === 'string' && message.length > 0) {
            DIALOG.children('p').first().text(message);
        }

        if (typeof confirmText === 'string' && confirmText.length > 0) {
            DIALOG_BUTTONS.first().text(confirmText);
        }

        if (typeof denyText === 'string' && denyText.length > 0) {
            DIALOG_BUTTONS.last().text(denyText);
        }

        // add events to buttons
        DIALOG_BUTTONS.each((i, button) => {
            button = $(button);

            if (i === 0) {
                // deny button

                button.on('click', () => {
                    denyCallback();

                    // hide dialog
                    DIALOG.addClass('hide');

                    DIALOG_BUTTONS.each((_, button) => {
                        // remove events after user interaction
                        $(button).off();
                    });
                });
            }
            else if (i === 1) {
                // confirm button

                button.on('click', () => {
                    confirmCallback();

                    // hide dialog
                    DIALOG.addClass('hide');

                    DIALOG_BUTTONS.each((_, button) => {
                        // remove events after user interaction
                        $(button).off();
                    });
                });
            }
        });

        // display
        DIALOG.removeClass('hide');
    };

    React.useEffect(() => {
        // highlight the navbar button of the current page

        function highlightNavbarButton(_, link) {
            link = $(link);

            if (link[0].href === window.location.href) {
                if (link.hasClass('fill')) {
                    link.removeClass('hide');
                }
                else if (link.hasClass('no-fill')) {
                    link.addClass('hide');
                }
            }
            else {
                if (link.hasClass('fill')) {
                    link.addClass('hide');
                }
                else if (link.hasClass('no-fill')) {
                    link.removeClass('hide');
                }
            }
        };

        $(`#side-navbar > a`).each(highlightNavbarButton);
        $(`#mobile-navbar > a`).each(highlightNavbarButton);
    });

    React.useEffect(() => {
        axios.post('http://localhost:8010/auth', {}, {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && response.data.isAuthenticated) {
                setIsLoggedInFlag(true);
            }
        });
    });

    React.useEffect(() => {
        // cleanup
        return () => {
            // delete dialog events (if any)
            $('#main-screen-dialog div button').each((_, button) => {
                $(button).off();
            });
        }
    });

    return (
        <div id='main-screen'>
            <div id='main-screen-dialog' className='hide'>
                <p>Are you sure you want to proceed with this action?</p>

                <div>
                    <button>Cancel</button>
                    <button>Yes</button>
                </div>
            </div>

            <div id='mobile-title-bar'>
                <h1>My Account</h1>
            </div>

            <nav id='side-navbar'>
                <img src={Logo} alt='Logo'></img>

                <Link to={'/account'} className='no-fill'><img src={NoFill_Icon_Account} alt='Account Icon'></img> <span>My Account</span></Link>
                <Link to={'/account'} className='fill hide'><img src={Fill_Icon_Account} alt='Account Icon'></img> <span>My Account</span></Link>

                <Link to={'/'} className='no-fill'><img src={NoFill_Icon_MagnifyingGlass} alt='Explore Icon'></img> <span>Explore</span></Link>
                <Link to={'/'} className='fill hide'><img src={Fill_Icon_MagnifyingGlass} alt='Explore Icon'></img> <span>Explore</span></Link>

                <Link to={'/account/notifications'} className='no-fill'><img src={NoFill_Icon_Bell} alt='Notifications Icon'></img> <span>Notifications</span></Link>
                <Link to={'/account/notifications'} className='fill hide'><img src={Fill_Icon_Bell} alt='Notifications Icon'></img> <span>Notifications</span></Link>

                <Link to={'/account/messages'} className='no-fill messages-page'><img src={NoFill_Icon_Message} alt='Message Icon'></img> <span>Messages</span></Link>
                <Link to={'/account/messages'} className='fill messages-page hide'><img src={Fill_Icon_Message} alt='Message Icon'></img> <span>Messages</span></Link>

                { is_logged_in ? <Link to={'/logout'} className='logout-button'><img src={Icon_Exit} alt='Logout Icon'></img> <span>Log out</span></Link> : null }
            </nav>

            <main>
                { React.cloneElement(component, {isLoggedIn: is_logged_in, displayConfirmationDialog: displayConfirmationDialog}) }
            </main>

            <aside>
                <h1>Who's viral? &#x1f525;</h1>

                <div id='viral-users-list'>
                    <div className='viral-user'>
                        <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>

                        <span>@Username</span>

                        <button>Follow</button>
                    </div>

                    <div className='viral-user'>
                        <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>

                        <span>@Username</span>

                        <button>Unfollow</button>
                    </div>

                    <div className='viral-user'>
                        <img src='/pfp/Default_Profile_Picture.png' alt='User'></img>

                        <span>@Username</span>

                        <button>Follow</button>
                    </div>
                </div>
            </aside>

            <div id='mobile-navbar'>
                <Link to={'/account'} className='no-fill'><img src={NoFill_Icon_Account} alt='Account Icon'></img></Link>
                <Link to={'/account'} className='fill hide'><img src={Fill_Icon_Account} alt='Account Icon'></img></Link>

                <Link to={'/'} className='no-fill'><img src={NoFill_Icon_MagnifyingGlass} alt='Explore Icon'></img></Link>
                <Link to={'/'} className='fill hide'><img src={Fill_Icon_MagnifyingGlass} alt='Explore Icon'></img></Link>

                <Link to={'/account/messages'} className='no-fill'><img src={NoFill_Icon_Message} alt='Message Icon'></img></Link>
                <Link to={'/account/messages'} className='fill hide'><img src={Fill_Icon_Message} alt='Message Icon'></img></Link>

                { is_logged_in ? <Link to={'/logout'}><img src={Icon_Exit} alt='Logout Icon'></img></Link> : null }
            </div>
        </div>
    );
};

export default MainScreen;
