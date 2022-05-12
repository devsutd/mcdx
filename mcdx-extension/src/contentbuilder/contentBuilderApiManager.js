const ApiManager = require("../apiManager");
const SalesforceApiQueryBuilder = require("../salesforceApiQueryBuilder");
const fs = require('fs');

module.exports = class ContentBuilderApiManager extends ApiManager
{
    constructor(buManifest, tenant, rootPath) {
        super(buManifest, tenant);
        this.folders = this.getFoldersJson(rootPath);
    }

    getFoldersJson(rootPath){
        try{
            var json=fs.readFileSync(rootPath+'\\'+this.buManifest['bu-name']+'\\Email Studio\\Content Builder\\folders.json','utf-8');
            return JSON.parse(json);
        }
        catch(e){
            return ({});
        }
    }

    async sfApi_GetAssetsFromFolder(parentId, assetType, onErrorCallback) {
        const pageSize = 50;
        let pageNumber = 1;
        let assetList = [];
        let res = await this.sfApi_GetAssetsFromFolderPaged(parentId, assetType, pageNumber, pageSize, onErrorCallback);
        if (res) {
            Array.prototype.push.apply(assetList, res.items);
            while (res.count > pageSize * pageNumber) {
                pageNumber++;
                res = this.sfApi_GetAssetsFromFolderPaged(parentId, assetType, pageNumber, pageSize, onErrorCallback);
                Array.prototype.push.apply(assetList, res.items);
            }
        }

        return assetList;
    }

    async sfApi_GetAssetsFromFolderPaged(parentId, assetType, pageNumber, pageSize, onErrorCallback) {
        let salesforceApiUrl = this.restBaseUrl + "/asset/v1/content/assets/query";

        if (assetType == "content-builder-html-email") {
            assetType = "htmlemail";
        }
        else if (assetType == "*") {
            assetType = "";
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.accessToken
            },
            body: JSON.stringify({
                "page":
                {
                    "page": pageNumber,
                    "pageSize": pageSize
                },
                "query": SalesforceApiQueryBuilder.buildQueryfor_GetAssetsFromFolderPaged(parentId, assetType)
                ,
                "sort":
                    [
                        { "property": "id", "direction": "ASC" }
                    ],
                "fields":
                    [
                        "enterpriseId",
                        "memberId",
                        "thumbnail",
                        "category",
                        "content",
                        "data",
                        "views"
                    ]
            })
        }

        const fetch = require("node-fetch");
        let response;
        // @ts-ignore
        await fetch(salesforceApiUrl, options)
            .then(async res => res.json())
            .then(async res => {
                response = res;
            })
            .catch(error => {
                if (onErrorCallback) {
                    onErrorCallback(error);
                }
                else {

                }
            }
            );

        return response;
    }

    async ContentBuilderGetAllCategories(onErrorCallback) {
        const pageSize = 500;
        let pageNumber = 1;
        let categoryList = [];
        let res = await this.sfApi_getCategoriesPaged(pageNumber, pageSize, onErrorCallback);
        if (res) {
            Array.prototype.push.apply(categoryList, res.items);
            while (res.count > pageSize * pageNumber) {
                pageNumber++;
                res = await this.sfApi_getCategoriesPaged(pageNumber, pageSize, onErrorCallback);
                Array.prototype.push.apply(categoryList, res.items);
            }
        }

        return categoryList;
    }

    async sfApi_getAssetById(assetId, onErrorCallback) {
        let salesforceApiUrl = this.restBaseUrl + "/asset/v1/content/assets/" + assetId;

        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.accessToken
            }
        }

        const fetch = require("node-fetch");
        let response;
        // @ts-ignore
        await fetch(salesforceApiUrl, options)
            .then(res => res.json())
            .then(async res => {
                response = res;
            })
            .catch(error => {
                if (onErrorCallback) {
                    onErrorCallback(error);
                }
                else {

                }
            }
            );

        return response;
    }

    async ContentBuilderPutAsset(assetId, data, onErrorCallback) {
        let salesforceApiUrl = this.restBaseUrl + "/asset/v1/content/assets/" + assetId;

        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.accessToken
            },
            body: data
        }

        const fetch = require("node-fetch");
        let response;
        // @ts-ignore
        await fetch(salesforceApiUrl, options)
            .then(res => res.json())
            .then(async res => {
                response = res;
            })
            .catch(error => {
                if (onErrorCallback) {
                    onErrorCallback(error);
                }
                else {
                    console.error(error);
                }
            }
            );

        return response;
    }

    async sfApi_getCategoriesPaged(pageNumber, pageSize, onErrorCallback) {
        let salesforceApiUrl = this.restBaseUrl + "/asset/v1/content/categories/?$pagesize=" + pageSize + "&$page=" + pageNumber;

        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.accessToken
            }
        }

        const fetch = require("node-fetch");
        let response;
        // @ts-ignore
        await fetch(salesforceApiUrl, options)
            .then(res => res.json())
            .then(async res => {
                response = res;
            })
            .catch(error => {
                if (onErrorCallback) {
                    onErrorCallback(error);
                }
                else {

                }
            }
            );

        return response;
    }
}