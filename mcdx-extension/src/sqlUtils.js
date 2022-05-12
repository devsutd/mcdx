const sql = require('mssql');
const DisplayHelper = require('./displayHelper');

module.exports = {
    async executeQuery(query, connectionString, errorCallback) {
        try {
            // @ts-ignore
            await sql.connect(connectionString);
            // @ts-ignore
            const result = await sql.query(query);
            console.log(result);
        }
        catch (err) {
            if (!errorCallback) {
                console.error(err);
                DisplayHelper.showErrorMessage(err.message + "\n" + "ERROR CODE: " + err.code);
            } else {
                errorCallback(err);
            }
        }
    }
}