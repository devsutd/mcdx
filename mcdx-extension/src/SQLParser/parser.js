const merge = require('lodash.merge');
const { interfaces } = require('mocha');

const functionTypes = {
    count: 'Number',
    avg: 'Number',
    min: 'Same',
    max: 'Same',
    case: 'Text',
    convex_hull: 'Text',
}

const TEXT_MAX_LENGTH = 4000;

module.exports = {
    getTree(query) {
        let tree = {}
        let sq = query.match(/\[.*?\]|\w+/g);
        sq = sq.filter(q => q != "");
        let sq2 = [];
        let splitquery = [];
        let sbs = "";
        for (var i = 0; i < sq.length; i++) {
            if (!sq[i].includes("[") && sbs == "") {
                sq2.push(sq[i]);
            }
            else if (sq[i].includes("]")) {
                sbs += sq[i];
                sq2.push(sbs);
                sbs = "";
            }
            else {
                sbs += sq[i] + " ";
            }
        }
        let open = 0;
        let func = "";
        for (var i = 0; i < sq2.length; i++) {
            func += sq2[i] + " ";
            if (sq2[i].includes("(")) {
                open += sq2[i].match(/\(/g).length;
            }
            if (sq2[i].includes(")")) {
                open -= sq2[i].match(/\)/g).length;
            }
            if (open == 0) {
                func = func.trim();
                if (func[0] == '(') {
                    var last = splitquery.pop();
                    if(last.toLowerCase()!='join'){
                        func = last + func;
                        func = func.trim();
                    }
                }
                splitquery.push(func);
                func = "";
            }
        }
        let stage = "";
        tree["select"] = [];
        tree["from"] = [];
        tree["other"] = [];
        splitquery = splitquery.filter(q => q!="");
        for (var i = 0; i < splitquery.length; i++) {
            if (splitquery[i].toLowerCase() == 'select') {
                stage = "select";
            } else if (splitquery[i].slice(0, 4).toLowerCase() == 'from' && stage == "select") {
                stage = "from";
                if(splitquery[i].length>4)
                    tree[stage].push(splitquery[i].slice(4, splitquery[i].length));
            }
            else if (splitquery[i].slice(0, 5).toLowerCase() == 'where' || splitquery[i].slice(0, 5).toLowerCase() == 'order' || splitquery[i].slice(0, 5).toLowerCase() == 'group') {
                stage = "other";
            }
            else {
                if (splitquery[i].toLowerCase() == "left" || splitquery[i].toLowerCase() == "right" || splitquery[i].toLowerCase() == "inner" || splitquery[i].toLowerCase() == "full" || splitquery[i].toLowerCase()=="distinct" || splitquery[i].toLowerCase()=="unique")
                    continue;
                tree[stage].push(splitquery[i]);
            }
        }
        return tree;
    },

    getFromTree(tree) {
        /*from={
            alias: "name"
            alias: {
                select:
                from:
            }
        }*/
        var a="";
        var from = tree.from;
        var resultFrom = {};
        var stack = [];
        var _on = false;
        from = from.filter(text=>text.toLowerCase()!='as');
        for (var i = 0; i < from.length; i++) {
            if (from[i].includes("(")) {
                var newTree = this.parse(from[i].slice(from[i].indexOf('(')+1, from[i].length-1));
                if(from[i+1]=='as')
                    resultFrom[from[i+2]] = newTree;
                else
                    resultFrom[from[i+1]] = newTree;
            } else {
                if (from[i].toLowerCase() == "join") {
                    _on = false;
                    continue;
                }
                if (from[i].toLowerCase() == "on" || _on) {
                    _on = true;
                    continue;
                }
                var last = stack.pop();
                // @ts-ignore
                if (last) {
                    resultFrom[from[i]] = last;
                } else {
                    stack.push(from[i]);
                }
            }
        }
        var last = stack.pop();
        // @ts-ignore
        if (last) {
            resultFrom[last] = last;
        }
        return resultFrom;
    },

    getSelectTables(tree, fromTree) {
        /*
            result=[
                {
                    field: "fieldName"
                    dataextension: "dataExtensionName"
                }
            ]
        */
        var result = [];
        var select = tree.select;
        let table;
        table = fromTree[Object.keys(fromTree)[0]];
        var _as = false;
        for (var i = 0; i < select.length; i++) {
            let field = select[i];
            let defield = field;
            let alias = "";
            if (_as) {
                _as = false;
                var res = result.pop();
                res.alias = field;
                result.push(res);
                continue;
            }
            if (field.toLowerCase() == "as") {
                _as = true;
                continue;
            }
            if (field.includes(".")) {
                defield = field.split(".")[1];
                table = fromTree[field.split(".")[0]];
            }
            if(table && typeof(table)=='object'){
                let a=table.filter(f=>f.alias&&f.alias!=''?f.alias==defield:f.field==defield);
                if(a && a.length>0){
                    table=a[0].dataExtension
                    defield=a[0].field
                }
            }
            if (field.includes("(")) {
                var type = this.getFunctionType(field);
                result.push({ type: type, alias: alias, maxlength: TEXT_MAX_LENGTH})
            } else {
                result.push({ field: defield, alias: alias, dataExtension: table })
            }
        }
        return result;
    },

    getFunctionType(field) {
        return 'Text';
    },

    parse(query) {
        //console.log(query);
        let tree = this.getTree(query);
        //console.log(tree);
        let fromtree = this.getFromTree(tree);
        //console.log(fromtree)
        let result = this.getSelectTables(tree, fromtree);
        //console.log(result);
        return result;
    }
}