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

// views
import ExplorePage from './ExplorePage';
import AccountPage from './AccountPage';
import MessagesPage from './MessagesPage';
import NotificationsPage from './NotificationsPage';

import ChatScreen from './ChatScreen';
import NotificationScreen from './NotificationScreen';
import CommentsScreen from './CommentsScreen';



function MainScreen() {
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

                <Link to={'/'} className='no-fill'><img src={NoFill_Icon_Account} alt='Account Icon'></img> <span>My Account</span></Link>
                <Link to={'/'} className='fill hide'><img src={Fill_Icon_Account} alt='Account Icon'></img> <span>My Account</span></Link>

                <Link to={'/'} className='no-fill'><img src={NoFill_Icon_MagnifyingGlass} alt='Explore Icon'></img> <span>Explore</span></Link>
                <Link to={'/'} className='fill hide'><img src={Fill_Icon_MagnifyingGlass} alt='Explore Icon'></img> <span>Explore</span></Link>

                <Link to={'/'} className='no-fill'><img src={NoFill_Icon_Bell} alt='Notifications Icon'></img> <span>Notifications</span></Link>
                <Link to={'/'} className='fill hide'><img src={Fill_Icon_Bell} alt='Notifications Icon'></img> <span>Notifications</span></Link>

                <Link to={'/'} className='no-fill messages-page'><img src={NoFill_Icon_Message} alt='Message Icon'></img> <span>Messages</span></Link>
                <Link to={'/'} className='fill messages-page hide'><img src={Fill_Icon_Message} alt='Message Icon'></img> <span>Messages</span></Link>

                <Link to={'/'} className='logout-button'><img src={Icon_Exit} alt='Logout Icon'></img> <span>Log out</span></Link>
            </nav>

            <main>
                <ExplorePage />

                <CommentsScreen />

                <AccountPage />

                <MessagesPage />

                <NotificationsPage />

                <ChatScreen />

                <NotificationScreen />
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
                <Link to={'/'}><img src={NoFill_Icon_Account} alt='Account Icon'></img></Link>
                <Link to={'/'} className='hide'><img src={Fill_Icon_Account} alt='Account Icon'></img></Link>

                <Link to={'/'}><img src={NoFill_Icon_MagnifyingGlass} alt='Explore Icon'></img></Link>
                <Link to={'/'} className='hide'><img src={Fill_Icon_MagnifyingGlass} alt='Explore Icon'></img></Link>

                <Link to={'/'}><img src={NoFill_Icon_Bell} alt='Notifications Icon'></img></Link>
                <Link to={'/'} className='hide'><img src={Fill_Icon_Bell} alt='Notifications Icon'></img></Link>

                <Link to={'/'}><img src={NoFill_Icon_Message} alt='Message Icon'></img></Link>
                <Link to={'/'} className='hide'><img src={Fill_Icon_Message} alt='Message Icon'></img></Link>
            </div>
        </div>
    );
};

export default MainScreen;
