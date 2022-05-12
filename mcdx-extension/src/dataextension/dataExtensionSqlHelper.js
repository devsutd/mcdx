const sql = require('mssql');
const fs = require('fs');

module.exports = {
    SQLFromDE(de) {
        var SQL = 'CREATE TABLE [' + de.Name + '] (\n';
        for (var i = 0; i < de.DataExtensionField.length; i++) {
            SQL += this.ToScript(de.DataExtensionField[i]);
            if (i != de.DataExtensionField.length - 1) SQL += ", \n";
        }
        SQL += "\n";
        var primaryKeys = de.DataExtensionField.filter(f => f.IsPrimaryKey);
        if (primaryKeys.length > 0) {
            SQL += `CONSTRAINT [PK_${de.Name}] PRIMARY KEY CLUSTERED (`;
            for (var i = 0; i < primaryKeys.length; i++) {
                SQL += `[${primaryKeys[i].Name}]`;
                if (i != primaryKeys.length - 1)
                    SQL += ", ";
            }
            SQL += ") WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = ON, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON)";
        }
        SQL += ')';
        return SQL;
    },
    SQLFromDV(dv, fields, fieldtypes) {
        var SQL = 'CREATE TABLE [_' + dv + '] (\n';
        for (var i = 0; i < fields.length; i++) {
            SQL += fields[i] + ' ' + fieldtypes[i];
            if (i != fields.length - 1) SQL += ", \n";
        }
        SQL += "\n";
        SQL += ')';
        return SQL;
    },
    InsertValueCast(value, name, types) {
        if (!name)
            console.log("NOT NAME");
        if (!types)
            console.log("NOT TYPES");
        var a = types.filter(t => t.Name == name)[0]
        if (!a) {
            console.log("NOT A");
            console.log(types);
            console.log(name);
            return '\0\0\0';
        }
        let type = a.FieldType;
        if (type == "Number" || type == "Decimal")
            return value
        else
            return `'${value}'`;
    },
    ToScript(deField) {
        var result = "";
        result += `[${deField.Name}]`;
        switch (deField.FieldType) {
            case "Text":
            case "EmailAddress":
            case "Phone":
            case "Locale":
                result += ` nvarchar(${deField.MaxLength ? deField.MaxLength : 4000})`;
                break;
            case "Number":
                result += " int";
                break;
            case "Date":
                result += " date";
                break;
            case "Decimal":
                result += ` decimal(${deField.MaxLength}, 4)`;
                break;
            case "Bit":
                result += " bit";
                break;
            case "Boolean":
                result += " bit";
                break;
        }
        if (!deField.IsRequired)
            result += " NULL"

        if (deField.DefaultValue)
            result += ` DEFAULT ${deField.FieldType == "Text" || deField.FieldType == "EmailAddress" || deField.FieldType == "Phone" || deField.FieldType == "Locale" || deField.FieldType == "Boolean" ? `'${deField.DefaultValue}'`
                : deField.FieldType == "Date" ? (deField.DefaultValue == "GetDate()" ? deField.DefaultValue : `'${deField.DefaultValue}'`) : deField.DefaultValue}`;

        return result;
    },
    async InsertDataIntoTable(tableName, DEObjects, connectionString) {
        if (tableName.match(/mcdx_dataview.*/gi)) {
            tableName = tableName.replace("mcdx_dataview", "");
        }
        let query = "INSERT INTO [" + tableName + "] (";
        DEObjects.fields.map(d => {
            query += "[" + d.Name + "],";
        })
        query = query.slice(0, -1);
        query += ") VALUES ";
        DEObjects.data.map(d => {
            query += "("
            d.map(dd => {
                let parsedValue = this.InsertValueCast(dd.Value, dd.Name, DEObjects.fields);
                if (parsedValue != "\0\0\0")
                    query += parsedValue + ",";
            })
            query = query.slice(0, -1);
            query += "),";
        })
        query = query.slice(0, -1);
        query += "\n\n";
        try {
            // @ts-ignore
            await sql.connect(connectionString);
            // @ts-ignore
            const result = await sql.query(query);
        } catch (err) {
            console.log(err);
            fs.appendFile("D:/log.txt", query, () => { });
        }
    }

}