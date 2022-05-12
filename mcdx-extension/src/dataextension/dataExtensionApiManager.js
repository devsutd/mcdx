const ApiManager = require("../apiManager.js");
var soap = require('soap');
const dataExtensionSqlHelper = require("./dataExtensionSqlHelper.js");
const dataExtensionXmlHelper = require("./dataextensionXmlHelper");
const DisplayHelper = require("../displayHelper.js");
var fetch = require('node-fetch');
var fs = require('fs');
const sql = require('../sqlUtils');
const vscode = require('vscode');
const downloadDataViewsWebView = require('./downloadDataViewsWebView.js');

const viewProperties = {
    Bounce: ["AccountID", "OYBAccountID", "JobID", "ListID", "BatchID", "SubscriberID", "SubscriberKey", "EventDate", "IsUnique", "Domain", "BounceCategoryID", "BounceCategory", "BounceSubcategoryID", "BounceSubcategory", "BounceTypeID", "BounceType", "SMTPBounceReason", "SMTPMessage", "SMTPCode", "TriggeredSendCustomerKey"],
    BusinessUnitUnsubscribes: ["BusinessUnitID", "SubscriberID", "SubscriberKey", "UnsubDateUTC", "UnsubReason"],
    Click: ["AccountID", "OYBAccountID", "JobID", "ListID", "BatchID", "SubscriberID", "SubscriberKey", "EventDate", "Domain", "URL", "LinkName", "LinkContent", "IsUnique", "TriggeredSendCustomerKey"],
    Complaint: ["AccountID", "OYBAccountID", "JobID", "ListID", "BatchID", "SubscriberID", "SubscriberKey", "EventDate", "IsUnique", "Domain"],
    Coupon: ["Name", "ExternalKey", "Description", "BeginDate", "ExpirationDate"],
    FTAF: ["AccountID", "OYBAccountID", "JobID", "ListID", "BatchID", "SubscriberID", "SubscriberKey", "TransactionTime", "Domain", "IsUnique", "TriggeredSendCustomerKey"],
    Job: ["JobID", "EmailID", "AccountID", "AccountUserID", "FromName", "FromEmail", "SchedTime", "PickupTime", "DeliveredTime", "EventID", "IsMultipart", "JobType", "JobStatus", "ModifiedBy", "ModifiedDate", "EmailName", "EmailSubject", "IsWrapped", "TestEmailAddr", "Category", "BccEmail", "OriginalSchedTime", "CreatedDate", "CharacterSet", "IPAddress", "SalesForceTotalSubscriberCount", "SalesForceErrorSubscriberCount", "SendType", "DynamicEmailSubject", "SuppressTracking", "SendClassificationType", "SendClassification", "ResolveLinksWithCurrentData", "EmailSendDefinition", "DeduplicateByEmail", "TriggeredSendCustomerKey"],
    Journey: ["VersionID", "JourneyID", "JourneyName", "VersionNumber", "CreatedDate", "LastPublishedDate", "ModifiedDate", "JourneyStatus"],
    JourneyActivity: ["VersionID", "ActivityID", "ActivityName", "ActivityExternalKey", "JourneyActivityObjectID", "ActivityType"],
    ListSubscribers: ["AddedBy", "AddMethod", "CreatedDate", "DateUnsubscribed", "EmailAddress", "ListID", "ListName", "ListType", "Status", "SubscriberID", "SubscriberKey", "SubscriberType"],
    MobileLineAddressContactSubscriptionView: ["ChannelID", "ContactID", "ContactKey", "AddressID", "IsActive", "CreatedDate", "ModifiedDate"],
    MobileLineOrphanContactView: ["ContactID", "ContactKey", "AddressID", "CreatedDate"],
    Open: ["AccountID", "OYBAccountID", "JobID", "ListID", "BatchID", "SubscriberID", "SubscriberKey", "EventDate", "Domain", "IsUnique", "TriggeredSendCustomerKey"],
    Sent: ["AccountID", "OYBAccountID", "JobID", "ListID", "BatchID", "SubscriberID", "SubscriberKey", "EventDate", "Domain", "TriggeredSendCustomerKey"],
    smsmessagetracking: ["MobileMessageTrackingID", "EID", "MID", "Mobile", "MessageID", "KeywordID", "CodeID", "ConversationID", "CampaignID", "Sent", "Delivered", "Undelivered", "Unsub", "OptIn", "OptOut", "Outbound", "Inbound", "CreateDateTime", "ModifiedDateTime", "ActionDateTime", "MessageText", "IsTest", "MobileMessageRecurrenceID", "ResponseToMobileMessageTrackingID", "IsValid", "InvalidationCode", "SendID", "SendSplitID", "SendSegmentID", "SendJobID", "SendGroupID", "SendPersonID", "SubscriberID", "SubscriberKey", "SMSStandardStatusCodeId", "Description", "Name", "ShortCode", "SharedKeyword", "Ordinal", "FromName", "JBActivityID", "JBDefinitionID"],
    SocialNetworkImpressions: ["JobID", "ListID", "RegionTitle", "RegionDescription", "RegionHTML", "ContentRegionID", "SocialSharingSiteID", "SiteName", "CountryCode", "ReferringURL", "IPAddress", "TransactionTime", "PublishedSocialContentStatusID", "ShortCode", "PublishTime"],
    SocialNetworkTracking: ["SubscriberID", "SubscriberKey", "ListID", "BatchID", "SocialSharingSiteID", "SiteName", "CountryCode", "PublishedSocialContentID", "RegionTitle", "RegionDescription", "RegionHTML", "ContentRegionID", "OYBMemberID", "TransactionTime", "IsUnique", "Domain", "PublishedSocialContentStatusID", "ShortCode", "PublishTime"],
    Subscribers: ["SubscriberID", "DateUndeliverable", "DateJoined", "DateUnsubscribed", "Domain", "EmailAddress", "BounceCount", "SubscriberKey", "SubscriberType", "Status", "Locale"],
    SMSSubscriptionLog: ["LogDate", "SubscriberKey", "MobileSubscriptionID", "SubscriptionDefinitionID", "MobileNumber", "OptOutStatusID", "OptOutMethodID", "OptOutDate", "OptInStatusID", "OptInMethodID", "OptInDate", "Source", "CreatedDate", "ModifiedDate"],
    SurveyResponse: ["AccountID", "OYBAccountID", "JobID", "ListID", "BatchID", "SubscriberID", "SubscriberKey", "EventDate", "Domain", "SurveyID", "SurveyName", "IsUnique", "QuestionID", "QuestionName", "Question", "AnswerID", "AnswerName", "Answer", "AnswerData"],
    UndeliverableSms: ["MobileNumber", "Undeliverable", "BounceCount", "FirstBounceDate", "HoldDate"],
    Unsubscribe: ["AccountID", "OYBAccountID", "JobID", "ListID", "BatchID", "SubscriberID", "SubscriberKey", "EventDate", "IsUnique", "Domain"],
}

