module.exports = class SalesforceApiQueryBuilder {

    static buildQueryfor_GetAssetsFromFolderPaged(parentId, assetType){
        // if both parameters are present, use logical filter operator json if not create a simple filter
        let query;
        if(parentId && parentId !== "" && assetType && assetType !== ""){
            query = {
                "leftOperand":
                    getConditionAssetType(assetType)
                ,
                "logicalOperator":"AND",
                "rightOperand":
                    getConditionParentId(parentId)
            };
        }
        else if(parentId && parentId !== "" ){
                query = getConditionParentId(parentId);
            }
            else if(assetType && assetType !== ""){
                query = getConditionAssetType(assetType);
            }
            else {
                query = {};
            }
        
        return query;
    }
}

//private functions
function getConditionParentId(parentId) {
    return {
        "property":"category.id",
        "simpleOperator":"equal",
        "value": parentId + ""
    }
  }

  function getConditionAssetType(assetType){
    return {
        "property":"assetType.name",
        "simpleOperator":"equals",
        "valueType":"string",
        "value": assetType
    }
}