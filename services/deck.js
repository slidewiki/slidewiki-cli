'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');

const self = module.exports = {

    read: function(deckId, url) {
        return rp.get({
            uri: `${url}/deck/${deckId}`,
            json: true,
        });
    },

    create: function(deck, userId, url) {
        let payload = promoteRevision(deck);
        payload = _.pick(payload, [
            'title',
            'description',
            'language',
            'license',
            'theme',
            'comment',
            'abstract',
            'footer',
        ]);

        if (!payload.description) payload.description = ' ';

        // TODO change this after proper authentication is merged
        payload.user = String(userId);

        // return Promise.resolve(payload);

        return rp.post({
            uri: `${url}/deck/new`,
            json: true,
            body: payload,
        });
    },

    readSlide: function(slideId, url) {
        return rp.get({
            uri: `${url}/slide/${slideId}`,
            json: true,
        });
    },

    removeNode: function(deckId, index, userId, url) {
        return rp.delete({
            uri: `${url}/decktree/node/delete`,
            json: true,
            body: {
                selector: {
                    id: String(deckId),
                    spath: `:${index + 1}`,
                },
                user: String(userId),
            },
        });
    },

    appendDeck: function(deckId, userId, url) {
        let payload = {
            selector: {
                id: String(deckId),
                spath: '',
            },
            nodeSpec: {
                type: 'deck',
            },
            user: String(userId),
        };

        return rp.post({
            uri: `${url}/decktree/node/create`,
            json: true,
            body: payload,
        });
    },

    appendSlide: function(deckId, slide, userId, url) {
        let payload = {
            selector: {
                id: String(deckId),
                spath: '',
            },
            nodeSpec: {
                type: 'slide',
            },
            user: String(userId),
        };

        slide = promoteRevision(slide);

        Object.assign(payload, _.pick(promoteRevision(slide), [
            'title',
            'content',
            'speakernotes',
            'license',
        ]));

        // 'language',
        // 'comment',
        // 'description',

        return rp.post({
            uri: `${url}/decktree/node/create`,
            json: true,
            body: payload,
        });
    },

};

// creates an object with deck and revision properties merged
// deck input has an array of revisions, if more than one revision
// is in the array, it takes the last element
function promoteRevision(deck) {
    let [latestRevision] = deck.revisions.slice(-1);

    return Object.assign({}, deck, latestRevision);
}
