# slidewiki-cli

A set of command line tools to perform various tasks with slidewiki services Edit

## Installation

`$ npm install -g slidewiki-cli`


## Usage

```
slidewiki <command> [options]

Commands:
  cp <deck_id>    copy a deck tree to local file or to another slidewiki
                  deployment
  show <deck_id>  show the metadata of a deck

Options:
  --source       url of the deck service to copy from
  --target       url of the deck service to copy to
  --user_id      id of the user that will be the owner of the deck copy
  --help         Show help
  --verbose, -v
```
