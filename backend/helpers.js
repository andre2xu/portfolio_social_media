const jwt = require('jsonwebtoken');



function authenticateUser(req) {
    const RESULT = {
        isAuthenticated: false,
        tokenData: {}
    };

    const LOGIN_TOKEN = req.cookies.LT;

    try {
        if (LOGIN_TOKEN !== undefined) {
            RESULT.tokenData = jwt.verify(LOGIN_TOKEN, process.env.LTS);

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
        process.env.LTS,
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



module.exports = {
    authenticateUser,
    generateLoginToken
};
