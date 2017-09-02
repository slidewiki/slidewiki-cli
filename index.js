#!/usr/bin/env node
'use strict';

require('yargs')
    .usage('Usage: $0 <command> [options]')
    .help()
    .command('cp <deck_id>', 'copy a deck tree to local file or to another slidewiki deployment', (yargs) => {
        yargs.option('source', {
            describe: 'url of the deck service to copy from'
        }).option('target', {
            describe: 'url of the deck service to copy to'
        }).option('user_id', {
            describe: 'id of the user that will be the owner of the deck copy'
        }).demandOption(['source', 'target', 'user_id']);
    }, (argv) => {
        require('./commands/cp').execute(argv);
    })
    .command('show <deck_id>', 'show the metadata of a deck', (yargs) => {
        yargs.option('source', {
            describe: 'url of the deck service from which to fetch the deck'
        }).demandOption('source');
    }, (argv) => {
        require('./commands/show').execute(argv);
    })
    .option('verbose', {
        alias: 'v',
        default: false,
    }).argv;
