import { Link } from 'react-router-dom';

// static
import Logo from '../static/Logo.svg';



function SignUpPage() {
    return (
        <div id='signup-page'>
            <main>
                <div id='logo-container'>
                    <img src={Logo} alt='Logo'></img>
                </div>

                <div id='signup-form-container'>
                    <h1>Join now for a chance to go viral</h1>

                    <form id='signup-form' action='/signup' method='post'>
                        <div className='field'>
                            <label htmlFor='username'>Username</label>
                            <input type='text' id='username' name='username' />
                        </div>

                        <div className='field'>
                            <label htmlFor='password'>Password</label>
                            <input type='password' id='password' name='password' />
                        </div>

                        <div className='field'>
                            <label htmlFor='confirm-password'>Confirm Password</label>
                            <input type='password' id='confirm-password' name='confirmPassword' />
                        </div>

                        <span id='error'>That username already exists</span>

                        <button type='submit'>Create Account</button>

                        <h2>Already have an account?</h2>
                        <Link to={'/login'}>Sign in</Link>
                    </form>
                </div>
            </main>

            <footer>
                <ul>
                    <li>About</li>
                    <li>Terms of Service</li>
                    <li>Privacy Policy</li>
                    <li>&copy; {new Date().getFullYear()} Virost</li>
                </ul>
            </footer>
        </div>
    );
};

export default SignUpPage;
