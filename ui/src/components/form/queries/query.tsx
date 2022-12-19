import { gql } from "@apollo/client";


export const getForms = gql`
query Query {
  forms {
    form_id
    form_name
    identifier {
      component
      conditionals
      description
      label
      name
      placeholder
      regex
      required
      set
      type
      value
    }
    primary_key {
      component
      conditionals
      description
      label
      name
      placeholder
      regex
      required
      set
      type
      value
    }
    foreign_key : foreign_keyConnection {
      edges {
        canReference
        override
        node {
        component
        conditionals
        description
        label
        name
        placeholder
        regex
        required
        set
        type
        value
        primary_key_to {
          form_id
        }
        }
      }
    }  
  }
}`;

export const FieldData = gql`
query PopulateForm($id: String!) {
  PopulateForm(id: $id) {
    component
    conditionals
    description
    label
    name
    regex
    required
    set
    type
    value
    filter
  }
}
`;


export const CopyFormMutation = gql`
mutation Create_Form_Copy($form: String!, $primary_keys: Conditional!, $key_value_pair: [Object!]!) {
  Create_Form_Copy(form: $form, primary_keys: $primary_keys, key_value_pair: $key_value_pair){
    values {
      key
      value
    }
  }
}
`;


export const NodeExist = gql`
query($where: SubmitterWhere) {
  exist : submitters(where: $where) {
    uuid
    form
    primary_keys
  }
}`;

export const NodeGetContext = gql`
query Submitters($where: SubmitterWhere, $referencePrimary: SubmitterWhere) {
  submitters(where: $where) {
    primary_keys
    form
    fields {
      key
      value
    }
  reference_primary_key(where: $referencePrimary) {
      form
      primary_keys
      fields {
        key
        value
      }
    }
  }
}
`


export const CreateNode = gql`
mutation Fields($input: [SubmitterCreateInput!]!) {
  createSubmitters(input: $input) {
    submitters {
      fields {
        key
        value
      }
    }
  }
}`