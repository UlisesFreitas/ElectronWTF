const { app, BrowserWindow, ipcMain, shell, Menu, dialog} = require('electron');
const path = require('path');
const fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
const zlib = require('zlib');
const fse = require('fs-extra');
const {userSelectFolder} = require("./assets/js/dialogWindow");
const crosszip = require('cross-zip');

let GameName = 'Installer Example Game';
let progress;
let destination;
let win;

const createWindow = () => {
   win = new BrowserWindow({
    titleBarStyle: 'hidden',
    frame: false,
    width: 800,
    height: 600,
    useContentSize: true,
    title: GameName,
    backgroundColor: '#232323',
    webPreferences: {
      preload: path.join(__dirname, './assets/js/preload.js'),
      //nodeIntegration: true,
      //contextIsolation: false,
    },
    resizable: false,
  })

  win.loadFile('./assets/index.html');
};

//Menu.setApplicationMenu(null);

app.whenReady().then(() => {

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle("select-folder-popup", async (handler, args) => {
  const popupResults = await userSelectFolder();
  //console.log(typeof(popupResults.filePaths));
  return popupResults;
});

ipcMain.on("app-close", (event) => {
  if (process.platform !== 'darwin') {
      app.quit();
  }
});

const { execFile, exec } = require('child_process');

const { AsyncResource } = require('async_hooks');

ipcMain.on("play-app", (event) => {

    console.log("Destination: " + destination);
    var playPath = path.parse(destination);
    playPath = path.format(playPath);
    shell.openPath(playPath);

    /**
     * This runs the game 
     * but within the 
     * installer itself
     */

    /*
    var gameExe = GameName +'.exe';
    var playGame = path.join(destination,gameExe);
    process.chdir(destination);
    execFile(playGame, [], (error, stdout, stderr) => {
      if (error) { throw error; }
      if (stderr) { throw stderr; }
      if (stdout) { console.log("App initiated"); }
    });
    if (process.platform !== 'darwin') {
      app.quit();
    } 
    */
});

// Respond to the app install event
ipcMain.on('app-install', (e, options) => {
  if(options.pathToInstall.length > 0){
    //destination = options;
    if (fse.existsSync('./assets/game.zip')) {
      console.log('Directory exists!')
      win.webContents.send('update-installing', 'installing...')
      win.webContents.send('update-progress', 30)
      installApp(options);
    }
  }
});

async function installApp({pathToInstall}) {
  console.log("installApp:" + pathToInstall);                     
  try {
     
    let source = path.resolve('./assets/game');
    destination = path.resolve(path.join(pathToInstall,GameName)); 

    progress=30;
    win.webContents.send('update-installing', 'installing....')
    win.webContents.send('update-progress', progress)

    if (fse.existsSync('./assets/game')) {
        /**
         * Remove the old directory 
         * from the user installation folder.
         */
        fse.emptyDir(path.join(destination, GameName), err => {
          if (err) return console.error("Cant delete" + err)
          console.log('deleted!')
        })
        
        progress=60;
        win.webContents.send('update-installing', 'installing....')
        win.webContents.send('update-progress', progress)
        /**
         * Since game folder exists just move the 
         * folder to the user selected folder.
         */
        MoveToUserFolder('./assets/game', destination)
        progress=75;
        win.webContents.send('update-installing', 'installing....')
        win.webContents.send('update-progress', progress)    
    
      }else{
        /**
         * Get game.zip and unzip it then move
         * game to the user selected folder.
         */
       crosszip.unzip('./assets/game.zip', './assets', err => {
        progress=50;
        win.webContents.send('update-installing', 'installing....')
        win.webContents.send('update-progress', progress)
        if(!err || err === null){
          console.log("Game extracted all good.")
          MoveToUserFolder('./assets/game', destination)
        }

      });
    }
  } catch (err) {
    console.error(err)
  } 
}

async function MoveToUserFolder (src, dest) {
  try {

    await fse.move(src, dest, {overwrite:true})
    win.webContents.send('update-installing', 'Successfully installed')
    win.webContents.send('update-progress', 100)

    &&console.log('Game copied successfully!')
    return true;
  } catch (err) {
    win.webContents.send('update-installing', 'Please remove the old version of the game.')
    console.error('Cant write remove the old game:' + err)
  }
}

