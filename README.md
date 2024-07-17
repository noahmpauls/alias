# Alias

Alias is a browser extension to add a simple shortcut mechanism to the omnibox.

The extension allows you to type `! <alias>` in the omnibox as a quick way to navigate to your favorite sites.

## Development

You will need NPM and Node installed to develop. Currently, the development experience is optimized for the Firefox browser.

To set up the development environment:

1. Clone this repository.
2. `cd alias` and `npm install`.

From there:

- Use `npm run build` to perform a build of the extension.
- Use `npm run dev` to concurrently run and develop the extension. _You must have Firefox installed for this to work._
- Use `npm run package` to build and package the extension for distribution.
