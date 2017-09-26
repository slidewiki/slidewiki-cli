#!/usr/bin/env node
'use strict';

require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('cp <deck_id>', 'copy a deck tree to local file or to another slidewiki deployment', (yargs) => {
        yargs.option('source', {
            describe: 'url of the deck service to copy from'
        }).option('target', {
            describe: 'url of the deck service to copy to'
        }).option('authority', {
            describe: 'url of the user service the target deck service authenticates against'
        }).option('email', {
            describe: 'email of the registered account that will own the deck copy'
        }).option('password', {
            describe: 'password for account authentication'
        }).demandOption(['source', 'target', 'authority', 'email']);
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
    })
    .demandCommand()
    .help()
    .argv;
