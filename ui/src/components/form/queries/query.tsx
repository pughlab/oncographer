import { gql } from "@apollo/client";

export const getForms = gql`
query Query {
  forms{
    form_name
    form_id
    form_relationship_cardinality
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
      primaryFormIdentifiers {
        form_id
        form_relationship_cardinality
      }
    }
    foreign_key : foreign_keyConnection {
      edges {
        relationship_cardinality
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
          primaryFormIdentifiers {
            form_id
            form_relationship_cardinality
          }
        }
      }
    }
  }
}
`;

export const FieldData = gql`
  query PopulateForm($id: String!) {
    # using static query take the form id 
    # and get all connected fields metadata
    # so it can populate the frontend
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
    formReferenceKeys{
      form
      formPrimaryIdentifierKeys
    }
  }
}
`;


export const submitterBundle = gql`
query bundleFormMetadataChecks($self: SubmitterWhere, $root: SubmitterWhere, $references : SubmitterWhere, $form : SubmitterWhere) {
  # count the amount of nodes that exist within reference to the root identifier.
  # This would be use to check if the form identifiers entered already exist
  root: submitters(where: $root){
  connectedFormsReferencingSubmitterAggregate(where : $self){
      count
    }
  }
  # from the root get all referenced form within the current form being
	# queried as well with the reference count how many times it has ben used
	# under the form id; this is nessary to check if it still meets the relational cardinality of
	# its referenced keys that are not the root 
  ReferencesConnectionOfRoot : submitters(where : $root){
    form
    formPrimaryIdentifierKeys
    connectedFormsReferencingSubmitter(where : $references){
      form
      formPrimaryIdentifierKeys
      connectedFormsReferencingSubmitterAggregate(where : $form){
        count
      }
    }
  }
  # now check the current relational cardinality of the root to the form
  CurrentRelationalCardinalityOfFormToRoot : submitters(where: $root){
      connectedFormsReferencingSubmitterAggregate(where : $form){
      count
    }
  }
}`

export const NodeGetContext = gql`
  query Submitters($root: SubmitterWhere, $references: SubmitterWhere) {
    submitters(where: $root) {
      formPrimaryIdentifierKeys
      form
      fields {
        key
        value
      }
      connectedFormsReferencingSubmitter(where: $references) {
        form
        uuid
        formPrimaryIdentifierKeys
        fields {
          key
          value
        }
      }
    }
  }
`;

// FIX LATER: change this to it's own resolver that just return boolean if the root exists 
export const doesRootExist = gql`
query doseRootExsit($self: SubmitterWhere) {
  # count the amount of nodes that exist within reference to the root identifier.
  # This would be use to check if the form identifiers entered already exist
  root: submitters(where: $self){
			form
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
  }
`;

export const FindDraft = gql`
  query FindDraft($where: FormDraftWhere) {
    formDrafts(where: $where) {
      form_id,
      patient_id,
      data
    }
  }
`
export const CreateDraft = gql`
  mutation CreateDrafts($input: [FormDraftCreateInput!]!) {
    createFormDrafts(input: $input) {
      formDrafts {
        form_id
        patient_id
        data
      }
    }
  }
`

export const DeleteDraft = gql`
  mutation DeleteDrafts($where: FormDraftWhere) {
    deleteFormDrafts(where: $where) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`