import { v4 as uuidv4 } from "uuid";

/**
 * 
 * @param {*} conditionals (field condition) field metadata the contains info of what needs to be met to be used
 * @param {*} gfs (global state form) An object type, intra connection 
 * @param {*} ctx (context) An object type, which allows the form to handle inter connection to other form
 * @returns (boolean) if there contains a false condition then some condition within the field is not met
 */
export const doesFieldNotMeetAllConditions = (conditionals, gfs, ctx={}) => {
  // =====================
  // Conditional Handler
  // =====================

  let check = []
  // There are no conditions
  // so return false given 
  // there are no condition
  // to be met.

  if (conditionals === null) return false
  
  Object.keys(conditionals).forEach((key) => {
      if (gfs[key] === undefined && ctx[key] === undefined) 
           check.push(false)
      else check.push(conditionals[key] === gfs[key] || ctx[key] === conditionals[key] ); 
    });

  return check.includes(false);
};

export const constructDropdown = (values, menu = []) => {
  // =====================
  // Construct Dropdown
  // =====================
  
  // NOTE:
  // this can be done within
  // the back and and stored
  // within the backend.
  values.forEach((value, index) => {
    menu.push({key: index, text: value, value: value });
  });
  return menu;
};


export const getKeysValuePair = (keys, object) => {
  let tempObject = {} // initialize object

  // look through the array of keys
  // and store it in temp object.
  keys.forEach((key) => {
    tempObject[key] = object[key] // with the given keys assign key and value within that object
  })
  return tempObject
}

export const sortForeignKeys = (feildState, fks) => {

  let bucket = {} // initialize bucket will hold all the 
                  // primary keys of each foreign keys referenced in form
  
  // loop through all the reference_key (foreign keys)
  // dump them within there own form bucked
  fks.forEach(fk => {
    if (bucket[fk.node.primary_key_to.form_id] === undefined) {
      bucket[fk.node.primary_key_to.form_id] = { "form" : fk.node.primary_key_to.form_id, "formPrimaryIdentifierKeys" : {}}
    }
    bucket[fk.node.primary_key_to.form_id] = {...bucket[fk.node.primary_key_to.form_id], "formPrimaryIdentifierKeys" : {...bucket[fk.node.primary_key_to.form_id].primaryKeys, ...getKeysValuePair([fk.node.name], feildState)}}    
  })

  // return an array of all the referenced forms 
  return !Object.keys(bucket).length ? [] : Object.keys(bucket).map(reference => (bucket[reference]))
}

export const ParseFormToGraphQL = (form, fields) => {
  return {"form": form.form_id,
          "uuid": uuidv4(),
          "formPrimaryIdentifierKeys" : getKeysValuePair(fields.formPrimaryIdentifierKeys.map(pk => pk.name), form.ids),
          ...ObjectInputType(form.fields ,fields.formFields),
          ...fields.formReferenceKeys.concat(fields.globalIdentifierKeys).length ? 
          {"formReferenceKeys": 
            { "connect": [ 
                            {"where": 
                              {"node": { "OR" : [
                                              ...sortForeignKeys(form.ids, fields.formReferenceKeys),
                                              { "primary_keys" : getKeysValuePair(fields.globalIdentifierKeys.map(id => id.name), form.ids)}
                                          ]
                                       }
                              } 
                            } 
                          ]
            }
          } : {}
         };
}

/**
 * 
 * @param {*} formState 
 * @param {*} fieldsMetaData 
 * @returns 
 */
 const ObjectInputType = (formState, fieldsMetaData) => {
  let arr = []
  let cond = {}
  fieldsMetaData.forEach((value) => {
      cond[value.name] = value.conditionals === null ? false : doesFieldNotMeetAllConditions(value.conditionals, formState)
  })

  for (const prop in formState){
    if (cond[prop]) continue
    arr.push({ "node" : {key : prop, value : formState[prop] }}) // condition are met then set it to the value else set default value
  }
  return {"fields" : {"create" : arr} }
}

export const parseFormFieldsToQueryContext = (fields,state) => {
  if (fields === null || state === {}) return {}
  return { "where" :
           {"formPrimaryIdentifierKeys" :  fields.globalIdentifierKeys.length === 0 ? null :  getKeysValuePair(fields.globalIdentifierKeys.map(id => id.name), state) },
           "referencePrimary": {
           ...!fields.formReferenceKeys.length ? {} : {"OR": [
              ...sortForeignKeys(state, fields.formReferenceKeys)
            ]},
            }
  }
}