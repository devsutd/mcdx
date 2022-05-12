module.exports = {
    getWebView(table, qaName) {
        return `
        <html>

        <head>
            <title>Title</title>
            <meta charset="utf-8">
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
            <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
            <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
            <script>
                function createQAButtonRefresh(){
                    $('input[type=checkbox]').click(()=>{
                        $('#createQA').html('Create Query Activity');
                        $('#createQA').addClass('btn-light');
                        $('#createQA').removeClass('btn-danger');
                    });
                    $('#updateType_overwrite').click(()=>{
                        $('#createQA').html('Create Query Activity');
                        $('#createQA').addClass('btn-light');
                        $('#createQA').removeClass('btn-danger');
                    });
                }
                const vscode = acquireVsCodeApi();
                function submit(){
                    var pks=[];
                    $("input:checkbox:checked").each(function () {
                        pks.push($(this).attr("value"));
                    });
                    var dataExtension = $("#dataExtensionInput").val();
                    var updateType = 'Append';
                    if($("#updateType_update").prop("checked"))
                        updateType = 'Update';
                    if($("#updateType_overwrite").prop("checked"))
                        updateType = 'Overwrite';
                    if(dataExtension==''){
                        $('#createQA').html('Insert target Data Extension name');
                        $('#createQA').removeClass('btn-light');
                        $('#createQA').addClass('btn-danger');
                        return;
                    }
                    if(pks.length>0 || updateType=='Overwrite'){
                        vscode.postMessage({
                            dataExtension: dataExtension,
                            updateType: updateType,
                            pks: pks,
                        })
                    }else{
                        $('#createQA').html('Select at least one primary key');
                        $('#createQA').removeClass('btn-light');
                        $('#createQA').addClass('btn-danger');
                    }
                }
            </script>
        </head>
        
        <body style="background-color:#1E1E1E; color:white" onload="createQAButtonRefresh()">
            <div class="container">
                <div class="row">
                    <label class="col">
                        Target Data Extension name: 
                    </label>
                    <input class="col" id="dataExtensionInput" value="${qaName}"/>
                </div>
                <div class="row">
                    <label class="col">
                        Query Activity Update Type
                    </label>
                </div>
                <div class="row">
                    <div class="col-1"></div>
                    <div class="col-11">
                        <input type="radio" id="updateType_append" name="updateType" value="Append" checked="checked">
                        <label for="append">Append</label>
                        <input type="radio" id="updateType_update" name="updateType" value="Update">
                        <label for="update">Update</label>
                        <input type="radio" id="updateType_overwrite" name="updateType" value="Overwrite">
                        <label for="overwrite">Overwrite</label>
                    </div>
                </div>
                <div class="row">
                    <label class="col">
                        Primary Keys 
                    </label>
                </div>
                <div class="row">
                    <div class="col-1"></div>
                    <div class="col-11">
                        ${this.getCheckboxes(table)}
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <button class="btn btn-light" id="createQA" type="number" onclick="submit()">
                            Create Query Activity
                        </button>
                    </div>
                </div>
            </div>
        
        </body>
        
        </html>`;

    },

    getCheckboxes(table){
        let result = '';
        table.map(field=>{
            let id = "";
            if(field.alias==""){
                id=field.field;
            }
            else{
                id=field.alias;
            }
            result+=`<input type="checkbox" id="__checkbox__${id}" name="updateType" value="${id}">
            <label for="__checkbox__${id}">${id}</label><br>`+'\n';
        })
        return result;
    }
}