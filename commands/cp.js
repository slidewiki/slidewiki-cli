'use strict';

const deckService = require('../services/deck');

const self = module.exports = {

    execute: function(argv) {
        if (argv.verbose) console.log(`copying ${argv.deck_id} from ${argv.source} to ${argv.target}`);

        let deckId = argv.deck_id;

        copyDeck(deckId, argv.source, argv.target, argv.verbose).then((subDeckIds) => {
            console.log(subDeckIds);
        }).catch((err) => {
            if (err.statusCode === 404) {
                return console.error(`could not find deck tree ${deckId} on the server`);
            }

            console.error(err.message || err);
        });
    },

};

function copyDeck(deckId, source, target, verbose=false) {

    return deckService.read(deckId, source).then((deck) => {
        if (verbose) console.log(`successfully fetched deck metadata for ${deckId} from ${source}`);

        // console.log(deck);

        let userId = 46;
        return deckService.create(deck, userId, target)
            .then((newDeck) => deckService.read(newDeck.id, target))
            .then((newDeck) => {
                let newDeckId = newDeck._id;
                console.info(`successfully created deck ${newDeckId} in ${target}`);

                // console.log(newDeck);

                // this api creates a slide we don't want, let's remove it
                return deckService.removeNode(newDeckId, 0, userId, target).then(() => {
                    // now we want to add the stuff from the original deck :)
                    return deck.revisions[0].contentItems.reduce((p, cItem) => {
                        return p.then((subDeckIds) => {
                            let cItemId = `${cItem.ref.id}-${cItem.ref.revision}`;
                            if (cItem.kind === 'slide') {
                                // we can also add some payload for creation :)
                                return deckService.readSlide(cItemId, source)
                                    .then((slide) => deckService.appendSlide(newDeckId, slide, userId, target))
                                    .then((res) => console.log(`created slide ${res.id}`))
                                    .then(() => subDeckIds);
                            } else {
                                return deckService.appendDeck(newDeckId, userId, target)
                                    .then((res) => {
                                        // again, this creates a deck with a slide that we need to remove
                                        return deckService.removeNode(res.id, 0, userId, target)
                                            .then(() => console.log(`created subdeck ${res.id}`))
                                            .then(() => subDeckIds.set(cItemId, res.id)); // we are gathering all direct subdecks created under the deck
                                    });
                            }
                        });

                    }, Promise.resolve(new Map()));
                });

            });

    });

}
