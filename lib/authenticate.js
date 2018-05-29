'use strict';

const userService = require('../services/user');

const prompt = require('prompt');

// customize prompt
prompt.message = '';

// authenticates user against the user service and returns user info and authentication token
function authenticate(email, password, authUrl) {
    return getPassword(email, password)
        .then((password) => userService.authenticate(email, password, authUrl));
}

// returns password after optional prompt as a promise
function getPassword(email, password) {
    if (password) return Promise.resolve(password);

    // prompt for password
    return new Promise((resolve, reject) => {
        prompt.start();

        prompt.get({
            properties: {
                password: {
                    description: `Please provide a password for user ${email}`,
                    hidden: true,
                },
            },
        }, (err, result) => {
            if (err) return reject(err);

            resolve(result.password);
        });
    });

}

module.exports = {
    authenticate,
};
