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
      foreign_key: foreign_keyConnection {
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
  }
`;

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

export const NodeExist = gql`
  query ($where: SubmitterWhere) {
    exist: submitters(where: $where) {
      uuid
      form
      formPrimaryIdentifierKeys
    }
  }
`;

export const NodeGetContext = gql`
  query Submitters($where: SubmitterWhere, $referencePrimary: SubmitterWhere) {
    submitters(where: $where) {
      formPrimaryIdentifierKeys
      form
      fields {
        key
        value
      }
      connectedFormsReferencingSubmitter(where: $referencePrimary) {
        form
        formPrimaryIdentifierKeys
        fields {
          key
          value
        }
      }
    }
  }
`;

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
  }
`;