const viewTypes = {
    Bounce: ["Number", "Number", "Number", "Number", "Number", "Number", "Text", "Date", "Boolean", "Text", "Number", "Text", "Number", "Text", "Number", "Text", "Text", "Text", "Number", "Text"],
    BusinessUnitUnsubscribes: ["Number", "Number", "Text", "Date", "Text"],
    Click: ["Number", "Number", "Number", "Number", "Number", "Number", "Text", "Date", "Text", "Text", "Text", "Text", "Boolean", "Text"],
    Complaint: ["Number", "Number", "Number", "Number", "Number", "Number", "Text", "Date", "Boolean", "Text"],
    Coupon: ["Text", "Text", "Text", "Date", "Date"],
    FTAF: ["Number", "Number", "Number", "Number", "Number", "Number", "Text", "Date", "Text", "Boolean", "Text"],
    Job: ["Number", "Number", "Number", "Number", "Text", "Email", "Date", "Date", "Date", "Text", "Boolean", "Text", "Text", "Number", "Date", "Text", "Text", "Boolean", "Email", "Text", "Email", "Date", "Date", "Text", "Text", "Number", "Number", "Text", "Text", "Boolean", "Text", "Text", "Boolean", "Text", "Boolean", "Text"],
    Journey: ["Text", "Text", "Text", "Number", "Date", "Date", "Date", "Text"],
    JourneyActivity: ["Text", "Text", "Text", "Text", "Text", "Text"],
    ListSubscribers: ["Number", "Text", "Date", "Date", "Text", "Number", "Text", "Text", "Text", "Number", "Text", "Text"],
    MobileLineAddressContactSubscriptionView: ["Text", "Number", "Text", "Text", "Number", "Date", "Date"],
    MobileLineOrphanContactView: ["Number", "Text", "Text", "Date"],
    Open: ["Number", "Number", "Number", "Number", "Number", "Number", "Text", "Date", "Text", "Boolean", "Text"],
    Sent: ["Number", "Number", "Number", "Number", "Number", "Number", "Text", "Date", "Text", "Text"],
    smsmessagetracking: ["Number", "Number", "Number", "Phone", "Number", "Text", "Text", "Text", "Number", "Boolean", "Boolean", "Boolean", "Number", "Boolean", "Boolean", "Boolean", "Boolean", "Date", "Date", "Date", "Text", "Boolean", "Number", "Number", "Boolean", "Number", "Number", "Number", "Number", "Number", "Number", "Number", "Number", "Text", "Number", "Text", "Text", "Text", "Text", "Number", "Text", "Text", "Text"],
    SocialNetworkImpressions: ["Number", "Number", "Text", "Text", "Text", "Number", "Number", "Text", "Text", "Text", "Text", "Date", "Text", "Text", "Date"],
    SocialNetworkTracking: ["Number", "Email", "Number", "Number", "Number", "Text", "Text", "Text", "Text", "Text", "Text", "Text", "Number", "Date", "Boolean", "Text", "Text", "Text", "Date"],
    Subscribers: ["Number", "Date", "Date", "Date", "Text", "Email", "Number", "Text", "Text", "Text", "Locale"],
    SMSSubscriptionLog: ["Date", "Text", "Number", "Text", "Phone", "Number", "Number", "Date", "Number", "Number", "Date", "Number", "Date", "Date"],
    SurveyResponse: ["Number", "Number", "Number", "Number", "Number", "Number", "Text", "Date", "Text", "Number", "Text", "Number", "Number", "Text", "Text", "Number", "Text", "Text", "Text"],
    UndeliverableSms: ["Phone", "Boolean", "Number", "Date", "Date"],
    Unsubscribe: ["Number", "Number", "Number", "Number", "Number", "Number", "Text", "Date", "Boolean", "Text"],
}

