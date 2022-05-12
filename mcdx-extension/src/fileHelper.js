const fs = require('fs');
const path = require('path');
const Texts = require('./texts');
const texts = new Texts();

module.exports = class FileHelper {

    constructor() {
    }


    static createFolder(folder, localPath, onErrorCallback) {
        let fullLocalPath = "";
        try {
            fullLocalPath = path.join(localPath, folder);
            if (!fs.existsSync(fullLocalPath)) {
                fs.mkdirSync(fullLocalPath);
            }
        }
        catch (err) {
            onErrorCallback(err);
        }
        return fullLocalPath;
    }

    static async saveNewFile(localPath, content, onErrorCallback) {
        if (fs.existsSync(localPath)) {
            //if file exists generate a new file name
            const fileName = path.basename(localPath);
            localPath = localPath.replace(fileName, "New-" + fileName);
            return FileHelper.saveNewFile(localPath, content);
        }

        try {
            fs.writeFileSync(localPath, content);
        }
        catch (err) {
            if (onErrorCallback) {
                onErrorCallback(err);
            }
            else {
                console.error(err);
            }
            localPath = "";
        }

        return localPath;
    }

    static saveFile(localPath, content, onErrorCallback) {
        fs.writeFile(localPath, content, err => {
            if (err) {
                if (onErrorCallback) {
                    onErrorCallback(err);
                }
                else {
                    console.error(err);
                }
            }
        });
    }

    static saveAssetLocally_json(localPath, assetJson, onErrorCallback, name) {
        if (!name)
            localPath = path.join(localPath, assetJson.name ? assetJson.name + ".json" : assetJson.Name + ".json");
        else
            localPath = path.join(localPath, name);
        FileHelper.saveFile(localPath, JSON.stringify(assetJson, null, 4), error => onErrorCallback(texts.getErrorSavingFileMessage(localPath, error)));//JSON.stringify's third parameter defines white-space insertion for pretty-printing. 
    }

    static saveAssetLocally_html(localPath, assetJson, onErrorCallback) {
        var folderPath = localPath;

        if (assetJson.assetType.name == "templatebasedemail") {
            var folder = FileHelper.createFolder("__mcdx__" + assetJson.name, folderPath);
            if (assetJson.views.html.slots != undefined) {
                FileHelper.saveSlotsContent(folder, assetJson);
            }
            return;
        }

        if (assetJson && assetJson.views && assetJson.views.html && assetJson.views.html.content) {
            localPath = FileHelper.SaveHtmlFile(localPath, assetJson.name, assetJson.views.html.content, onErrorCallback);
            return;
        }

        if (assetJson && assetJson.content) {
            localPath = FileHelper.SaveHtmlFile(localPath, assetJson.name, assetJson.content, onErrorCallback);
        }
    }

    static SaveHtmlFile(localPath, name, content, onErrorCallback) {
        localPath = path.join(localPath, name + ".html");
        FileHelper.saveFile(localPath, content, error => onErrorCallback(texts.getErrorSavingFileMessage(localPath, error)));
        return localPath;
    }

    static saveContent(assetJson, folder, slotType) {
        var slots = assetJson.views.html.slots;

        if (slotType == "standar") {
            for (const key in slots) {

                var blockFolder = FileHelper.createFolder("__mcdx__" + key, folder, (e) => console.error(e));
                for (const block in slots[key].blocks) {
                    var content = slots[key].blocks[block].content;
                    FileHelper.saveFile(path.join(blockFolder, block + ".html"), content, err => console.error(err));
                    slots[key].blocks[block].content = {};
                }
            }
            return;
        }

        if (slots[slotType] != undefined) {
            for (const key in slots[slotType].blocks) {
                FileHelper.saveFile(path.join(`${folder}\\`, `__mcdx__${key}-${slotType}.html`), slots[slotType].blocks[key].content, error => console.error(error));
            }
        }
    }

    static updateContentBySlot(assetJson, folder, slotType) {
        var asset = assetJson
        var slots = assetJson.views.html.slots;
        if (slotType == "standar") {
            for (const key in slots) {
                asset.views.html.slots.content = fs.readFileSync(path.join(`${folder}\\`, `${assetJson.name}-${key}.html`), "utf8");
            }
            return;
        }
        const { blocks } = slots[slotType];
        if (blocks != undefined) {
            for (const key in blocks) {
                asset.views.html.slots[slotType].blocks[key] = fs.readFileSync(path.join(`${folder}\\`, `${assetJson.name}-${key}-${slotType}.html`), "utf8");
            }
        }

        return asset
    }

    static saveSlotsContent(folder, assetJson) {
        try {
            if (assetJson.views.html.slots.banner === undefined && assetJson.views.html.slots.main === undefined) {
                this.saveContent(assetJson, folder, "standar");
            }

            this.saveContent(assetJson, folder, "banner");
            this.saveContent(assetJson, folder, "main");

        } catch (error) {
            console.log("Error on creating slots :" + error);
            console.log(error);
            throw error;
        }
    }

    static saveAssetLocally_xml(localPath, assetXML, assetName, onErrorCallback) {
        if (assetXML) {
            localPath = path.join(localPath, assetName + ".xml");
            FileHelper.saveFile(localPath, assetXML, error => onErrorCallback(texts.getErrorSavingFileMessage(localPath, error)));
        }
    }
    static saveAssetLocally_sql(localPath, assetSQL, assetName, onErrorCallback) {
        if (assetSQL) {
            localPath = path.join(localPath, assetName + ".sql");
            FileHelper.saveFile(localPath, assetSQL, error => onErrorCallback(texts.getErrorSavingFileMessage(localPath, error)));
        }
    }

    static createParentFolders(parentFolders, startingFolderPath, folderTree) {
        try {
            for (let i = parentFolders.length - 1; i >= 0; i--) {
                const folder = parentFolders[i];
                startingFolderPath = FileHelper.createFolder(folder, startingFolderPath);
                folderTree.paths.push({ id: folder.id, path: startingFolderPath });
            }
            return startingFolderPath;
        } catch (error) {
            console.log("Error on createParentFolders:" + error);
            throw error;
        }
    }

    static getParentFolders(allBUCategories, folder) {

        console.log("Getting parent folders for folder " + folder.id + " " + folder.name);

        try {
            let parentFolderNameList = [];
            let parentFolder = allBUCategories.filter(cat => cat.id == folder.parentId);

            console.log("Direct parent folder is:" + JSON.stringify(parentFolder));

            if (parentFolder && parentFolder.length > 0) {
                parentFolder = parentFolder[0];
                if (parentFolder.id == 0 || parentFolder.parentId == 0) {
                    return parentFolderNameList;
                }

                if (parentFolderNameList.filter(f => f == parentFolder.name).length == 0) {
                    parentFolderNameList.push(parentFolder.name);
                }

                let grandParents = FileHelper.getParentFolders(allBUCategories, parentFolder);
                if (grandParents && grandParents.length > 0) {
                    Array.prototype.push.apply(parentFolderNameList, grandParents);
                }
            }

            return parentFolderNameList;

        } catch (error) {
            console.log("Error on getParentFolders:" + error);
            throw error;
        }
    }
}