import React from 'react';
import $ from 'jquery';
import { useParams } from 'react-router-dom';



function ErrorPage() {
    const URL_PARAMETERS = useParams();

    React.useEffect(() => {
        const ERROR_MESSAGE = $('#error-page-message');

        switch (URL_PARAMETERS.code) {
            case '500':
                ERROR_MESSAGE.text("An error occurred in the server. Please come back later.");
                break;
            case '404':
            default:
                ERROR_MESSAGE.text("The page you were looking for does not exist.");
        }
    }, [URL_PARAMETERS]);

    return (
        <div id='error-page'>
            <h1>Error {URL_PARAMETERS.code}</h1>

            <p id='error-page-message'></p> 
        </div>
    );
};

export default ErrorPage;
