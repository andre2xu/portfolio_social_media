const jwt = require('jsonwebtoken');
const { Logger } = require('./logger');



function authenticateUser(req) {
    const RESULT = {
        isAuthenticated: false,
        tokenData: {}
    };

    const LOGIN_TOKEN = req.cookies.LT;

    try {
        if (LOGIN_TOKEN !== undefined) {
            RESULT.tokenData = jwt.verify(LOGIN_TOKEN, process.env.PORTFOLIO_SOCIAL_MEDIA_LTS);

            RESULT.isAuthenticated = true;
        }
    }
    catch {}

    return RESULT;
};

function generateLoginToken(res, uid) {
    const TOKEN_EXPIRATION = 60 * 60 * 2;

    const LOGIN_TOKEN = jwt.sign(
        {uid: uid},
        process.env.PORTFOLIO_SOCIAL_MEDIA_LTS,
        {expiresIn: TOKEN_EXPIRATION}
    );

    res.cookie(
        'LT',
        LOGIN_TOKEN,
        {
            maxAge: TOKEN_EXPIRATION * 1000,
            httpOnly: true,
            sameSite: true,
            secure: true
        }
    );
};

function logControllerError(req, error) {
    try {
        const IP = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();

        Logger.error(`[${req.path}] ${error} [data: ${JSON.stringify({ip: IP, params: req.params, body: req.body})}]`);
    }
    catch (error) {
        Logger.error(`[helpers.logControllerError] ${error}`);
    }
};



module.exports = {
    authenticateUser,
    generateLoginToken,
    logControllerError
};
