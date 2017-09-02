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
            // 'comment',
            // 'abstract',
            // 'footer',
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

    appendNode: function(deckId, nodeType, userId, url) {
        return rp.post({
            uri: `${url}/decktree/node/create`,
            json: true,
            body: {
                selector: {
                    id: String(deckId),
                    spath: '',
                },
                nodeSpec: {
                    type: nodeType,
                },
                user: String(userId),
            },
        });
    },

    updateDeck: function(deckId, deck, userId, url) {
        let payload = {
            user: String(userId),
            // top_root_deck: 
        };

        deck = promoteRevision(deck);
        
        Object.assign(payload, _.pick(deck, [
            'title',
            'description',
            'language',
            'license',
            'theme',
        ]));

        // bad api
        if (!payload.description) payload.description = ' ';

        return rp.put({
            uri: `${url}/deck/${deckId}`,
            json: true,
            body: payload,
        });
    },

    updateSlide: function(deckId, slideId, slide, userId, url) {
        let payload = {
            user: String(userId),
            root_deck: String(deckId),
            // top_root_deck: 
        };

        // slide original object should always have a single revision (the one requested)
        slide = promoteRevision(slide);

        Object.assign(payload, _.pick(slide, [
            'title',
            'content',
            'speakernotes',
            'comment',
            'description',
            'language',
            'license',
            'dataSources',
        ]));

        // bad api
        if (payload.description === null) payload.description = '';

        return rp.put({
            uri: `${url}/slide/${slideId}`,
            json: true,
            body: payload,
        });
    },

};

// creates an object with base item and revision properties merged
// deck input has an array of revisions, if more than one revision
// is in the array, it takes the last element
function promoteRevision(item) {
    let [latestRevision] = item.revisions.slice(-1);

    return Object.assign({}, item, latestRevision);
}
