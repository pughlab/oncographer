import { gql } from "@apollo/client";

export const RootForm = gql`
  query RootForm {
    GetRootForm {
      form_id
      form_name
      form_relationship_cardinality
    }
  }
`;

export const FormTree = gql`
  query FormTree {
    GetRootForm {
      ...FormID
      ...FormRecursive
    }
  }

  fragment FormID on Form {
    form_id
    form_name
    form_relationship_cardinality
    next_form {
      form_id
      form_name
      form_relationship_cardinality
    }
  }

  fragment FormRecursive on Form {
    next_form {
      ...FormID
      next_form {
        ...FormID
        next_form {
          ...FormID
        }
      }
    }
  }
`;

export const FormIDFields = gql`
  query FormIDFields($where: FormWhere) {
    forms(where: $where) {
      form_id
      form_name
      fieldsConnection(where: {
        edge: {
          isID: true
        }
      }) {
        edges {
          isID
          override
          node {
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
      }
    }
}
`;

export const FieldData = gql`
  query GetFormFields($id: String!) {
    # using static query take the form id 
    # and get all connected fields metadata
    # so it can populate the frontend
    GetFormFields(id: $id) {
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

export const FindPatients = gql`
  query GetPatient($where: PatientWhere!) {
    patients (where: $where) {
      patient_id
      program_id
      study
    }
  }
`

export const FindOrCreatePatient = gql`
  mutation FindOrCreatePatient($patientID: String!, $programID: String!, $study: String) {
    findOrCreatePatient(patientID: $patientID, programID: $programID, study: $study) {
      patient_id
      program_id
      study
    }
  }
`

export const FindSubmissions = gql`
  query GetSubmissions($where: SubmissionWhere!) {
    submissions(where: $where) {
      submission_id
      form_id
      fields {
        key
        value
      }
      patient {
        patient_id
        submitter_donor_id: patient_id
        program_id
        study
      }
    }
  }
`

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
        uuid
      }
    }
  }
`;

export const CreateKeycloakSubmitterConnection = gql `
  mutation AssignKeycloakUserToSubmitter($submitterID: ID!) {
    assignKeycloakUserToSubmitter(submitterID: $submitterID) {
        keycloakUserID
    }
  }
`

export const CreateUserSubmissionConnection = gql`
  mutation AssignUserSubmissionConnection($submissionID: ID!) {
    assignKeycloakUserToSubmission(submissionID: $submissionID) {
      keycloakUserID
    }
  }
`

export const FindDraft = gql`
  query FindDraft($where: FormDraftWhere) {
    formDrafts(where: $where) {
      draft_id
      form_id
      patient_id
      secondary_ids
      data
    }
  }
`
export const CreateDraft = gql`
  mutation CreateDrafts($input: [FormDraftCreateInput!]!) {
    createFormDrafts(input: $input) {
      formDrafts {
        draft_id
        form_id
        patient_id
        secondary_ids
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

export const CreateSubmission = gql`
  mutation CreateSubmissions($input: [SubmissionCreateInput!]!) {
    createSubmissions(input: $input) {
      submissions {
        submission_id
        form_id
        patient {
          patient_id
          program_id
          study
        }
        fields {
          key
          value
        }
      }
    }
  }
`