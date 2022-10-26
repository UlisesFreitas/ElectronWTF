/**
 * Open the folder selector dialog.
 * @returns 
 */
async function openDialogBox(){
    const result = await api.selectFolderPopup();
    console.log(result);
    if (result.canceled) return;
    const filePathInput = document.getElementById("select-path");
    if (result.filePaths.length = 1) {
        filePathInput.value = result.filePaths[0];
    }
}

const form = document.querySelector('#app-install');
const selectedPath = document.querySelector('#select-path');
/**
 * 
 * @param {event} e 
 * @returns 
 */
function appInstall(e) {
    e.preventDefault();
  
    if (selectedPath.length <= 0) {
      alert('Please select a path');
      return;
    }
    // Electron adds a bunch of extra properties to the file object including the path
     const pathToInstall = selectedPath.value;
   
    ipcRenderer.send('app-install', {
      pathToInstall,
    });
}
form.addEventListener('submit', appInstall);

/**
 * Handle the progress text 
 * Installing... or Successfully installed.
 */
const installing = document.querySelector('#installing')
const progress = document.querySelector('#progress')
window.installingText.handleInstalling((event, value) => {
  installing.innerText = value
  event.sender.send('installing-value', value)
})
/**
 * Handle the progress bar
 */
window.progressValue.handleProgress((event, value) => {

  if(value == 100)
  {
    selectedPath.className = "d-none";
    selectedPath.setAttribute("style","display:none;");
    form.className = "d-none";
    form.setAttribute("style","display:none;");
    play.className = "btn btn-lg btn-success d-block text-white";
    progress.parentElement.className = "progress d-none";
  }
  progress.ariaValueNow = String(value);
  progress.className = 'progress-bar d-block w-' + String(value)
  progress.parentElement.className = "progress d-block h-3";
  progress.parentElement.setAttribute("style","height:3px;")
  progress.setAttribute('style','width:'+value+'%;height:5px;')
  event.sender.send('progress-value', value)
})

/**
 * Play Button after install
 */
document.addEventListener('DOMContentLoaded', function() {
  let playBtn = document.querySelector('#play');
  playBtn.addEventListener('click', () => {
      ipcRenderer.send('play-app');
  })
});


