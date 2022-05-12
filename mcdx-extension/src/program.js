const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const ManifestManager = require('./manifestManager')
const FileHelper = require('./fileHelper')
const DisplayHelper = require('./displayHelper')
const Texts = require('./texts')
const sql = require('./sqlUtils');
var parseString = require('xml2js').parseString;
let texts = new Texts();
const DateUtils = require('./dateUtils');
const DataExtensionApiManager = require('./dataextension/dataExtensionApiManager');
const ContentBuilderApiManager = require('./contentbuilder/contentBuilderApiManager');
const QueryApiManager = require('./queries/queryApiManager');
const dateUtils = new DateUtils()
const SQLParser = require('./SQLParser/parser');


let manifest = {};

module.exports = class Program {


    constructor() {
    }

    async connect() {

        manifest = await ManifestManager.getManifestJson();
        let hasConnectionString = false;
        for (let index = 0; index < manifest["business-units"].length; index++) {
            let buManifest = manifest["business-units"][index];
            DisplayHelper.showMessage("Connecting to BU " + buManifest["bu-name"] + "...");
            buManifest.DataExtensionApiManager = new DataExtensionApiManager(buManifest, manifest["tenant"], vscode.workspace.workspaceFolders[0].uri.fsPath);
            buManifest.ContentBuilderApiManager = new ContentBuilderApiManager(buManifest, manifest["tenant"], vscode.workspace.workspaceFolders[0].uri.fsPath);
            buManifest.QueryApiManager = new QueryApiManager(buManifest, manifest["tenant"], vscode.workspace.workspaceFolders[0].uri.fsPath);
            await buManifest.DataExtensionApiManager.Login();
            await buManifest.ContentBuilderApiManager.Login();
            await buManifest.QueryApiManager.Login();
            if (buManifest["connection-string"]) hasConnectionString = true;
            DisplayHelper.showMessage("Connected!");
        }
        return { connected: 'success', hasConnectionString: hasConnectionString };
    }

    async downloadAllFolders() {

        const workspaceFolderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

        //foreach Business Unit:
        //- create BU folder
        //- create subfolders (only the ones that appear in the manifest json file)
        //- download html files
        //- download metadata

        for (let index = 0; index < manifest["business-units"].length; index++) {
            let buManifest = manifest["business-units"][index];
            try {
                await this.MakeBUManifest(buManifest, workspaceFolderPath);

                DisplayHelper.showMessage("Downloading Content Buider...");

                await this.DownloadAllContentBuilder(buManifest, workspaceFolderPath);

                DisplayHelper.showMessage("Downloading Data Extensions...");

                await this.DownloadAllDataExtensions(buManifest, workspaceFolderPath);

                DisplayHelper.showMessage("Downloading Query Activities...");

                await this.DownloadAllQueries(buManifest, workspaceFolderPath);
            } catch (error) {
                DisplayHelper.showErrorMessage("error in BU id=" + buManifest["bu-id"] + ": " + error);
            }
        }
    }

    async MakeBUManifest(buManifest, workspaceFolderPath) {
        //create Business Unit folder
        let buFolderPath = FileHelper.createFolder(buManifest["bu-name"], workspaceFolderPath);
        FileHelper.saveAssetLocally_json(buFolderPath, { bu_id: buManifest["bu-id"] }, (e) => { console.error(e) }, '__mcdx__.json');
        return 0;
    }

    async DownloadAllDataExtensions(buManifest, workspaceFolderPath) {
        console.log(dateUtils.getTime() + " - Downloading data extension objects...");

        //id of folders in manifest.json file that I have to download content from salesforce 
        const contentBuilderFolderIds = buManifest["data-extension-folders"];
        if (!contentBuilderFolderIds || contentBuilderFolderIds.length == 0) {
            console.log(dateUtils.getTime() + " - No folders specified.");
            return;
        }

        let allFolders = await buManifest.DataExtensionApiManager.GetAllFolders('dataextension', error => DisplayHelper.showErrorMessage('error: ' + error));
        console.log(dateUtils.getTime() + " - Found " + allFolders.length + " Data Extension folders in the BU.");

        //create Business Unit folder
        let buFolderPath = FileHelper.createFolder(buManifest["bu-name"], workspaceFolderPath);

        let dataExtensionTree = {
            buFolderPath: buFolderPath,
            paths: []
        }

        //Create Email Studio folder
        buFolderPath = FileHelper.createFolder("Email Studio", buFolderPath);

        //Data Extensions folder has parentId = 0

        if (allFolders.filter(c => c.parentId == 0).length == 0) {
            console.log("Data Extensions root folder not found!");
            return;
        }

        let contentBuilderRootFolder = allFolders.filter(c => c.parentId == 0)[0];
        dataExtensionTree.root = contentBuilderRootFolder.id
        //dataExtensionTree.paths.push({ id: contentBuilderRootFolder.id, path: buFolderPath });

        //from all the categories of the BU, just get the the ones matching the folder id in manifest json
        let foldersToSync = allFolders.filter(c => contentBuilderFolderIds.filter(f => f == c.id).length > 0);

        console.log("Found " + foldersToSync.length + " content builder folders to sync.");

        //current folder is now Data Extensions folder
        buFolderPath = FileHelper.createFolder(contentBuilderRootFolder.name, buFolderPath);

        for (let i = 0; i < foldersToSync.length; i++) {
            let folderToSync = foldersToSync[i];
            const manifestFolderJson = contentBuilderFolderIds.filter(f => f == folderToSync.id || f == 0);
            const parentFolders = FileHelper.getParentFolders(allFolders, folderToSync);

            //creating parent folders so we have a full tree
            const parentFolderPath = FileHelper.createParentFolders(parentFolders, buFolderPath, dataExtensionTree);

            //creating children folders recursively
            this.downloadDEFoldersRecursively(buManifest, allFolders, folderToSync, parentFolderPath, dataExtensionTree);
        }

        FileHelper.saveAssetLocally_json(buFolderPath, dataExtensionTree, (e) => console.error(e), 'folders.json');

    }

    async DownloadAllQueries(buManifest, workspaceFolderPath) {
        console.log(dateUtils.getTime() + " - Downloading query activities objects...");

        //id of folders in manifest.json file that I have to download content from salesforce 
        const contentBuilderFolderIds = buManifest["query-folders"];
        if (!contentBuilderFolderIds || contentBuilderFolderIds.length == 0) {
            console.log(dateUtils.getTime() + " - No folders specified.");
            return;
        }

        let allFolders = await buManifest.QueryApiManager.GetAllFolders('queryactivity', error => DisplayHelper.showErrorMessage('error: ' + error));
        console.log(dateUtils.getTime() + " - Found " + allFolders.length + " Query Activities folders in the BU.");

        //create Business Unit folder
        let buFolderPath = FileHelper.createFolder(buManifest["bu-name"], workspaceFolderPath);

        //Create Email Studio folder
        buFolderPath = FileHelper.createFolder("Automation Studio", buFolderPath);

        let queryActivityTree = {
            buFolderPath: buFolderPath,
            paths: []
        }

        //Data Extensions folder has parentId = 0

        if (allFolders.filter(c => c.parentId == 0).length == 0) {
            console.log("Query activities root folder not found!");
            return;
        }

        let contentBuilderRootFolder = allFolders.filter(c => c.parentId == 0)[0];
        queryActivityTree.root = contentBuilderRootFolder.id
        //queryActivityTree.paths.push({ id: contentBuilderRootFolder.id, path: buFolderPath });

        //from all the categories of the BU, just get the the ones matching the folder id in manifest json
        let foldersToSync = allFolders.filter(c => contentBuilderFolderIds.filter(f => f == c.id).length > 0);

        console.log("Found " + foldersToSync.length + " content builder folders to sync.");

        //current folder is now Data Extensions folder
        buFolderPath = FileHelper.createFolder(contentBuilderRootFolder.name, buFolderPath);

        for (let i = 0; i < foldersToSync.length; i++) {
            let folderToSync = foldersToSync[i];
            const manifestFolderJson = contentBuilderFolderIds.filter(f => f == folderToSync.id || f == 0);
            const parentFolders = FileHelper.getParentFolders(allFolders, folderToSync);

            //creating parent folders so we have a full tree
            const parentFolderPath = FileHelper.createParentFolders(parentFolders, buFolderPath, queryActivityTree);

            //creating children folders recursively
            this.downloadQAFoldersRecursively(buManifest, allFolders, folderToSync, parentFolderPath, queryActivityTree);
        }

        FileHelper.saveAssetLocally_json(buFolderPath, queryActivityTree, (e) => console.error(e), 'folders.json');
    }

    async createTableOnSQL(sqlFile) {
        let xml = fs.readFileSync(sqlFile.fsPath.replace(/sql$/, "xml"), "utf-8");

        parseString(xml, async function (err, result) {
            let BusinessUnitID = result.DataExtension.BusinessUnitID[0];
            let buManifest = manifest["business-units"].filter(b => b["bu-id"] == BusinessUnitID)[0];
            let query = fs.readFileSync(sqlFile.fsPath, "utf-8");
            await sql.executeQuery(query, buManifest["connection-string"]);
            DisplayHelper.showMessage("Table Created Successfully!");
        });

    }

    async downloadDEData(sqlFile) {
        let xml = fs.readFileSync(sqlFile.fsPath.replace(/sql$/, "xml"), "utf-8");

        parseString(xml, async function (err, result) {
            let DEName = result.DataExtension.Name[0];
            let BusinessUnitID = result.DataExtension.BusinessUnitID[0];
            let buManifest = manifest["business-units"].filter(b => b["bu-id"] == BusinessUnitID)[0];
            let BusinessUnitName = buManifest["bu-name"];
            let DEFields = result.DataExtension.DataExtensionField;
            let DEExternalKey = result.DataExtension.CustomerKey[0];
            let downloadStatus = await buManifest.DataExtensionApiManager.DownloadDEData(DEName, DEFields, buManifest["connection-string"], DEExternalKey, BusinessUnitName);
            console.log("DOWNLOAD STATUS:");
            console.log(downloadStatus);
        });

    }

    async DownloadAllContentBuilder(buManifest, workspaceFolderPath) {

        console.log("Downloading content builder objects...");

        //id of folders in manifest.json file that I have to download content from salesforce 
        const contentBuilderFolderIds = buManifest["content-builder-folders"];
        if (!contentBuilderFolderIds || contentBuilderFolderIds.length == 0) {
            console.log("No folders specified.");
            return;
        }

        let allBUCategories = await buManifest.ContentBuilderApiManager.ContentBuilderGetAllCategories(error => DisplayHelper.showErrorMessage('error: ' + error));
        console.log("Found " + allBUCategories.length + " Content Builder folders in the BU.");

        //create Business Unit folder
        let buFolderPath = FileHelper.createFolder(buManifest["bu-name"], workspaceFolderPath);

        let contentBuilderTree = {
            buFolderPath: buFolderPath,
            paths: []
        }

        //Create Email Studio folder
        buFolderPath = FileHelper.createFolder("Email Studio", buFolderPath);



        //create Content Builder folder
        //content builder folder has parentId = 0
        if (allBUCategories.filter(c => c.parentId == 0).length == 0) {
            console.log("Content Builder root folder not found!");
            return;
        }

        let contentBuilderRootFolder = allBUCategories.filter(c => c.parentId == 0)[0];

        contentBuilderTree.root = contentBuilderRootFolder.id
        //contentBuilderTree.paths.push({ id: contentBuilderRootFolder.id, path: buFolderPath });

        //from all the categories of the BU, just get the the ones matching the folder id in manifest json
        let foldersToSync = allBUCategories.filter(c => contentBuilderFolderIds.filter(f => f == c.id).length > 0);

        console.log("Found " + foldersToSync.length + " content builder folders to sync.");

        //current folder is now Content Builder folder
        buFolderPath = FileHelper.createFolder(contentBuilderRootFolder.name, buFolderPath);

        for (let i = 0; i < foldersToSync.length; i++) {
            let folderToSync = foldersToSync[i];
            const manifestFolderJson = contentBuilderFolderIds.filter(f => f == folderToSync.id || f == 0);
            const assetType = manifestFolderJson[0]["member-type"]; //filter by type defined in json
            const parentFolders = FileHelper.getParentFolders(allBUCategories, folderToSync);

            //creating parent folders so we have a full tree
            const parentFolderPath = FileHelper.createParentFolders(parentFolders, buFolderPath, contentBuilderTree);

            //creating children folders recursively
            this.downloadFoldersRecursively(buManifest, allBUCategories, folderToSync, parentFolderPath, assetType, contentBuilderTree);
        }
        FileHelper.saveAssetLocally_json(buFolderPath, contentBuilderTree, (e) => console.error(e), 'folders.json');
    }

    async pushAsset(selectedFile) {
        let localFileName = selectedFile.fsPath;
        const parentFolderPath = localFileName.replace(path.basename(localFileName), ""); //removing file name to get folder path

        var objectMetadata = this.getObjectMetadataFromFile(localFileName);

        console.log("Member Id for selected object: " + objectMetadata.memberId);
        console.log("Asset Id for selected object: " + objectMetadata.id);

        DisplayHelper.showMessage("Pushing object with id " + objectMetadata.id + "...");

        let htmlFile = path.join(parentFolderPath, objectMetadata.name + ".html");

        if (objectMetadata.assetType.name === 'htmlemail') {
            objectMetadata.views.html.content = fs.readFileSync(htmlFile, "utf8");
        }

        else if (objectMetadata.assetType.name === 'htmlblock'
            || objectMetadata.assetType.name === 'freeformblock'
            || objectMetadata.assetType.name === 'codesnippetblock'
            || objectMetadata.assetType.name === 'template') {
            objectMetadata.content = fs.readFileSync(htmlFile, "utf8");
        }

        else if (objectMetadata.assetType.name === 'templatebasedemail') {

            this.updateTemplateBasedEmail(objectMetadata, parentFolderPath);
        }

        let buManifest = manifest["business-units"].filter(b => b["bu-id"] == objectMetadata.memberId)[0];
        await buManifest.ContentBuilderApiManager.ContentBuilderPutAsset(objectMetadata.id, JSON.stringify(objectMetadata), error => DisplayHelper.showErrorMessage('error in push: ' + error));
        DisplayHelper.showMessage("Object pushed");
    }

    generateGuid() {
        return 'xxxxxxxxxxxxxx4xxxxyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    updateSlots(objectMetadata, type, parentFolderPath) {
        var slots = objectMetadata.views.html.slots;
        var objectUpdated = objectMetadata;

        for (const key in slots[type].blocks) {
            FileHelper.updateContentBySlot(objectUpdated, `${parentFolderPath}\\__mcdx__${objectMetadata.name}\\`, type);
            objectUpdated.views.html.slots[type].blocks[key].content = fs.readFileSync(path.join(`${parentFolderPath}\\__mcdx__${objectMetadata.name}\\`, `${key}-${type}.html`), "utf8");
        }
    }

    updateTemplateBasedEmail(objectMetadata, parentFolderPath) {
        var slots = objectMetadata.views.html.slots;
        if (slots.banner == undefined && slots.main == undefined) {

            for (const key in slots) {
                let slotFolderPath = path.join(`${parentFolderPath}\\__mcdx__${objectMetadata.name}\\`, `__mcdx__${key}\\`);
                for (const block in slots[key].blocks) {
                    let htmlFile = fs.readFileSync(slotFolderPath + block + ".html", "utf-8");
                    slots[key].blocks[block].content = htmlFile;
                }
            }
        }

        if (slots.banner != undefined) {
            this.updateSlots(objectMetadata, 'banner', parentFolderPath);
        }

        if (slots.main != undefined) {
            this.updateSlots(objectMetadata, 'main', parentFolderPath);
        }
        return objectMetadata;
    }


    async downloadAsset(selectedFile) {
        /*console.log("TODOS LOS DATOS DEL FILE:");
        console.log(selectedFile);*/

        let localFileName = selectedFile.fsPath;
        const parentFolderPath = localFileName.replace(path.basename(localFileName), ""); //removing file name to get folder path

        const objectMetadata = this.getObjectMetadataFromFile(localFileName);

        console.log("Member Id for selected object: " + objectMetadata.memberId);
        console.log("Asset Id for selected object: " + objectMetadata.id);

        DisplayHelper.showMessage("Retrieving object with id " + objectMetadata.id + "...");

        let buManifest = manifest["business-units"].filter(b => b["bu-id"] == objectMetadata.memberId)[0];
        let assetJson = await buManifest.ContentBuilderApiManager.sfApi_getAssetById(objectMetadata.id, error => DisplayHelper.showErrorMessage('error in getAssetById: ' + error));

        FileHelper.saveAssetLocally_html(parentFolderPath, assetJson);

        if (assetJson && assetJson.views && assetJson.views.html && assetJson.views.html.content && assetJson.assetType.name != "templatebasedemail") {
            //removing html data from json because its all in .html file
            assetJson.views.html.content = "__content-placeholder__";
        } else if (assetJson && assetJson.content) {
            assetJson.content = "__content-placeholder__";
        }

        FileHelper.saveAssetLocally_json(parentFolderPath, assetJson);

        DisplayHelper.showMessage("Object retrieved");
    }

    getObjectMetadataFromFile(localPath) {

        const fileName = path.basename(localPath);
        if (fileName.endsWith(".json")) {
            let fileData = fs.readFileSync(localPath, "utf8");
            // Converting to JSON 
            const assetJson = JSON.parse(fileData);
            // Restoring html data to json
            if (assetJson && assetJson.views && assetJson.views.html && assetJson.views.html.content == "__content-placeholder__") {
                assetJson.views.html.content = fs.readFileSync(localPath.replace(".json", ".html"), "utf-8");
            } else if (assetJson && assetJson.content == "__content-placeholder__") {
                assetJson.content = fs.readFileSync(localPath.replace(".json", ".html"), "utf-8");
            }
            if (assetJson) {
                return assetJson;
            }
        } else if (fileName.endsWith(".html")) {
            localPath = localPath.replace(fileName, fileName.replace(".html", ".json"));
            if (fs.existsSync(localPath)) {
                return this.getObjectMetadataFromFile(localPath);
            }
        }

        return 0;
    }

    async downloadFoldersRecursively(buManifest, allBUCategories, currentFolder, localPath, assetType, contentBuilderTree) {
        try {
            console.log("Downloading assests of type " + assetType + " to folder " + localPath);

            let currentFolderPath = FileHelper.createFolder(currentFolder.name, localPath);
            contentBuilderTree.paths.push({ id: currentFolder.id, path: currentFolderPath });
            const currentFolderChildren = allBUCategories.filter(cat => cat.parentId == currentFolder.id);

            if (currentFolderChildren && currentFolderChildren.length > 0) {
                for (let index = 0; index < currentFolderChildren.length; index++) {
                    const currentFolderChild = currentFolderChildren[index];
                    this.downloadFoldersRecursively(buManifest, allBUCategories, currentFolderChild, currentFolderPath, assetType, contentBuilderTree);
                }
            }

            //now that we created the folders, we can download the content files inside these folders
            const downloadedAssetsFromFolder = await buManifest.ContentBuilderApiManager.sfApi_GetAssetsFromFolder(currentFolder.id, assetType, error => DisplayHelper.showErrorMessage('error in GetAssetsFromFolder: ' + error));

            console.log("Found " + downloadedAssetsFromFolder.length + " elements in folder " + currentFolder.id);

            if (downloadedAssetsFromFolder.length > 0) {
                DisplayHelper.showStatusBarMessage(texts.getDownloadingFilesFromMessage(currentFolder.name));
                for (let asset_index = 0; asset_index < downloadedAssetsFromFolder.length; asset_index++) {
                    const assetJson = downloadedAssetsFromFolder[asset_index];
                    //console.log(assetJson.assetType.name);
                    FileHelper.saveAssetLocally_html(currentFolderPath, assetJson);

                    if (assetJson && assetJson.views && assetJson.views.html && assetJson.views.html.content && assetJson.assetType.name != "templatebasedemail") {
                        //removing html data from json because its all in .html file
                        assetJson.views.html.content = "__content-placeholder__";
                    } else if (assetJson && assetJson.content) {
                        assetJson.content = "__content-placeholder__";
                    }

                    FileHelper.saveAssetLocally_json(currentFolderPath, assetJson);
                }
            }

            return currentFolderPath;
        } catch (error) {
            console.log("Error on downloadFoldersRecursively:" + error);
            throw error;
        }
    }

    async downloadDEFoldersRecursively(buManifest, allBUCategories, currentFolder, localPath, dataExtensionTree) {
        try {
            console.log("Downloading DE folder: " + currentFolder.name);

            let currentFolderPath = FileHelper.createFolder(currentFolder.name, localPath);
            dataExtensionTree.paths.push({ id: currentFolder.id, path: currentFolderPath });
            const currentFolderChildren = allBUCategories.filter(cat => cat.parentId == currentFolder.id);

            if (currentFolderChildren && currentFolderChildren.length > 0) {
                for (let index = 0; index < currentFolderChildren.length; index++) {
                    const currentFolderChild = currentFolderChildren[index];
                    this.downloadDEFoldersRecursively(buManifest, allBUCategories, currentFolderChild, currentFolderPath, dataExtensionTree);
                }
            }

            //Download DataExtensions
            const downloadedDEFromFolder = await buManifest.DataExtensionApiManager.DownloadDEFromFolder(currentFolder.id);
            console.log("Found " + downloadedDEFromFolder.length + " DataExtensions in folder " + currentFolder.name + " (" + currentFolder.id + ")");

            if (downloadedDEFromFolder.length > 0) {
                DisplayHelper.showStatusBarMessage(texts.getDownloadingFilesFromMessage(currentFolder.name));
                for (let asset_index = 0; asset_index < downloadedDEFromFolder.length; asset_index++) {
                    const asset = downloadedDEFromFolder[asset_index];
                    FileHelper.saveAssetLocally_xml(currentFolderPath, asset.xml, asset.de.Name, (e)=>console.error(e));
                    FileHelper.saveAssetLocally_sql(currentFolderPath, asset.sql, asset.de.Name, (e)=>console.error(e));
                }
            }

            return currentFolderPath;
        } catch (error) {
            console.log("Error on downloadFoldersRecursively:" + error);
            throw error;
        }
    }

    async downloadQAFoldersRecursively(buManifest, allBUCategories, currentFolder, localPath, queryActivityTree) {
        try {
            console.log("Downloading QA folder: " + currentFolder.name);

            let currentFolderPath = FileHelper.createFolder(currentFolder.name, localPath);
            queryActivityTree.paths.push({ id: currentFolder.id, path: currentFolderPath });
            const currentFolderChildren = allBUCategories.filter(cat => cat.parentId == currentFolder.id);

            if (currentFolderChildren && currentFolderChildren.length > 0) {
                for (let index = 0; index < currentFolderChildren.length; index++) {
                    const currentFolderChild = currentFolderChildren[index];
                    this.downloadQAFoldersRecursively(buManifest, allBUCategories, currentFolderChild, currentFolderPath, queryActivityTree);
                }
            }

            //Download DataExtensions
            const downloadedQAFromFolder = await buManifest.QueryApiManager.DownloadQAFromFolder(currentFolder.id, buManifest["bu-name"]);
            console.log("Found " + downloadedQAFromFolder.length + " Query Activities in folder " + currentFolder.name + " (" + currentFolder.id + ")");

            if (downloadedQAFromFolder.length > 0) {
                DisplayHelper.showStatusBarMessage(texts.getDownloadingFilesFromMessage(currentFolder.name));
                for (let asset_index = 0; asset_index < downloadedQAFromFolder.length; asset_index++) {
                    const asset = downloadedQAFromFolder[asset_index];
                    FileHelper.saveAssetLocally_json(currentFolderPath, asset.qa);
                    FileHelper.saveAssetLocally_sql(currentFolderPath, asset.sql, asset.qa.Name);
                }
            }
            return currentFolderPath;
        } catch (error) {
            console.log("Error on downloadFoldersRecursively:" + error);
            throw error;
        }
    }

    async newQueryActivity(selectedFile) {
        let selectedPath = path.extname(selectedFile.fsPath) ? path.dirname(selectedFile.fsPath) : selectedFile.fsPath;
        let qaName = await vscode.window.showInputBox({ prompt: 'Query activity name' });
        FileHelper.saveAssetLocally_sql(selectedPath, " ", qaName);
    }

    getManifestID(fsPath) {
        if (!fsPath || fsPath.length <= 3)
            return 0;
        let buPath = path.dirname(fsPath) + "\\__mcdx__.json";
        try {
            var json = fs.readFileSync(buPath, "utf-8")
            var obj = JSON.parse(json);
            return obj.bu_id;
        }
        catch (e) {
            if (e.code == "ENOENT") {
                return this.getManifestID(path.dirname(fsPath));
            }
        }
    }

    async pushQueryActivity(selectedFile) {
        let selectedSQL = fs.readFileSync(selectedFile.fsPath, "utf-8");
        //selectedSQL = selectedSQL.replace(/\n/g, " ");
        let selectedJSON = {};
        let buManifestID = this.getManifestID(selectedFile.fsPath);
        let buManifest = manifest["business-units"].filter(b => b["bu-id"] == buManifestID)[0];
        try {
            selectedJSON = JSON.parse(fs.readFileSync(selectedFile.fsPath.replace(".sql", ".json"), "utf-8"));
            selectedJSON.QueryText = selectedSQL;
            DisplayHelper.showMessage('Pushing Query Activity');
            console.log("PUHSING QUERY ACTIVITY");
            var result = await buManifest.QueryApiManager.updateQueryActivity(selectedJSON);
            if (result.status == 'OK') {
                DisplayHelper.showMessage("Query Activity pushed!");
            } else {
                DisplayHelper.showMessage("Query Activity push failed");
            }
        }
        catch (e) {
            if (e.code == "ENOENT") {
                console.log("CREATING QUERY ACTIVITY");
                var displayID = DisplayHelper.manageProgressMessage();
                DisplayHelper.showProgressMessage("Creating new Query Activity", displayID);
                var table = SQLParser.parse(selectedSQL);
                var qaName = path.basename(selectedFile.fsPath, '.sql');
                let categoryID = buManifest.QueryApiManager.folders.paths.filter(p => p.path == path.dirname(selectedFile.fsPath))[0].id;
                var result = await buManifest.QueryApiManager.createQueryActivity(table, selectedSQL, displayID, qaName, categoryID);
                if (result.status == 'OK') {
                    DisplayHelper.finishProgressMessage(displayID, "New Query Activity created!");
                    FileHelper.saveAssetLocally_json(path.dirname(selectedFile.fsPath), result.qa, (e) => console.error(e));
                } else {
                    DisplayHelper.finishProgressMessage(displayID, "Query Activity creation failed");
                    DisplayHelper.showErrorMessage(result.status);
                }
            }
            else console.error(e);
        }
    }

    async downloadDataViews(selectedFile) {
        let selectedPath = path.extname(selectedFile.fsPath) ? path.dirname(selectedFile.fsPath) : selectedFile.fsPath;
        let buManifestID = this.getManifestID(selectedPath);
        if (buManifestID == 0) {
            DisplayHelper.showErrorMessage("Path must belong to a Business Unit");
            return;
        }
        let buManifest = manifest["business-units"].filter(b => b["bu-id"] == buManifestID)[0];
        let result = buManifest.DataExtensionApiManager.downloadDataViews();
        if (result.status != 'OK') {
            DisplayHelper.showErrorMessage(result.status);
        }
    }
}