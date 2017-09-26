'use strict';

const rp = require('request-promise-native');

// this is wrong :)
const hashingSalt = '6cee6c6a420e0573d1a4ad8ecb44f2113d010a0c3aadd3c1251b9aa1406ba6a3';
const { sha512 } = require('js-sha512');

const self = module.exports = {

    authenticate: function(email, password, url) {
        // hash the password before submitting
        password = sha512(password + hashingSalt);

        return rp.post({
            uri: `${url}/login`,
            body: { email, password },
            json: true,
            resolveWithFullResponse: true,
        }).then((response) => ({
            userId: response.body.userid,
            userName: response.body.username,
            authToken: response.headers['----jwt----'],
        }));
    },

};
