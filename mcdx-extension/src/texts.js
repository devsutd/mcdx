module.exports = class Texts {

    constructor(){
        this.startedDownload = "Starting download...";
        this.finishedDownload = "Download finished!";
        this.downloadCommandHelpError = 'To use this command right click con a manifest.json file and select "MCDX - Retrieve from Business Units"';
    }

    getDownloadingFilesFromMessage(folderName){
        return 'Downloading files from "' + folderName + '"';
    }

    getErrorSavingFileMessage(fileName, error){
        return 'error saving file ' + fileName + ": " + error;
    }
}