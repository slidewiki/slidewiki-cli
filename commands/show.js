'use strict';

const deckService = require('../services/deck');

const self = module.exports = {

    execute: function(argv) {
        let deckId = argv.deck_id;

        deckService.read(deckId, argv.source).then((deck) => {
            console.log(deck);
        }).catch((err) => {
            if (err.statusCode === 404) {
                return console.error(`could not find deck tree ${deckId} on the server`);
            }

            console.error(err.message || err);
        });
    },

};
