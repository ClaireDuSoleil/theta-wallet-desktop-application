## Theta Wallet Desktop Application

This is a fork of the Theta Web Wallet (https://github.com/thetatoken/theta-wallet-web) that creates a desktop wallet application from the forked source code using Electron.  At this time, one additional feature has been added that allows for the creation of multiple receive addresses based on the mnemonic phrase.  The user can list the new addresses and, optionally, switch the wallet to one of these addresses to perform transactions.

## Disclaimer: Use At Your Own Risk!!!

This application was created to submit to the 2021 Theta Hackathon. It has _not_ been approved by Theta Labs. Many of the features, such as staking, have not been tested and may be removed in future versions. **Use at your own risk!!**


## Setup

    yarn install
    yarn upgrade

## Development

You need to have electron-packager installed globally to build packages for distributuion.

To build a windows install package (.msi):

    yarn electron:build-win

To build a Mac OS X install package (.dmg):

    yarn electron:build-mac

## Debugging

Logfiles are found on Windows in 

    C:\Users\YOUR_NAME\AppData\Local\Programs\theta-desktop-wallet
Logfiles are found on Mac OS X here:

    /Users/YOUR_NAME/Library/Logs/theta-desktop-wallet

To debug an installed production binary, run binary from the command line and add --remote-debugging-port=8315.  For example, on Windows:

    "C:\Users\claire\AppData\Local\Programs\theta-desktop-wallet\Theta Desktop Wallet.exe" --remote-debugging-port=8315

And then open a browser to: http://localhost:8315


## License

The Theta Web Wallet reference implementation is licensed under the [GNU License](./LICENSE).