const viewSQLTypes = {
    Bounce: ["int", "int", "bigint", "int", "bigint", "int", "nvarchar(254)", "datetime", "bit", "varchar(128)", "smallint", "nvarchar(50)", "smallint", "nvarchar(50)", "smallint", "nvarchar(50)", "nvarchar(max)", "nvarchar(max)", "smallint", "nvarchar(36)"],
    BusinessUnitUnsubscribes: ["bigint", "bigint", "varchar(254)", "smalldatetime", "varchar(100)"],
    Click: ["int", "int", "bigint", "int", "bigint", "int", "nvarchar(254)", "datetime", "varchar(128)", "varchar(900)", "varchar(1024)", "varchar(max)", "bit", "varchar(36)"],
    Complaint: ["int", "int", "bigint", "int", "bigint", "int", "nvarchar(254)", "datetime", "bit", "varchar(128)"],
    Coupon: ["nvarchar(128)", "nvarchar(36)", "varchar", "datetime", "datetime"],
    FTAF: ["int", "int", "int", "int", "int", "int", "nvarchar(254)", "datetime", "varchar(128)", "bit", "varchar(36)"],
    Job: ["int", "int", "int", "int", "nvarchar(130)", "varchar(100)", "smalldatetime", "smalldatetime", "smalldatetime", "varchar(50)", "bit", "varchar(50)", "varchar(50)", "int", "datetime", "char(100)", "nchar(200)", "bit", "varchar(128)", "varchar(100)", "varchar(100)", "smalldatetime", "smalldatetime", "varchar(30)", "varchar(50)", "int", "int", "varchar(128)", "ntext", "bit", "nvarchar(32)", "nvarchar(36)", "bit", "nvarchar(36)", "bit", "varchar(36)"],
    Journey: ["nvarchar(50)", "nvarchar(50)", "nvarchar(200)", "int", "datetime", "datetime", "datetime", "nvarchar(100)"],
    JourneyActivity: ["nvarchar(50)", "nvarchar(50)", "nvarchar(200)", "nvarchar(200)", "nvarchar(50)", "nvarchar(512)"],
    ListSubscribers: ["int", "varchar(17)", "smalldatetime", "smalldatetime", "nvarchar(254)", "int", "varchar(50)", "varchar(16)", "varchar(12)", "int", "nvarchar(254)", "varchar(100)"],
    MobileLineAddressContactSubscriptionView: ["nvarchar(250)", "bigint", "nvarchar(250)", "nvarchar(250)", "bit", "datetime", "datetime"],
    MobileLineOrphanContactView: ["bigint", "nvarchar(250)", "nvarchar(250)", "datetime"],
    Open: ["int", "int", "int", "int", "int", "int", "nvarchar(254)", "datetime", "varchar(128)", "bit", "varchar(36)"],
    Sent: ["int", "int", "int", "int", "int", "int", "nvarchar(254)", "datetime", "varchar(128)", "varchar(36)"],
    smsmessagetracking: ["bigint", "bigint", "bigint", "varchar(15)", "int", "nvarchar(50)", "nvarchar(50)", "nvarchar(50)", "int", "tinyint", "bit", "bit", "tinyint", "bit", "bit", "bit", "bit", "smalldatetime", "smalldatetime", "smalldatetime", "nvarchar(160)", "bit", "bigint", "bigint", "bit", "smallint", "bigint", "bigint", "bigint", "bigint", "bigint", "bigint", "bigint", "nvarchar(254)", "int", "nvarchar(250)", "nvarchar(250)", "nvarchar(250)", "nvarchar(250)", "tinyint", "nvarchar(250)", "nvarchar(50)", "nvarchar(50)"],
    SocialNetworkImpressions: ["bigint", "int", "varchar", "varchar", "varchar", "int", "int", "varchar", "varchar", "varchar", "varchar(50)", "datetime", "varchar", "varchar", "datetime"],
    SocialNetworkTracking: ["int", "nvarchar(254)", "int", "bigint", "int", "varchar", "varchar", "varchar", "varchar", "varchar", "varchar", "varchar", "int", "datetime", "bit", "varchar", "varchar", "varchar", "datetime"],
    Subscribers: ["bigint", "smalldatetime", "smalldatetime", "smalldatetime", "nvarchar(254)", "nvarchar(254)", "smallint", "nvarchar(254)", "varchar(100)", "varchar(12)", "int"],
    SMSSubscriptionLog: ["datetime", "nvarchar(250)", "bigint", "nvarchar(50)", "nvarchar(250)", "tinyint", "tinyint", "date", "tinyint", "bit", "date", "tinyint", "date", "date"],
    SurveyResponse: ["int", "int", "int", "int", "int", "int", "nvarchar(254)", "datetime", "varchar(128)", "int", "varchar(100)", "int", "int", "varchar(50)", "varchar(4000)", "int", "varchar(4000)", "varchar(4000)", "nvarchar(max)"],
    UndeliverableSms: ["varchar(15)", "bit", "smallint", "datetime", "datetime"],
    Unsubscribe: ["int", "int", "bigint", "int", "bigint", "int", "nvarchar(254)", "datetime", "bit", "varchar(128)"],
}

