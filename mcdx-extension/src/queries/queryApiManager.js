const ApiManager = require("../apiManager.js");
var soap = require('soap');
const DisplayHelper = require("../displayHelper.js");
const XMLHelper = require('./queryXmlHelper.js');
var fetch = require('node-fetch');
const vscode = require('vscode');
const newActivityWebView = require('./newActivityWebView');
const fs = require('fs');

const TEXT_MAX_LENGTH = 4000;

module.exports = class DataExtensionApiManager extends ApiManager {
    constructor(buManifest, tenant, rootPath) {
        super(buManifest, tenant);
        this.folders = this.getFoldersJson(rootPath);
    }

    getFoldersJson(rootPath) {
        try {
            var json = fs.readFileSync(rootPath + '\\' + this.buManifest['bu-name'] + '\\Automation Studio\\Query\\folders.json', 'utf-8');
            return JSON.parse(json);
        }
        catch (e) {
            return ({});
        }
    }

    async DownloadQAFromFolder(folderID) {
        let qaList = await this.GetQAFromFolder(folderID);
        let result = [];
        if (qaList) {
            result = qaList.map(qa => {
                delete qa.attributes;
                return { qa: qa, xml: XMLHelper.QAtoXML(qa, 0), sql: qa.QueryText }
            })
        }
        return result;
    }

    async GetQAFromFolder(folderID) {
        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {
                const requestObject = {
                    RetrieveRequest: {
                        ObjectType: "QueryDefinition",
                        Properties: ["CategoryID", "ObjectID", "CustomerKey", "Name",
                            "CreatedDate", "Description", "QueryText", "TargetType", "TargetUpdateType",
                            "DataExtensionTarget.Name", "DataExtensionTarget.CustomerKey", "Status"],
                        Filter: {
                            attributes: {
                                'xsi:type': 'SimpleFilterPart',
                            },
                            Property: 'CategoryID',
                            SimpleOperator: 'equals',
                            Value: folderID,
                        },
                    },
                };

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                client.Retrieve(requestObject, (err, res) => {
                    if (err) {
                        console.error('ERROR DETAILS: ', err);
                        DisplayHelper.showErrorMessage("ERROR " + err);
                        return "ERROR";
                    }
                    if (!res.Results) resolve([]);
                    else {
                        var result = res.Results.filter(qa => qa.Status != 'Inactive');
                        resolve(result);
                    }
                });
            });
        });

        return await resultPromise;
    }

    async getTableTypes(table) {
        let dataExtensions = {};

        table.map(field => {
            if (field.dataExtension)
                dataExtensions[field.dataExtension] = field.dataExtension
        });

        let result = [];
        for (let deName in dataExtensions) {
            deName = deName.replace("[", "").replace("]", "");
            let resultPromise = new Promise((resolve, reject) => {
                soap.createClient(this.wsdlBaseUrl, (e, client) => {
                    const requestObject = {
                        RetrieveRequest: {
                            ObjectType: "DataExtension",
                            Properties: ["CategoryID", "ObjectID", "CustomerKey", "Name",
                                "DataRetentionPeriod", "DataRetentionPeriodLength", "DataRetentionPeriodUnitOfMeasure",
                                "DeleteAtEndOfRetentionPeriod", "Description", "IsSendable",
                                "IsTestable", "ResetRetentionPeriodOnImport", "RetainUntil",
                                "RowBasedRetention", "SendableDataExtensionField.Name", "SendableSubscriberField.Name"],
                            Filter: {
                                attributes: {
                                    'xsi:type': 'SimpleFilterPart',
                                },
                                Property: 'Name',
                                SimpleOperator: 'equals',
                                Value: deName,
                            },
                        },
                    };

                    client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                    client.Retrieve(requestObject, (err, res) => {
                        if (err) {
                            console.error('ERROR DETAILS: ', err);
                            return "ERROR";
                        }
                        try {
                            var dataExtension = res.Results[0];
                            resolve(dataExtension);
                        } catch (e) {
                            reject('Empty Response')
                        }
                    });
                });
            });
            try {
                let de = await resultPromise;
                result.push(de);
            } catch (e) {
                result.push({
                    Name: deName
                })
            }
        }
        for (var i = 0; i < result.length; i++) {
            let de = result[i];
            if (de.CustomerKey) {
                let resultPromise = new Promise((resolve, reject) => {
                    soap.createClient(this.wsdlBaseUrl, (e, client) => {
                        const requestObject = {
                            RetrieveRequest: {
                                ObjectType: "DataExtensionField",
                                Properties: ["ObjectID", "PartnerKey", "CustomerKey", "Name", "DefaultValue", "MaxLength",
                                    "IsRequired", "Ordinal", "IsPrimaryKey", "FieldType", "CreatedDate",
                                    "ModifiedDate", "Scale", "Client.ID", "DataExtension.CustomerKey", "Ordinal"],
                                Filter: {
                                    attributes: {
                                        'xsi:type': 'SimpleFilterPart',
                                    },
                                    Property: 'DataExtension.CustomerKey',
                                    SimpleOperator: 'like',
                                    Value: de.CustomerKey,
                                },
                            },
                        };

                        client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                        client.Retrieve(requestObject, (err, res) => {
                            if (err) {
                                console.error('ERROR DETAILS: ', err);
                                DisplayHelper.showErrorMessage("ERROR " + err);
                                return "ERROR";
                            }
                            resolve(res.Results);
                        });
                    });
                });
                de.Fields = await resultPromise;
            }
        }
        //console.log(table);
        for (var i = 0; i < table.length; i++) {
            if (!table[i].dataExtension)
                continue;

            let tableDE = table[i].dataExtension.replace("[", "").replace("]", "");
            let de = result.filter(de => de.Name == tableDE)[0];
            if (de.CustomerKey) {
                let deField = de.Fields.filter(field => field.Name == table[i].field)[0];
                if (deField) {
                    table[i].type = deField.FieldType;
                    table[i].maxlength = deField.MaxLength;
                }
            }
            //TODO: BUSCAR LOS TIPOS DE DATOS DE LAS DATAVIEWS.
            else {
                table[i].type = 'Text';
            }
            if (table[i].type == "Text" && !table[i].maxlength) {
                table[i].maxlength = TEXT_MAX_LENGTH;
            }
        }
        console.log(table);
    }

    async createQA(selectedSQL, targetUpdateType, dataExtension, qaName, categoryID, customDeCustomerKey) {
        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {
                var createRequest = {
                    Options: {},
                    Objects: {
                        attributes: {
                            'xsi:type': 'QueryDefinition',
                        },
                        Name: qaName,
                        CategoryID: categoryID,
                        QueryText: selectedSQL,
                        TargetType: 'DE',
                        CustomerKey: customDeCustomerKey ? qaName : '__mcdx-query-activity__' + qaName,
                        DataExtensionTarget: {
                            PartnerKey: {
                                attributes: {
                                    'xsi:nil': 'true',
                                }
                            },
                            ObjectID: dataExtension.ObjectID,
                            CustomerKey: customDeCustomerKey ? customDeCustomerKey : "__mcdx-data-extension__" + dataExtension.Name,
                            Name: dataExtension.Name,
                        },
                        TargetUpdateType: targetUpdateType,
                    }
                }

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                //console.log(createRequest);
                //client.on('request', (xml, eid) => console.log(xml));
                client.Create(createRequest, (err, res) => {
                    if (err) {
                        console.error('ERROR DETAILS: ', err);
                        return "ERROR";
                    }
                    console.log("QUERY CREATION RESULT: ");
                    console.log(res);
                    resolve(res);
                });
            });
        });

        return await resultPromise;
    }

    async getQueryObject(qaName) {
        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {
                const requestObject = {
                    RetrieveRequest: {
                        ObjectType: "QueryDefinition",
                        Properties: ["CategoryID", "ObjectID", "CustomerKey", "Name",
                            "Description", "QueryText", "TargetType", "TargetUpdateType",
                            "DataExtensionTarget.Name", "DataExtensionTarget.CustomerKey", "Status"],
                        Filter: {
                            attributes: {
                                'xsi:type': 'SimpleFilterPart',
                            },
                            Property: 'Name',
                            SimpleOperator: 'like',
                            Value: qaName,
                        },
                    },
                };

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                client.Retrieve(requestObject, (err, res) => {
                    if (err) {
                        console.error('ERROR DETAILS: ', err);
                        DisplayHelper.showErrorMessage("ERROR " + err);
                        return "ERROR";
                    }
                    //console.log(res);
                    if (!res.Results) {
                        resolve(undefined);
                    }
                    else {
                        let results = res.Results.filter(r => r.Status != 'Inactive');
                        resolve(results[0]);
                    }
                });
            });
        });
        return await resultPromise;
    }

    async performQueryActivity(objectID) {
        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {
                var performRequest = {
                    Action: 'Start',
                    Definitions: {
                        'ns1:Definition': {
                            attributes: {
                                'xmlns:ns1': "http://exacttarget.com/wsdl/partnerAPI",
                                'xsi:type': "ns1:QueryDefinition"
                            },
                            'ns1:PartnerKey': {
                                attributes: {
                                    'xsi:nil': true
                                }
                            },
                            'ns1:ModifiedDate': {
                                attributes: {
                                    'xsi:nil': true
                                }
                            },
                            'ns1:ObjectID': objectID
                        }
                    }
                }

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                //console.log(createRequest);
                //client.on('request', (xml, eid)=>console.log(xml));
                client.Perform(performRequest, (err, res) => {
                    if (err) {
                        console.error('ERROR DETAILS: ', err);
                        DisplayHelper.showErrorMessage("ERROR " + err);
                        return "ERROR";
                    }
                    console.log("QUERY EXECUTION RESULT: ");
                    console.log(res);
                    resolve(res);
                });
            });
        });

        let startResponse = await resultPromise;

        if (startResponse.OverallStatus == 'OK') {
            let queryTask = startResponse.Results.Result[0].Task;

            let result = {};
            do {
                resultPromise = new Promise((resolve, reject) => {
                    soap.createClient(this.wsdlBaseUrl, (e, client) => {
                        const requestObject = {
                            RetrieveRequest: {
                                ObjectType: "AsyncActivityStatus",
                                Properties: ["Status", "StartTime", "EndTime", "TaskID", "ParentInteractionObjectID", "InteractionID", "Program",
                                    "StepName", "ActionType", "Type", "Status", "CustomerKey", "ErrorMsg", "CompletedDate", "StatusMessage"],
                                Filter: {
                                    attributes: {
                                        'xsi:type': 'SimpleFilterPart',
                                    },
                                    Property: 'TaskID',
                                    SimpleOperator: 'equals',
                                    Value: queryTask.ID,
                                },
                            },
                        };

                        client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                        client.Retrieve(requestObject, (err, res) => {
                            if (err) {
                                console.error('ERROR DETAILS: ', err);
                                DisplayHelper.showErrorMessage("ERROR " + err);
                                return "ERROR";
                            }
                            resolve(res.Results[0]);
                        });
                    });
                });
                result = await resultPromise;
                //console.log(result);
            } while (result.Properties.Property.filter(p => p.Name == 'Status')[0].Value != 'Complete');
            return await result;
        }
        else {
            return startResponse;
        }
    }

    generateGuid() {
        return 'xxxxxxxxxxxxxx4xxxxyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    async createQueryActivityTable(table, deName, pks) {
        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {
                var createRequest = {
                    Objects: {
                        attributes: {
                            'xmlns:ns1': "http://exacttarget.com/wsdl/partnerAPI",
                            'xsi:type': 'ns1:DataExtension',
                        },
                        Name: deName,
                        CustomerKey: this.generateGuid(),
                        IsSendable: false,
                        Fields: {
                            Field: []
                        },
                    }
                }
                table.map(field => {
                    var id = field.alias && field.alias != "" ? field.alias : field.field;
                    //console.log(id);
                    var isPk = pks.filter(pk => pk == id).length > 0 ? true : false;
                    createRequest.Objects.Fields.Field.push({
                        Name: id,
                        FieldType: field.type,
                        MaxLength: field.maxlength,
                        IsPrimaryKey: isPk,
                        IsRequired: isPk,
                    })
                });

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                //console.log(createRequest);
                //client.on('request', (xml, eid)=>console.log(xml));
                client.Create(createRequest, (err, res) => {
                    if (err) {
                        console.error('ERROR DETAILS: ', err);
                        DisplayHelper.showErrorMessage("ERROR " + err);
                        return "ERROR";
                    }
                    console.log("DATA TABLE CREATION RESULT: ");
                    console.log(res);
                    resolve(res);
                });
            });
        });

        return await resultPromise;
    }

    async createQueryActivity(table, selectedSQL, displayID, qaName, categoryID) {
        DisplayHelper.updateProgressMessage(displayID, "Getting Data Extension types", 25);
        await this.getTableTypes(table);
        DisplayHelper.updateProgressMessage(displayID, "Getting Query Activity data", 25);
        const nqaForm = vscode.window.createWebviewPanel('mcdx', 'New Query Activity', vscode.ViewColumn.One, { enableScripts: true });
        nqaForm.webview.html = newActivityWebView.getWebView(table, qaName);
        let resultPromise = new Promise((resolve, reject) => {
            let messaged = false;
            nqaForm.webview.onDidReceiveMessage(
                async message => {
                    let deName = message.dataExtension;
                    let targetUpdateType = message.updateType;
                    let pks = message.pks;
                    if (!deName || !targetUpdateType || !pks) {
                        resolve({ status: 'INPUT ERROR' });
                    }
                    messaged = true;
                    DisplayHelper.updateProgressMessage(displayID, "Creating Query Activity", 25);
                    let tableCreationResult = await this.createQueryActivityTable(table, deName, pks);
                    if (tableCreationResult.OverallStatus != 'OK' && !tableCreationResult.Results[0].Object) {
                        resolve({ status: tableCreationResult.OverallStatus });
                    }
                    else {
                        DisplayHelper.updateProgressMessage(displayID, "Creating Query Activity", 25);
                        let queryActivityCreationResult = await this.createQA(selectedSQL, targetUpdateType, tableCreationResult.Results[0].Object, qaName, categoryID);
                        if (queryActivityCreationResult.OverallStatus != 'OK') {
                            resolve({ status: queryActivityCreationResult.Results[0].StatusMessage });
                        }
                        nqaForm.dispose();
                        var qa = queryActivityCreationResult.Results[0].Object;
                        resolve({ status: 'OK', qa: qa });
                    }
                },
                undefined,
                undefined,
            );
            nqaForm.onDidDispose(() => {
                if (!messaged) {
                    resolve({ status: 'USER CLOSED FORM' });
                }
            });
        })
        return await resultPromise;
    }

    async updateQueryActivity(queryActivity) {
        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {

                var updateRequest = {
                    Objects: {
                                attributes: {
                                    'xsi:type' : "QueryDefinition"
                                }
                            } 
                }

                Object.assign(updateRequest.Objects, queryActivity);
                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                //console.log(updateRequest);
                client.on('request', (xml, eid)=>console.log(xml));
                client.Update(updateRequest, (err, res) => {
                    if (err) {
                        console.error('ERROR DETAILS: ', err);
                        DisplayHelper.showErrorMessage("ERROR " + err);
                        return "ERROR";
                    }
                    console.log("QUERY UPDATE RESULT");
                    console.log(res);
                    resolve(res);
                });
            });
        });

        var result = await resultPromise;
        if (result.OverallStatus = 'OK') {
            return { status: 'OK', qa: result.Results[0].Object }
        }
        else {
            return { status: result.OverallStatus }
        }
    }

    async deleteQueryActivity(queryActivity) {
        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {
                var updateRequest = {
                    Objects: queryActivity
                }

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                //console.log(updateRequest);
                //client.on('request', (xml, eid)=>console.log(xml));
                client.Delete(updateRequest, (err, res) => {
                    if (err) {
                        console.error('ERROR DETAILS: ', err);
                        DisplayHelper.showErrorMessage("ERROR " + err);
                        return "ERROR";
                    }
                    console.log("QUERY DELETION RESULT");
                    console.log(res);
                    resolve(res);
                });
            });
        });

        var result = await resultPromise;
        if (result.OverallStatus = 'OK') {
            return { status: 'OK', qa: result.Results[0].Object }
        }
        else {
            return { status: result.OverallStatus }
        }
    }
}