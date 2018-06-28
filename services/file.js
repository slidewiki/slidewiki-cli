'use strict';

const rp = require('request-promise-native');
const download = require('download');
const fs = require('fs');

const self = module.exports = {

    async create(imageURL, fileServiceURLFrom, fileServiceURLTo, authToken) {/*URLs are URL objects*/
        let fileName = imageURL.href.split('/');
        fileName = fileName[fileName.length - 1];
        let metaData;
        try {
            metaData = await rp.get({//metadata
                uri: `${fileServiceURLFrom.href}metadata/${fileName}`,
                json: true,
            });
        } catch (e) {
            switch(e.statusCode){
            case 404:
                metaData = {license: 'CC0', type: 'image/jpeg'};
                break;
            default:
                throw e;
            }
        }
        try{
            await download(`${fileServiceURLFrom.href}picture/${fileName}`, './');//file
        } catch(e) {
            switch (e.statusCode) {
            case 404:
                console.log('Failed to fetch image', fileName, 'due to 404 - ', e.url);
                console.log('Removing image from slide...');
                return '';
            default:
                fs.unlinkSync(`./${fileName}`);
                throw e;
            }
        }
        try{
            let queryParams = '';
            if(metaData.license.includes('CC BY')) {
                if(metaData.copyRightHolder){
                    if(metaData.copyRightHolder.name)
                        queryParams += `&copyrightHolder=${metaData.copyRightHolder.name}`;
                    if(metaData.copyRightHolder.url)
                        queryParams += `&copyrightHolderURL=${metaData.copyRightHolder.url}`;
                }
                if(metaData.copyrightAdditions)
                    queryParams += `&copyrightAdditions=${metaData.copyrightAdditions}`;
                if(metaData.title)
                    queryParams += `&title=${metaData.title}`;
                if(metaData.altText)
                    queryParams += `&altText=${metaData.altText}`;
            }

            let options = {
                method: 'POST',
                uri: `${fileServiceURLTo.href}v2/picture?license=${metaData.license}${queryParams}`,
                body:  fs.createReadStream(`./${fileName}`),
                headers: {
                    '----jwt----': authToken,
                    'content-type': metaData.type,
                    'Accept':  'application/json'
                }
            };

            let newMeta = await rp(options);
            newMeta = JSON.parse(newMeta);

            return newMeta.fileName;
        } catch (e) {
            switch (e.statusCode) {
            case 409:
                return JSON.parse(e.response.body).message.split('under ')[1];
            default:
                throw e;
            }
        } finally {
            try {
                fs.unlinkSync(`./${fileName}`);
            } catch (e) {
                console.log();
            }
        }
    }

};
