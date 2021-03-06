'use strict';

const _ = require('lodash');
const rp = require('request-promise-native');
const fileservice = require('./file.js');
const cheerio = require('cheerio');
const URL = require('url');

const self = module.exports = {

    read: function(deckId, url) {
        return rp.get({
            uri: `${url}/deck/${deckId}`,
            json: true,
        }).then((deck) => {
            if (deck.revisions.length > 1) {
                deck.revisions = deck.revisions.slice(-1);
            }
            return deck;
        });
    },

    create: function(deck, url, authToken) {
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

        // never create the default slide
        Object.assign(payload, { empty: true });

        return rp.post({
            uri: `${url}/deck/new`,
            json: true,
            body: payload,
            headers: { '----jwt----': authToken },
        });
    },

    readSlide: function(slideId, url) {
        return rp.get({
            uri: `${url}/slide/${slideId}`,
            json: true,
        });
    },

    removeNode: function(deckId, {itemId, itemKind, index}, rootDeckId, url, authToken) {
        let selector = {
            id: String(rootDeckId),
            // HACK mock this weird API parameter!
            spath: `${deckId}:;:${index + 1}`,
        };

        if (itemKind && itemId) {
            selector.stype = itemKind;
            selector.sid = itemId;
        }

        return rp.delete({
            uri: `${url}/decktree/node/delete`,
            json: true,
            body: {
                selector: selector,
            },
            headers: { '----jwt----': authToken },
        });
    },

    appendNode: async function(deckId, nodeType, payload, rootDeckId, url, authToken, fileSourceURL, fileTargetURL) {
        let selector = {
            id: String(rootDeckId),
            spath: '',
        };

        if (rootDeckId !== deckId) {
            selector.stype = 'deck';
            selector.sid = String(deckId);
        }

        // deck/slide original object should always have a single revision (the one requested)
        if (payload) {
            payload = promoteRevision(payload);
        }

        if (nodeType === 'deck') {
            // don't make a slide inside, not needed!
            payload = Object.assign(payload || {}, { empty: true });
        } else if (payload) {
            let newImageNames = await createImages(payload.content, fileSourceURL, fileTargetURL, authToken);
            payload.content = exchangeImageURLs(payload.content, newImageNames);
        }

        return rp.post({
            uri: `${url}/decktree/node/create`,
            json: true,
            body: {
                selector: selector,
                nodeSpec: {
                    type: nodeType,
                    [nodeType]: payload,
                },
            },
            headers: { '----jwt----': authToken },
        });
    },

    updateDeck: function(deckId, deck, rootDeckId, url, authToken) {
        let payload = {
            top_root_deck: String(rootDeckId),
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
            headers: { '----jwt----': authToken },
        });
    },

    updateSlide: async function(deckId, slideId, slide, rootDeckId, url, authToken, fileSourceURL, fileTargetURL) {
        let payload = {
            root_deck: String(deckId),
            top_root_deck: String(rootDeckId),
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
        let newImageNames = await createImages(payload.content, fileSourceURL, fileTargetURL, authToken);
        payload.content = exchangeImageURLs(payload.content, newImageNames);

        // bad api
        if (payload.description === null) payload.description = '';
        if (!payload.speakernotes) delete payload.speakernotes;

        if (payload.dataSources) {
            _.each(payload.dataSources, (ds) => { delete ds._id; });
        } else {
            delete payload.dataSources;
        }

        return rp.put({
            uri: `${url}/slide/${slideId}`,
            json: true,
            body: payload,
            headers: { '----jwt----': authToken },
        });
    },

};

async function createImages(content, sourceURL, targetURL, authtoken){
    if(content.includes('src="' + sourceURL.replace('http://', 'https://')) || content.includes('src="' + sourceURL.replace('https://', 'http://'))){//only execute if images are in the slide
        let $ = cheerio.load(content);
        let urls = $(content).find('img').map(async (i, image) => {//process each image in the slide
            let src = URL.parse($(image).attr('src'));
            if(src.href.startsWith(sourceURL.replace('http://', 'https://')) || src.href.startsWith(sourceURL.replace('https://', 'http://'))) {//only process images from the fileservice
                let newSrc = await fileservice.create(src, URL.parse(sourceURL), URL.parse(targetURL), authtoken);
                return (newSrc !== null) ? [src.href, targetURL + '/picture/' + newSrc] : null;
            }
        });
        return await Promise.all(urls.toArray());
    }
}

function exchangeImageURLs(content, newImageNames){
    if(newImageNames){//only execute if there are imageNames
        newImageNames.forEach((names) => {
            if (!names) return;

            let $ = cheerio.load(content);
            if(names[1] !== null){//only execute if there is a new name
                $(`img[src="${names[0]}"]`).attr('src',names[1]);
                content = $.html();
            }
        });
    }

    return content.replace('</body></html>','').replace('<html><head></head><body>','');
}

// creates an object with base item and revision properties merged
// deck input has an array of revisions, if more than one revision
// is in the array, it takes the last element
function promoteRevision(item) {
    let [latestRevision] = item.revisions.slice(-1);

    return Object.assign({}, item, latestRevision);
}
