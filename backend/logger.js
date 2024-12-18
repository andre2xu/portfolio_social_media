const winston = require('winston');



const Logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.File({filename: './logs/error.log', level: 'error'})
    ]
});



module.exports = {
    Logger
};
