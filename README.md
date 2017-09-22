# slidewiki-cli

A set of command line tools to perform various tasks with slidewiki services Edit

## Installation

`$ npm install -g slidewiki-cli`

**NOTE** since the package is not uploaded to npmjs this won't work, clone it locally instead,
and from inside the working copy directory do

```
$ npm pack
$ npm install -g slidewiki-cli-0.0.1.tgz
```

To remove it, just 
`$ npm uninstall -g slidewiki-cli`

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
  --email        email of the registered account that will own the deck copy
  --password     password for account authentication
  --help         Show help
  --verbose, -v
```
