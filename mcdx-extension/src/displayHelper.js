const vscode = require('vscode');
const EventEmitter = require('events');

var listeners = [];

module.exports = class DisplayHelper {

    constructor() {
    }

    static showStatusBarMessage(msg) {
        const hideAfterMilliseconds = 2000;
        vscode.window.setStatusBarMessage(msg, hideAfterMilliseconds);
    }

    static showMessage(msg) {
        vscode.window.showInformationMessage(msg);
    }

    static showErrorMessage(msg) {
        vscode.window.showErrorMessage(msg);
    }

    //Gets a new ID for the progress bar
    static manageProgressMessage() {
        // @ts-ignore
        var listener = new EventEmitter();
        var id = listeners.length;
        var l = { listener: listener, id: id }
        listeners.push(l);
        return id;
    }

    //Shows a progress bar with a listener for that ID
    static showProgressMessage(title, id) {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: title,
        }, async (progress) => {
            var listener = listeners[id].listener;
            listener.on('update', (p, msg) => {
                progress.report({ increment: p, message: msg });
            });
            await new Promise((resolve, reject) => {
                listener.on('finish', (msg) => {
                    progress.report({ increment: 0, message: msg });
                    setTimeout(() => { resolve() }, 2000);
                });
            });

        });
    }

    //Updates progress and message
    static updateProgressMessage(id, msg, newProgress) {
        var listener = listeners[id].listener;
        listener.emit('update', newProgress, msg);
    }

    //Displays final message and closes down
    static finishProgressMessage(id, msg) {
        var listener = listeners[id].listener;
        listener.emit('finish', msg);
    }
}