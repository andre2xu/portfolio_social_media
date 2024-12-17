import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import shared from '../shared';

// static
import Logo from '../static/Logo.svg';



function SignUpPage() {
    const redirectTo = useNavigate();

    function signup(event) {
        event.preventDefault();

        const FORM = document.getElementById('signup-form');
        const INPUTS = FORM.getElementsByTagName('input');

        const REQUEST_BODY = {};

        for (let i=0; i < INPUTS.length; i++) {
            const INPUT = INPUTS[i];

            REQUEST_BODY[INPUT.name] = INPUT.value;
        }

        axios.post(shared.resolveBackendRoute(new URL(FORM.action).pathname), REQUEST_BODY, {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object') {
                if (response.data.errorMessage !== undefined) {
                    // sign-up failed

                    document.getElementById('error').innerText = response.data.errorMessage;

                    FORM.classList.add('error');
                }
                else {
                    // sign-up successful

                    FORM.classList.remove('error');

                    redirectTo('/account', {replace: true});
                }
            }
        })
        .catch(() => {
            redirectTo('/error/500');
        });
    };

    return (
        <div id='signup-page'>
            <main>
                <div id='logo-container'>
                    <img src={Logo} alt='Logo'></img>
                </div>

                <div id='signup-form-container'>
                    <h1>Join now for a chance to go viral</h1>

                    <form id='signup-form' action='/signup' method='post' onSubmit={signup}>
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
