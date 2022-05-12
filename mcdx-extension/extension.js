// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const Program = require('./src/program.js')
const DisplayHelper = require('./src/displayHelper.js')
const Texts = require('./src/texts.js')
const texts = new Texts()

let program = new Program();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mcdx-extension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	let disposableDownloadAllFolders = vscode.commands.registerCommand('mcdx-extension.DownloadAllFolders',  async (e) => {
		if(!e){
			DisplayHelper.showErrorMessage(texts.downloadCommandHelpError);
			return;
		}
		DisplayHelper.showMessage(texts.startedDownload);
		await program.downloadAllFolders();
		DisplayHelper.showMessage(texts.finishedDownload);
	});

	let disposableDownloadAsset = vscode.commands.registerCommand('mcdx-extension.DownloadAsset',  async (e) => {
		await program.downloadAsset(e);
	});

	let disposablePushAsset = vscode.commands.registerCommand('mcdx-extension.PushAsset',  async (e) => {
		await program.pushAsset(e);
	});

	let disposableConnect = vscode.commands.registerCommand('mcdx-extension.Connect',  async () => {
		let status = await program.connect();
		vscode.commands.executeCommand('setContext', 'ActivationContext', status.connected);
		vscode.commands.executeCommand('setContext', 'ManifestConnectionString', status.hasConnectionString);
	});

	let disposableCreateTableOnSQL = vscode.commands.registerCommand('mcdx-extension.CreateTableOnSQL',  async (e) => {
		await program.createTableOnSQL(e);
	});

	let disposableDownloadDEData = vscode.commands.registerCommand('mcdx-extension.DownloadDEData',  async (e) => {
		await program.downloadDEData(e);
	});

	let disposableNewQueryActivity = vscode.commands.registerCommand('mcdx-extension.NewQueryActivity',  async (e) => {
		await program.newQueryActivity(e);
	});

	let disposablePushQueryActivity = vscode.commands.registerCommand('mcdx-extension.PushQueryActivity',  async (e) => {
		await program.pushQueryActivity(e);
	});

	let disposableDownloadDataViews = vscode.commands.registerCommand('mcdx-extension.DownloadDataViews',  async (e) => {
		await program.downloadDataViews(e);
	});

	context.subscriptions.push(disposableDownloadAllFolders);
	context.subscriptions.push(disposableDownloadAsset);
	context.subscriptions.push(disposablePushAsset);
	context.subscriptions.push(disposableConnect);
	context.subscriptions.push(disposableCreateTableOnSQL);
	context.subscriptions.push(disposableDownloadDEData);
	context.subscriptions.push(disposableNewQueryActivity);
	context.subscriptions.push(disposablePushQueryActivity);
	context.subscriptions.push(disposableDownloadDataViews);
}

//exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

