module.exports = {
    QAtoXML(obj, recurseLevel) {
        var xml = '';
        for (var prop in obj) {
            for(let i=0; i<recurseLevel; i++){
                xml+="\t";
            }
            xml += obj[prop] instanceof Array ? '' : "<" + prop + ">";
            if (obj[prop] instanceof Array) {
                for (var array in obj[prop]) {
                    xml += "<" + prop + ">\n";
                    xml += this.QAtoXML(new Object(obj[prop][array]), recurseLevel+1);
                    for(let i=0; i<recurseLevel; i++){
                        xml+="\t";
                    }
                    xml += "</" + prop + ">";
                }
            } else if (typeof obj[prop] == "object") {
                if (prop == "CreatedDate" || prop == "ModifiedDate") xml += obj[prop];
                else{
                    xml += "\n" + this.QAtoXML(new Object(obj[prop]), recurseLevel+1);
                    for(let i=0; i<recurseLevel; i++){
                        xml+="\t";
                    }
                }
            } else {
                xml += obj[prop];
            }
            xml += obj[prop] instanceof Array ? '' : "</" + prop + ">\n";
        }
        var xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
        return xml;
    },
}