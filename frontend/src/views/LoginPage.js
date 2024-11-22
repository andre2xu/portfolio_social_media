import React from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import shared from '../shared';

// static
import Logo from '../static/Logo.svg';



function LoginPage() {
    const redirectTo = useNavigate();

    function login(event) {
        event.preventDefault();

        const FORM = document.getElementById('login-form');
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
                    // login failed

                    document.getElementById('error').innerText = response.data.errorMessage;

                    FORM.classList.add('error');
                }
                else {
                    // login successful

                    FORM.classList.remove('error');

                    redirectTo('/account', {replace: true});
                }
            }
        });
    };

    React.useEffect(() => {
        // attempt to auto login the user if there's a token
        axios.post(shared.resolveBackendRoute('/auth'), {}, {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && response.data.isAuthenticated) {
                redirectTo('/account', {replace: true});
            }
        });
    });

    return (
        <div id='login-page'>
            <main>
                <div id='logo-container'>
                    <img src={Logo} alt='Logo'></img>
                </div>

                <div id='login-form-container'>
                    <h1>Join now for a chance to go viral</h1>

                    <form id='login-form' action='/login' method='post' onSubmit={login}>
                        <div className='field'>
                            <label htmlFor='username'>Username</label>
                            <input type='text' id='username' name='username' />
                        </div>

                        <div className='field'>
                            <label htmlFor='password'>Password</label>
                            <input type='password' id='password' name='password' />
                        </div>

                        <span id='error'>Invalid credentials</span>

                        <button type='submit'>Log in</button>

                        <h2>Don't have an account?</h2>
                        <Link to={'/signup'}>Sign up</Link>
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

export default LoginPage;
