'use strict';

const { authenticate } = require('../lib/authenticate');

const deckService = require('../services/deck');

const self = module.exports = {

    execute: function(argv) {
        let deckId = argv.deck_id;

        // first let's authenticate
        authenticate(argv.email, argv.password, argv.authority)
            .catch((err) => {
                if (err.statusCode === 404) {
                    // wrong credentials
                    console.error(`could not authenticate ${argv.email} against ${argv.authority} using the provided password`);
                } else {
                    console.error(err.message);
                }
            })
            .then((credentials) => {
                if (!credentials) return;

                if (argv.verbose) console.log(`copying ${argv.deck_id} from ${argv.source} to ${argv.target} as ${credentials.userName}`);

                // 0, 0 means we need a new deck
                return copyDeck(deckId, 0, 0, argv.source, argv.target, credentials.authToken, argv.verbose).then((newDeckId) => {
                    console.info(`finished copying deck ${deckId} from ${argv.source} to deck ${newDeckId} in ${argv.target}`);
                });
            })
            .catch((err) => {
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

function copyDeck(sourceId, targetId, rootDeckId, source, target, authToken, verbose=false) {

    return deckService.read(sourceId, source).then((deck) => {
        if (verbose) console.log(`fetched deck metadata for ${sourceId} from ${source}`);

        if (targetId && rootDeckId) {
            // deck exists, we update its metadata...
            return deckService.updateDeck(targetId, deck, rootDeckId, target, authToken).then(() => {
                if (verbose) console.log(`updated deck ${targetId} in ${target} with data from deck ${sourceId} from source`);

                // ... and add the children from the original deck :)
                return copyDeckChildren(deck, targetId, rootDeckId, source, target, authToken, verbose);
            });
        }

        return deckService.create(deck, target, authToken).then((newDeck) => deckService.read(newDeck.id, target)).then((newDeck) => {
            // the new deck we create is the root of the deck tree
            rootDeckId = newDeck._id;
            if (verbose) console.log(`created root deck ${rootDeckId} in ${target} with data from deck ${sourceId} from source`);

            // find the id of the (only) slide created as well
            let items = newDeck.revisions ? newDeck.revisions[0].contentItems : newDeck.contentItems;
            let slideId = `${items[0].ref.id}-${items[0].ref.revision}`;

            // this api creates a slide we don't want, let's remove it
            return deckService.removeNode(rootDeckId, { itemKind: 'slide', itemId: slideId, index: 0 }, rootDeckId, target, authToken)
                // and now we can add the stuff from the original deck :)
                .then(() => copyDeckChildren(deck, rootDeckId, rootDeckId, source, target, authToken, verbose));
        });

    }).then((subDeckIds) => {
        // we need to recursively continue copying the subdecks returned !!!
        return Array.from(subDeckIds.entries()).reduce((p, entry) => {
            let [sourceDeckId, targetDeckId] = entry;
            return p.then(() => copyDeck(sourceDeckId, targetDeckId, rootDeckId, source, target, authToken, verbose));
        }, Promise.resolve());

    }).then(() => rootDeckId);
    // finally return the rootDeckId (it should only be defined for the root function call)
}

// reads the nodes from the sourceDeck and creates them in the target deck id
function copyDeckChildren(sourceDeck, targetDeckId, rootDeckId, sourceURL, targetURL, authToken, verbose=false) {

    return sourceDeck.revisions[0].contentItems.reduce((p, cItem) => {
        return p.then((subDeckIds) => {
            let cItemId = `${cItem.ref.id}-${cItem.ref.revision}`;
            if (cItem.kind === 'slide') {
                return deckService.readSlide(cItemId, sourceURL).then((slide) => {
                    if (verbose) console.log(`fetched slide data for ${cItemId}`);

                    return deckService.appendNode(targetDeckId, 'slide', rootDeckId, targetURL, authToken).then((newSlide) => {
                        if (verbose) console.log(`created slide ${newSlide.id}`);

                        return deckService.updateSlide(targetDeckId, newSlide.id, slide, rootDeckId, targetURL, authToken, sourceURL, targetURL);
                    });

                }).then(() => subDeckIds); // always return the list so that it can be forwarded to the next iteration
            } else {
                return deckService.appendNode(targetDeckId, 'deck', rootDeckId, targetURL, authToken)
                    .then((res) => deckService.read(res.id, targetURL))
                    .then((subdeck) => {
                        let subdeckId = subdeck._id;

                        // find the id of the (only) slide created as well
                        let items = subdeck.revisions ? subdeck.revisions[0].contentItems : subdeck.contentItems;
                        let slideId = `${items[0].ref.id}-${items[0].ref.revision}`;

                        // again, this creates a deck with a slide that we need to remove
                        return deckService.removeNode(subdeckId, { itemKind: 'slide', itemId: slideId, index: 0 }, rootDeckId, targetURL, authToken)
                            // .then(() => console.log(`created subdeck ${subdeckId}`))
                            .then(() => subDeckIds.set(cItemId, subdeckId)); // we are gathering all direct subdecks created under the deck
                    });
            }
        });

    }, Promise.resolve(new Map()));

}
