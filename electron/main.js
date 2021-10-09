const {app, BrowserWindow, Menu, shell, screen: electronScreen} = require('electron');
const is = require('electron-is');
const isDev = is.dev();
const path = require('path');
const {ipcMain} = require('electron');
const log = require('electron-log');
const isMac = process.platform === 'darwin' ? true : false;
const isDevServer = isDev && process.argv.indexOf('--noDevServer') === -1;

let mainWindow;
let startURL;
let aboutWindow;

//app.commandLine.appendSwitch('--enable-logging=file  --log-file=%APPDATA%');
if (isDev) process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

if (isDevServer) {
  startURL = 'http://localhost:3000';
} else {
  startURL = `file://${path.join(__dirname, '../build/index.html')}`;
}

log.info('hi from theta desktop wallet app');
log.info('1. startURL=', startURL);
log.info('2 __dirname=', __dirname);
log.info('3 isDev=', isDev, 'isDevServer=', isDevServer);
log.info('4 process args=', process.argv);

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 900,
    show: false,
    backgroundColor: 'black',
    resizable: true,
    minHeight: 800,
    minWidth: 800,
    title: 'Theta Wallet',
    icon: '../build/android-chrome-256x256.png',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '/preload.js'),
      devTools: isDev,
      backgroundThrottling: false,
    },
  });

  if (isMac) {
    app.dock.setIcon(path.join(__dirname, '/../build/android-chrome-256x256.png'));
  }
  if (isDev) mainWindow.maximize();
  mainWindow.loadURL(startURL);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open devtools if dev
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
  mainWindow.on('closed', () => {
    if (!isMac) app.quit();
    if (aboutWindow !== undefined && aboutWindow != null) aboutWindow.close();
  });
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
};

app.whenReady().then(() => {
  createMainWindow();
  //getting logging working from both main and renderer was an absolute nightmare
  //but this finally worked
  //https://www.electronjs.org/docs/api/web-contents#event-console-message
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    //log to both console and log file
    console.log(message + ' ' + sourceId + ' (' + line + ')');
    log.info(message + ' ' + sourceId + ' (' + line + ')');
  });
});

app.on('activate', () => {
  if (!BrowserWindow.getAllWindows().length) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

const createAboutWindow = () => {
  aboutWindow = new BrowserWindow({
    title: 'About Theta Wallet',
    width: 350,
    height: 250,
    modal: true,
    frame: false,
    parent: mainWindow,
    icon: `${__dirname}/../android-chrome-256x256.png`,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '/preload.js'),
    },
  });
  mainWindow.webContents.send('fromMain', 'dim-window');
  aboutWindow.on('closed', () => (aboutWindow = null));
  aboutWindow.loadFile('./electron/about.html');
};

ipcMain.on('toMain', (evt, arg) => {
  console.log('received close me from about box');
  if (arg === 'close-me') mainWindow.webContents.send('fromMain', 'undim-window');
  if (aboutWindow !== null) aboutWindow.close();
});

const openThetaWebSite = () => {
  shell.openExternal('https://www.thetatoken.org/');
};

const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            // {
            //   label: 'Preferences',
            //   click: createPreferencesWindow,
            // },
            {
              label: 'Quit Theta Wallet',
              click() {
                app.quit();
              },
              accelerator: 'Command+Q',
            },
          ],
        },
      ]
    : []),
  ...(!isMac
    ? [
        {
          label: 'File',
          submenu: [
            // {
            //   label: 'Preferences',
            //   click: createPreferencesWindow,
            // },
            {
              label: 'Quit Theta Wallet',
              click() {
                app.quit();
              },
              accelerator: 'Ctrl+Q',
            },
          ],
        },
      ]
    : []),
  ...(isMac ? [] : []),
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:',
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:',
      },
      {
        type: 'separator',
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:',
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
      },
    ],
  },
  {
    label: 'View',
    submenu: [{role: 'zoomin', accelerator: 'CommandOrControl+='}, {role: 'zoomout'}],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click: createAboutWindow,
      },
      {
        label: 'Official Theta Website',
        click: openThetaWebSite,
      },
    ],
  },

  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            {role: 'reload'},
            {role: 'forcereload'},
            {type: 'separator'},
            {role: 'toggledevtools'},
          ],
        },
      ]
    : []),
];
