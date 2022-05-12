const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

module.exports = class ManifestManager {

    constructor(){
    }

    static getManifestJson() {
        const folderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        let manifestFilePath = path.join(folderPath, "manifest.json");

        let fileData = fs.readFileSync(manifestFilePath,"utf8");
        const manifest = JSON.parse(fileData);

        const requiredAttrNameArray = ["bu-id", "bu-name", "client-id", "client-secret" ];
        ManifestManager.validateBU_AttributeExists(manifest, requiredAttrNameArray);

        return manifest;
    }

    static validateBU_AttributeExists(manifestJson, attrNameArray){
        for (let index = 0; index < manifestJson["business-units"].length; index++) {
            const businessUnitInfo = manifestJson["business-units"][index];
            for (let attr_index = 0; attr_index < attrNameArray.length; attr_index++) {
                const attrName = attrNameArray[attr_index];
                if((businessUnitInfo[attrName] + "") === ""){
                    throw 'Error in manifest json file. A BU does not have "${attrName}" attribute. All BU in manifest json file should have "${attrName}" attribute';
                }
            }
        }
    }
}