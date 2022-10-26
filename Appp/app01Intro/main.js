const { app, BrowserWindow, ipcMain, shell, Menu, dialog} = require('electron');
const path = require('path');
const fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
const zlib = require('zlib');
const fse = require('fs-extra');
const {userSelectFolder} = require("./assets/js/dialogWindow");
const crosszip = require('cross-zip');
//let { zip, unzip } = require('cross-unzip');

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

/*     var options = copyDirSync.options = {
      overwrite: true,
      preserveFileDate: true,
      filter: function(filepath, type) {
        return true;
      }
    }; */
    //copyDirSync(src, dest, options);
    await fse.move(src, dest, {overwrite:true})
    win.webContents.send('update-installing', 'Successfully installed')
    win.webContents.send('update-progress', 100)

    console.log('Game copied successfully!')
    return true;
  } catch (err) {
    console.error('Cant write remove the old game:' + err)
  }
}

/**
 * 
 * @param {string} src 
 * @param {string} dest 
 * @param {options} options 
 */
 function copyDirSync(src, dest, options) {
  var srcPath = path.resolve(src);
  var destPath = path.resolve(dest);
  if(path.relative(srcPath, destPath).charAt(0) != ".")
    throw new Error("dest path must be out of src path");
  var settings = Object.assign(Object.create(copyDirSync.options), options);
  copyDirSync0(srcPath, destPath, settings);
  function copyDirSync0(srcPath, destPath, settings) {
    var files = fs.readdirSync(srcPath);
    if (!fs.existsSync(destPath)) {
      
      if(!path.extname(destPath) == '.asar'){
        fs.mkdirSync(destPath);
        console.log("Mkdir: Created: " + destPath);        
      }

    }else if(!fs.lstatSync(destPath).isDirectory()) {
      if(settings.overwrite)
        throw new Error(`Cannot overwrite non-directory '${destPath}' with directory '${srcPath}'.`);
      return;
    }
    files.forEach(function(filename) {
      var childSrcPath = path.join(srcPath, filename);
      var childDestPath = path.join(destPath, filename);
      var type = fs.lstatSync(childSrcPath).isDirectory() ? "directory" : "file";
      if(!settings.filter(childSrcPath, type))
        return;
      if (type == "directory") {
        //console.log("Path:name:" + childDestPath);
        if(path.extname(childDestPath) == '.game'){
          console.log("PathExtname:" + childDestPath);  
        }else{
          copyDirSync0(childSrcPath, childDestPath, settings);
          console.log("copy:directory:Created: " + destPath);
        }
        
      } else {
        console.log("CopyFiles: " + childDestPath);
        fs.copyFileSync(childSrcPath, childDestPath, settings.overwrite ? 0 : fs.constants.COPYFILE_EXCL);
        if(!settings.preserveFileDate)
          fs.futimesSync(childDestPath, Date.now(), Date.now());
      }
    });
  }
}

