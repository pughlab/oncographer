const fs = require("fs");
const Papa = require('papaparse')
const { v4: uuidv4 } = require('uuid');
const { z } = require("zod");
// Tester function that impors data
Papa.parse(fs.createReadStream('./imports/mohccn.csv'), {
    complete : (result) => {
        parse_graph(result["data"])
    }
});

// const form = z.object({
//     name : z.string({})
// })

// console.log(form.parse({name : 0}))

// simple helper to determine the default value
const determine_value = (val) => {
    let value;
    switch(val){
        case "text":
            value = "";
            break
        case "number":
            value = 0.0;
            break
        case "integer":
            value = 0;
            break
        case "boolean":
            value = false;
            break
        default:

    }
    return value
} 

const parse_graph = (data, override={title : true}) => {
    // iterate the loop and create distinct Forms
    let forms = [];// instantiate form
    let graph = {};// instantiate graph 
    let is_id, contains, field_depth;

    // loop over csv data line by line
    data.forEach((element, idx) => {
        if (idx === 0 ) return // continue if the index is 0 given there is a title 
        forms.includes(element[0]) ? undefined : forms.push(element[0]) 
    })
    forms.forEach(element => { 
       graph = {...graph, [element] : { "form_name"     : element,
                                        "form_relation" : "need this",
                                        "form_id"       : uuidv4() ,
                                        "primary_key"   : {"create" : []}, 
                                        "foreign_key"   : {"where" : []}, 
                                        "fields"        : { "create" : null } ,
                                        "dependency"   : [] }} 
    })

    try {

    data.forEach((row, idx) => {
        if (idx === 0 && override.title) 
            return

        contains = false;
        is_id = row[1].includes("_id");
        let field = {
            "node" : {            
                name : row[1],
                label: row[1].split("_").map(val => { return val.charAt(0).toUpperCase() + val.substring(1); }).join(" "),
                placeholder : "",
                type : row[4],
                value : determine_value(row[4].toLowerCase()),
                required : row[2].toLowerCase().includes("required"),
                description : row[3],
            }
        }
        if (is_id){
            for (const form_name in graph) {
                if (graph[form_name].primary_key.create.filter(nde => nde.node.name === field.node.name).length > 0){
                    contains = true;
                    graph[row[0]].dependency.includes(form_name) ? null : graph[row[0]].dependency.push(form_name)
                }
            }        
            
            if (contains){ 
                graph[row[0]].foreign_key.where.push(field)
                
            }else {
                graph[row[0]].primary_key.create.push(field)
            }
            
        } else {
            if ( graph[row[0]].fields.create === null ){
                graph[row[0]].fields.create = field
            }else {
            field_depth = graph[row[0]].fields
            while (true){
                    if (field_depth.create.node.has_next_question === undefined){
                        field_depth.create.node.has_next_question = {"create" : field}
                        break
                    }
                    field_depth = field_depth.create.node.has_next_question
                }
            }
        }
        
    })
    }catch (error) {
        console.log("Here ",error)
    }
   
    console.log(graph)
}

