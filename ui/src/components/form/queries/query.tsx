import { gql } from "@apollo/client";

export const RootForm = gql`
  query RootForm($study: String!) {
    GetRootForm(study: $study) {
      form_id
      form_name
      form_relationship_cardinality
      studies
      branch_fields
    }
  }
`;

export const ParentForm = gql`
  query ParentForm($id: String!) {
    GetParentForm(id: $id) {
      form_id
      form_name
      studies
      branch_fields
    }
  }
`

export const FormTree = gql`
  query FormTree($study: String!) {
    GetRootForm(study: $study) {
      ...FormID
      ...FormRecursive
    }
  }

  fragment FormID on Form {
    form_id
    form_name
    form_relationship_cardinality
    studies
    display_name
    branch_fields
    next_form {
      form_id
      form_name
      form_relationship_cardinality
      studies
      display_name
      branch_fields
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
      branch_fields
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
            display_name
          }
        }
      }
    }
}
`;

export const FieldData = gql`
  query GetFormFields($id: String!, $study: String) {
    # using static query take the form id 
    # and get all connected fields metadata
    # so it can populate the frontend
    GetFormFields(id: $id, study: $study) {
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
      display_name
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
  mutation FindOrCreatePatient($patient_id: String!, $program_id: String!, $study: String) {
    findOrCreatePatient(patient_id: $patient_id, program_id: $program_id, study: $study) {
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