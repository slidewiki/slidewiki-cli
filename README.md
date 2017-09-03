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
  --user_id      id of the user that will be the owner of the deck copy
  --help         Show help
  --verbose, -v
```

## Running the tool from Docker image

The tool is also available via the Docker image `slidewiki/cli`. You can use it
either in interactive mode by starting a shell in the container or you can issue
a command from the command line like this:

```
docker run -it --rm slidewiki/cli slidewiki --help
```
