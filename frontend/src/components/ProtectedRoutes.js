import React from 'react';
import axios from 'axios';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import shared from '../shared';



function ProtectedRoutes() {
    const [is_authenticated, setAuthenticationFlag] = React.useState();

    const redirectTo = useNavigate();

    React.useEffect(() => {
        axios.post(shared.resolveBackendRoute('/auth'), {}, {withCredentials: true})
        .then((response) => {
            if (response.status === 200 && typeof response.data === 'object' && response.data.isAuthenticated) {
                setAuthenticationFlag(true);
            }
            else {
                setAuthenticationFlag(false);
            }
        })
        .catch(() => {
            redirectTo('/error/500');
        });
    }, [redirectTo]);

    if (is_authenticated === undefined) {
        // show a blank page if something went wrong during authentication
        return null;
    }

    return is_authenticated ? <Outlet /> : <Navigate to={'/login'} replace={true} />;
};

export default ProtectedRoutes;
