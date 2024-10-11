import React from 'react';
import axios from 'axios';
import { Outlet, Navigate } from 'react-router-dom';



function ProtectedRoutes() {
    const [is_authenticated, setAuthenticationFlag] = React.useState();

    React.useEffect(() => {
        axios.post('http://localhost:8010/auth', {}, {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && response.data.isAuthenticated) {
                setAuthenticationFlag(true);
            }
            else {
                setAuthenticationFlag(false);
            }
        });
    }, []);

    if (is_authenticated === undefined) {
        // show a blank page if something went wrong during authentication
        return null;
    }

    return is_authenticated ? <Outlet /> : <Navigate to={'/login'} replace={true} />;
};

export default ProtectedRoutes;
