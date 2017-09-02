'use strict';

const deckService = require('../services/deck');

const self = module.exports = {

    execute: function(argv) {
        if (argv.verbose) console.log(`copying ${argv.deck_id} from ${argv.source} to ${argv.target}`);

        let deckId = argv.deck_id;
        let userId = argv.user_id;

        // 0, 0 means we need a new deck
        copyDeck(deckId, 0, 0, userId, argv.source, argv.target, argv.verbose).then((newDeckId) => {
            console.info(`finished copying deck ${deckId} from ${argv.source} to deck ${newDeckId} in ${argv.target}`);
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

function copyDeck(sourceId, targetId, rootDeckId, userId, source, target, verbose=false) {

    return deckService.read(sourceId, source).then((deck) => {
        if (verbose) console.log(`fetched deck metadata for ${sourceId} from ${source}`);

        if (targetId && rootDeckId) {
            // deck exists, we update its metadata...
            return deckService.updateDeck(targetId, deck, rootDeckId, userId, target).then(() => {
                if (verbose) console.log(`updated deck ${targetId} in ${target} with data from deck ${sourceId} from source`);

                // ... and add the children from the original deck :)
                return copyDeckChildren(deck, targetId, rootDeckId, userId, source, target, verbose);
            });
        }

        return deckService.create(deck, userId, target).then((newDeck) => {
            // the new deck we create is the root of the deck tree
            rootDeckId = newDeck.id;
            if (verbose) console.log(`created root deck ${rootDeckId} in ${target} with data from deck ${sourceId} from source`);

            // this api creates a slide we don't want, let's remove it
            return deckService.removeNode(rootDeckId, 0, rootDeckId, userId, target)
                // and now we can add the stuff from the original deck :)
                .then(() => copyDeckChildren(deck, rootDeckId, rootDeckId, userId, source, target, verbose));
        });

    }).then((subDeckIds) => {
        // we need to recursively continue copying the subdecks returned !!!
        return Array.from(subDeckIds.entries()).reduce((p, entry) => {
            let [sourceDeckId, targetDeckId] = entry;
            return p.then(() => copyDeck(sourceDeckId, targetDeckId, rootDeckId, userId, source, target, verbose));
        }, Promise.resolve());

    }).then(() => rootDeckId);
    // finally return the rootDeckId (it should only be defined for the root function call)
}

// reads the nodes from the sourceDeck and creates them in the target deck id
function copyDeckChildren(sourceDeck, targetDeckId, rootDeckId, targetUserId, sourceURL, targetURL, verbose=false) {

    return sourceDeck.revisions[0].contentItems.reduce((p, cItem) => {
        return p.then((subDeckIds) => {
            let cItemId = `${cItem.ref.id}-${cItem.ref.revision}`;
            if (cItem.kind === 'slide') {
                return deckService.readSlide(cItemId, sourceURL).then((slide) => {
                    if (verbose) console.log(`fetched slide data for ${cItemId}`);

                    return deckService.appendNode(targetDeckId, 'slide', rootDeckId, targetUserId, targetURL).then((newSlide) => {
                        if (verbose) console.log(`created slide ${newSlide.id}`);

                        return deckService.updateSlide(targetDeckId, newSlide.id, slide, rootDeckId, targetUserId, targetURL);
                    });

                }).then(() => subDeckIds); // always return the list so that it can be forwarded to the next iteration
            } else {
                return deckService.appendNode(targetDeckId, 'deck', rootDeckId, targetUserId, targetURL)
                    .then((res) => {
                        // again, this creates a deck with a slide that we need to remove
                        return deckService.removeNode(res.id, 0, rootDeckId, targetUserId, targetURL)
                            // .then(() => console.log(`created subdeck ${res.id}`))
                            .then(() => subDeckIds.set(cItemId, res.id)); // we are gathering all direct subdecks created under the deck
                    });
            }
        });

    }, Promise.resolve(new Map()));

}
