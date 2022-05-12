var soap = require('soap');

module.exports = class ApiManager {

    constructor(buManifest, tenant) {
        this.authBaseUrl = "https://" + tenant + ".auth.marketingcloudapis.com";
        this.restBaseUrl = "https://" + tenant + ".rest.marketingcloudapis.com";
        this.soapBaseUrl = "https://" + tenant + ".soap.marketingcloudapis.com/Service.asmx";
        this.wsdlBaseUrl = "https://" + tenant + ".soap.marketingcloudapis.com/etframework.wsdl";
        this.accessToken = "";
        this.buManifest = buManifest;
    }

    async Login(onErrorCallback) {

        const salesforceApiUrl = this.authBaseUrl + "/v2/token";

        const requestJson = {
            "grant_type": "client_credentials",
            "client_id": this.buManifest["client-id"],
            "client_secret": this.buManifest["client-secret"],
            "account_id": this.buManifest["bu-id"]
        };

        const options = {
            method: 'POST',
            body: JSON.stringify(requestJson),
            headers: {
                'Content-Type': 'application/json'
            }
        }

        const fetch = require("node-fetch");
        // @ts-ignore
        const res = await fetch(salesforceApiUrl, options)
            .then(async response =>
                response.json()
            )
            .catch(error => {
                if (onErrorCallback) {
                    onErrorCallback(error);
                }
                else {

                }
            }
            );
        // .catch(error => onErrorCallback('Login failed: ' + error));

        this.accessToken = res.access_token;
    }

    async GetAllFolders(type, onErrorCallback) {

        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {
                const requestObject = {
                    RetrieveRequest: {
                        ObjectType: "DataFolder",
                        Properties: ["ID", "Name", "ParentFolder.ID"],
                        Filter: {
                            attributes: {
                                'xsi:type': 'SimpleFilterPart',
                            },
                            Property: 'ContentType',
                            SimpleOperator: 'equals',
                            Value: type,
                        },
                    },
                };

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                client.Retrieve(requestObject, (err, res) => {
                    if (err) {
                        if(onErrorCallback){
                            onErrorCallback(err);
                        }else{
                            console.error('ERROR DETAILS: ', err);
                            return "ERROR";
                        }
                    }
                    //console.log(res);
                    if(res.Results){
                        var dataExtensionList = [];
                        for (let i = 0; i < res.Results.length; i++) {
                            var dataExtension = {
                                id: res.Results[i].ID,
                                name: res.Results[i].Name,
                                parentId: res.Results[i].ParentFolder.ID,
                            }
                            dataExtensionList.push(dataExtension);
                        }
                        resolve(dataExtensionList);
                    }
                    else{
                        resolve([]);
                    }
                });
            });
        });

        return await resultPromise;

    }

}