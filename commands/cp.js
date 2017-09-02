'use strict';

const deckService = require('../services/deck');

const self = module.exports = {

    execute: function(argv) {
        if (argv.verbose) console.log(`copying ${argv.deck_id} from ${argv.source} to ${argv.target}`);

        let deckId = argv.deck_id;

        // 0 means we need a new deck
        copyDeck(deckId, 0, argv.source, argv.target, argv.verbose).then((newDeckId) => {
            console.info(`finished copying deck ${deckId} contents from ${argv.source} to deck ${newDeckId} in ${argv.target}`);
        }).catch((err) => {
            if (err.statusCode) {
                if (err.statusCode === 404) {
                    return console.error(`could not find deck tree ${deckId} on the server`);
                }
                return console.error(err.message);
            }

            console.error(err);
        });
    },

};

function copyDeck(deckId, targetId, source, target, verbose=false) {
    let newDeckId;

    return deckService.read(deckId, source).then((deck) => {
        if (verbose) console.log(`fetched deck metadata for ${deckId} from ${source}`);

        // console.log(deck);

        let userId = 46;

        if (targetId) {
            // deck exists, we update its metadata...
            return deckService.updateDeck(targetId, deck, userId, target).then(() => {
                if (verbose) console.log(`updated deck ${targetId} in ${target} with data from deck ${deckId} from source`);

                // ... and add the children from the original deck :)
                return copyDeckChildren(deck, targetId, userId, source, target, verbose);
            });
        }

        return deckService.create(deck, userId, target).then((newDeck) => {
            newDeckId = newDeck.id;
            if (verbose) console.log(`created deck ${newDeckId} in ${target} with data from deck ${deckId} from source`);

            // this api creates a slide we don't want, let's remove it
            return deckService.removeNode(newDeckId, 0, userId, target).then(() => {
                // now we want to add the stuff from the original deck :)
                return copyDeckChildren(deck, newDeckId, userId, source, target, verbose);
            });

        });

    }).then((subDeckIds) => {
        // we need to recursively continue copying the subdecks returned !!!
        return Array.from(subDeckIds.entries()).reduce((p, entry) => {
            let [sourceDeckId, targetDeckId] = entry;
            return p.then(() => copyDeck(sourceDeckId, targetDeckId, source, target, verbose));
        }, Promise.resolve());

    }).then(() => newDeckId);
    // return the newDeckId (it should only be defined for the root function call, and that's where we need it anyway)
}

// reads the nodes from the sourceDeck and creates them in the target deck id
function copyDeckChildren(sourceDeck, targetDeckId, targetUserId, sourceURL, targetURL, verbose=false) {

    return sourceDeck.revisions[0].contentItems.reduce((p, cItem) => {
        return p.then((subDeckIds) => {
            let cItemId = `${cItem.ref.id}-${cItem.ref.revision}`;
            if (cItem.kind === 'slide') {
                return deckService.readSlide(cItemId, sourceURL).then((slide) => {
                    if (verbose) console.log(`fetched slide data for ${cItemId}`);

                    return deckService.appendNode(targetDeckId, 'slide', targetUserId, targetURL).then((newSlide) => {
                        if (verbose) console.log(`created slide ${newSlide.id}`);

                        return deckService.updateSlide(targetDeckId, newSlide.id, slide, targetUserId, targetURL);
                    });

                }).then(() => subDeckIds); // always return the list so that it can be forwarded to the next iteration
            } else {
                return deckService.appendNode(targetDeckId, 'deck', targetUserId, targetURL)
                    .then((res) => {
                        // again, this creates a deck with a slide that we need to remove
                        return deckService.removeNode(res.id, 0, targetUserId, targetURL)
                            // .then(() => console.log(`created subdeck ${res.id}`))
                            .then(() => subDeckIds.set(cItemId, res.id)); // we are gathering all direct subdecks created under the deck
                    });
            }
        });

    }, Promise.resolve(new Map()));

}