module.exports = class DataExtensionApiManager extends ApiManager {
    constructor(buManifest, tenant, rootPath) {
        super(buManifest, tenant);
        this.folders = this.getFoldersJson(rootPath);
    }

    getFoldersJson(rootPath) {
        try {
            var json = fs.readFileSync(rootPath + '\\' + this.buManifest['bu-name'] + '\\Email Studio\\Data Extensions\\folders.json', 'utf-8');
            return JSON.parse(json);
        }
        catch (e) {
            return ({});
        }
    }

    async DownloadDEFromFolder(folderID) {
        const DEList = await this.GetDataExtensionsFromFolder(folderID);
        for (var i = 0; i < DEList.length; i++) {
            var DEFields = await this.GetDataExtensionFields(DEList[i]);
            DEList[i].DataExtensionField = DEFields;
        }

        var dataExtensionXMLList = DEList.map(de => {
            return {
                de: de,
                xml: dataExtensionXmlHelper.XMLFromDE(de),
                sql: dataExtensionSqlHelper.SQLFromDE(de)
            }
        });
        return dataExtensionXMLList;
    }

    async GetDataExtensionFields(de) {
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
                            Property: 'CustomerKey',
                            SimpleOperator: 'like',
                            Value: de.CustomerKey,
                        },
                    },
                };

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                client.Retrieve(requestObject, (err, res) => {
                    if (err) {
                        console.error('ERROR DETAILS: ', err);
                        return "ERROR";
                    }
                    var dataExtensionFieldList = res.Results.map(r => {
                        delete r.attributes;
                        return r;
                    });
                    dataExtensionFieldList.sort((a, b) => {
                        return a.Ordinal - b.Ordinal
                    })
                    resolve(dataExtensionFieldList);
                });
            });
        });

        return await resultPromise;
    }

    async GetDataExtensionsFromFolder(folderID) {
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
                        return "ERROR";
                    }
                    if (!res.Results){
                        resolve([]);
                    }
                    else {
                        var dataExtensionList = res.Results.map(r => {
                            r["BusinessUnitID"] = this.buManifest["bu-id"];
                            delete r.attributes;
                            return r;
                        });
                        resolve(dataExtensionList);
                    }
                });
            });
        });

        return await resultPromise;
    }

    async DataRetrieve(client, requestObject) {
        var promise = new Promise((resolve, reject) => {
            client.Retrieve(requestObject, (err, res) => {
                if (err) {
                    console.error('ERROR DETAILS: ', err);
                    return "ERROR";
                }
                //console.log(res);
                resolve(res);
            });
        })
        return await promise;
    }

    async DownloadDEData(DEName, DEFields, connectionString, DEExternalKey) {
        //GET request to undocumented REST endpoint to get DE records count
        let url = this.restBaseUrl + "/data/v1/customobjectdata/key/" + DEExternalKey + "/rowset?$page=1&$pagesize=1";
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.accessToken
            }
        }

        // @ts-ignore
        let rowCount = await fetch(url, options).then(r => r.json()).then(r => { return r.count });

        let progressBarID = DisplayHelper.manageProgressMessage();
        DisplayHelper.showProgressMessage("Downloading DE Data", progressBarID);
        let resultPromise = new Promise(async (resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, async (e, client) => {
                let DEProps = DEFields.map(f => { return f.Name[0] });
                let DEObjectFields = DEFields.map(f => { return { Name: f.Name[0], FieldType: f.FieldType[0] } })
                var requestObject = {
                    RetrieveRequest: {
                        ObjectType: "DataExtensionObject[" + DEName + "]",
                        Properties: DEProps,
                    },
                };

                client.addSoapHeader(`<fueloauth xmlns="http://exacttarget.com">${this.accessToken}</fueloauth>`)

                DisplayHelper.updateProgressMessage(progressBarID, "Downloaded " + 0 + " of " + rowCount + " objects so far.", 0);
                let status = "";
                let retrieveObjectCount = 0;
                let lastRetrieveCount = 0;
                do {
                    try {
                        let res = await this.DataRetrieve(client, requestObject);
                        status = res.OverallStatus;
                        if (!res.Results || res.Results.length == 0) {
                            resolve("Empty DE");
                        }
                        else {
                            retrieveObjectCount += res.Results.length;
                            lastRetrieveCount += res.Results.length;
                            let dataExtensionObjects = { fields: DEObjectFields, data: [] };
                            var start = 0;
                            var i;
                            do {
                                for (i = start; i < res.Results.length; i++) {
                                    var r = res.Results[i];
                                    let prop = r.Properties.Property;
                                    //Escape the ' character. The sql query is not parameterized
                                    prop = prop.map(r => { r.Value = r.Value.replace(/\'/gi, "\'\'"); return r; });
                                    //2nd request onwards objects come with unwanted data. It is filtered here
                                    prop = prop.filter(r => r.Name != "_CustomObjectKey");
                                    dataExtensionObjects.data.push(prop);
                                    //Spliting each request into size 1000 max arrays for insertion.
                                    if (i % 1000 == 999) {
                                        i++;
                                        start = i;
                                        break;
                                    }
                                }
                                dataExtensionSqlHelper.InsertDataIntoTable(DEName, dataExtensionObjects, connectionString);
                                dataExtensionObjects = { fields: DEObjectFields, data: [] };
                            } while (i < res.Results.length);
                            console.log("Download status: " + status);
                            requestObject = {
                                RetrieveRequest: {
                                    ObjectType: "DataExtensionObject[" + DEName + "]",
                                    Properties: DEProps,
                                    ContinueRequest: res.RequestID,
                                },
                            };
                            DisplayHelper.updateProgressMessage(progressBarID, "Downloaded " + retrieveObjectCount + " of " + rowCount + " objects so far.", lastRetrieveCount * 100.0 / rowCount);
                        }
                    }
                    catch (e) {
                        console.log(e);
                        reject(e);
                    }
                }
                while (status == "MoreDataAvailable");
                DisplayHelper.finishProgressMessage(progressBarID, "Download Finished!");
                resolve(status);
            });
        });

        return await resultPromise;
    }

    async createDataViewTable(dataView) {
        let resultPromise = new Promise((resolve, reject) => {
            soap.createClient(this.wsdlBaseUrl, (e, client) => {
                var createRequest = {
                    Objects: {
                        attributes: {
                            'xmlns:ns1': "http://exacttarget.com/wsdl/partnerAPI",
                            'xsi:type': 'ns1:DataExtension',
                        },
                        Name: "mcdx_dataview_" + dataView,
                        CustomerKey: "__mcdx_dataview_" + dataView,
                        IsSendable: false,
                        Fields: {
                            Field: []
                        },
                    }
                }
                viewProperties[dataView].map((field, index) => {
                    createRequest.Objects.Fields.Field.push({
                        Name: field,
                        FieldType: viewTypes[index],
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

    async CreateAndDownload(dataView, recordAmount, ent, displayID, dvsLength) {
        try {
            let tableCreationResult = await this.createDataViewTable(dataView);
            //console.log(tableCreationResult);
            let queryActivityObject = await this.buManifest.QueryApiManager.getQueryObject("mcdx_dataviewQA_" + dataView);
            //console.log(queryActivityObject);
            var QueryText = `SELECT TOP ${recordAmount} ${viewProperties[dataView].join(",")} FROM ${ent?'ENT.':''}_${dataView}`;
            let queryActivityObjectID = 0;
            if (!queryActivityObject) {
                let queryActivityCreationResult = await this.buManifest.QueryApiManager.createQA(QueryText, "Overwrite", tableCreationResult.Results[0].Object, "mcdx_dataviewQA_" + dataView, undefined, "__mcdx_dataview_" + dataView);
                //console.log(queryActivityCreationResult);
                queryActivityObject = await this.buManifest.QueryApiManager.getQueryObject("mcdx_dataviewQA_" + dataView);
                queryActivityObjectID = queryActivityObject.ObjectID;
            }
            else {
                queryActivityObjectID = queryActivityObject.ObjectID;
                queryActivityObject.QueryText = QueryText;
                let queryActivityUpdateResult = await this.buManifest.QueryApiManager.updateQueryActivity(queryActivityObject);
                /*let queryActivityUpdateResult = await this.buManifest.QueryApiManager.deleteQueryActivity(queryActivityObject);
                console.log(queryActivityUpdateResult);*/
            }
            let performQueryActivityResult = await this.buManifest.QueryApiManager.performQueryActivity(queryActivityObjectID);
            //console.log(performQueryActivityResult);
            if (performQueryActivityResult.OverallStatus) {
                DisplayHelper.showErrorMessage(performQueryActivityResult.Results.Result[0].StatusMessage);
            }
            let query = dataExtensionSqlHelper.SQLFromDV(dataView, viewProperties[dataView], viewSQLTypes[dataView]);
            /*console.log("DB Table creation query");
            console.log(query);*/
            await sql.executeQuery(query, this.buManifest["connection-string"], (error) => { });
            let downloadDataResult = await this.DownloadDEData("mcdx_dataview_" + dataView, tableCreationResult.Results[0].Object.Fields.Field.map(f => { return { Name: [f.Name], FieldType: [f.FieldType] } }), this.buManifest['connection-string'], "__mcdx_dataview_" + dataView);
            //console.log(downloadDataResult);
        }
        catch (error) {
            console.error(error);
        }
        DisplayHelper.updateProgressMessage(displayID, `Downloaded Data View: ${dataView}`, 100 / dvsLength);
    }

    async downloadDataViews() {
        const nqaForm = vscode.window.createWebviewPanel('mcdx', 'Download Data Views', vscode.ViewColumn.One, { enableScripts: true });
        nqaForm.webview.html = downloadDataViewsWebView.getWebView();
        let resultPromise = new Promise((resolve, reject) => {
            let messaged = false;
            nqaForm.webview.onDidReceiveMessage(
                async message => {
                    if (!messaged) {
                        messaged = true;
                        let dvs = message.dvs;
                        if (dvs == undefined) {
                            resolve({ status: 'ERROR' });
                        }
                        var displayID = DisplayHelper.manageProgressMessage();
                        DisplayHelper.showProgressMessage("Downloading System Data Views", displayID);
                        console.log(dvs);
                        let promises = [];
                        for (var i = 0; i < dvs.length; i++) {
                            promises.push(this.CreateAndDownload(dvs[i].dv, dvs[i].amount, dvs[i].ent, displayID, dvs.length));
                        }
                        await Promise.all(promises);
                        DisplayHelper.finishProgressMessage(displayID, "Download finished!");
                        nqaForm.dispose();
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
}