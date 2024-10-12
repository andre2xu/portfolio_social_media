import { Link } from 'react-router-dom';

// static
import NoFill_Icon_Account from '../static/icons/Icon_Account_NoFill.svg';
import Fill_Icon_Account from '../static/icons/Icon_Account_Fill.svg';
import NoFill_Icon_Bell from '../static/icons/Icon_Bell_NoFill.svg';
import Fill_Icon_Bell from '../static/icons/Icon_Bell_Fill.svg';
import NoFill_Icon_MagnifyingGlass from '../static/icons/Icon_MagnifyingGlass_NoFill.svg';
import Fill_Icon_MagnifyingGlass from '../static/icons/Icon_MagnifyingGlass_Fill.svg';
import NoFill_Icon_Message from '../static/icons/Icon_Message_NoFill.svg';
import Fill_Icon_Message from '../static/icons/Icon_Message_Fill.svg';



function MainScreen() {
    return (
        <div id='main-screen'>
            <div id='mobile-title-bar'>
                <h1>My Account</h1>
            </div>

            <main>
                .
            </main>

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
