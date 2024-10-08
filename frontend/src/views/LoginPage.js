// static
import Logo from '../static/Logo.svg';



function LoginPage() {
    return (
        <div id='login-page'>
            <main>
                <div id='logo-container'>
                    <img src={Logo} alt='Logo'></img>
                </div>

                <div id='login-form-container'>
                    <h1>Join now for a chance to go viral</h1>

                    <form id='login-form' action='/login' method='post'>
                        <div className='field'>
                            <label htmlFor='username'>Username</label>
                            <input type='text' id='username' name='username' />
                        </div>

                        <div className='field'>
                            <label htmlFor='password'>Password</label>
                            <input type='text' id='password' name='password' />
                        </div>

                        <button type='submit'>Log in</button>

                        <h2>Don't have an account?</h2>
                        <button>Sign up</button>
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
