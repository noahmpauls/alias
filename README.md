# Alias

Alias is a browser extension to add a simple shortcut mechanism to the omnibox.

The extension allows you to type `! <alias>` in the omnibox as a quick way to navigate to your favorite sites.

## Development

You will need NPM and Node installed to develop. Currently, the development experience is optimized for the Firefox browser, but you can also develop on any Chromium-based browser.

To set up the development environment:

1. Clone this repository.
2. `cd alias` and `npm install`.

From there, you can use the provided scripts to run, build, and package the extension. Where applicable, replace `<target>` with either `firefox` or `chromium` depending on the desired platform.

- Use `npm run build:<target>` to perform a build of the extension.
- Use `npm run start:<target>` to concurrently run and develop the extension.
    - `<target>` = `firefox`: You must have Firefox installed.
- Use `npm run package:<target>` to build and package the extension for distribution.
    - `<target>` = `all`: Creates packages for all targets.
