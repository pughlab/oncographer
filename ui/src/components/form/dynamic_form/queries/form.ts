import { gql } from "@apollo/client";

export const RootForm = gql`
  query RootForm($study: String!) {
    GetRootForm(study: $study) {
      formID
      name
      label
      studies
    }
  }
`;

export const FormTree = gql`
  query Forms($where: FormWhere = { name: "Donor" }, $study: String) {
    forms(where: $where) {
      ...FormID
      ...FormEdges
    }
  }

  fragment FormID on Form {
    formID
    name
    label
    id_fields
    required_fields
    mutex_fields
    studies
    weight
  }

  fragment FormEdges on Form {
    next_formConnection(where: { edge: { studies_INCLUDES: $study } }) {
      edges {
        studies
        node {
          ...FormID
          next_formConnection(where: { edge: { studies_INCLUDES: $study } }) {
            edges {
              studies
              node {
                ...FormID
                next_formConnection(
                  where: { edge: { studies_INCLUDES: $study } }
                ) {
                  edges {
                    studies
                    node {
                      ...FormID
                      next_formConnection(
                        where: { edge: { studies_INCLUDES: $study } }
                      ) {
                        edges {
                          studies
                          node {
                            ...FormID
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const FormIDFields = gql`
  query FormIDFields($where: FormWhere) {
    forms(where: $where) {
      formID
      name
      branch_fields
      fieldsConnection(where: { edge: { isID: true } }) {
        edges {
          node {
            component
            enablingConditions
            description
            label
            name
            regex
            minValue
            maxValue
            options
            type
            value
            studies
            datalist
          }
        }
      }
    }
  }
`;

export const PatientIDLabels = gql`
  query PatientIDLabels {
    forms(where: { name: "Donor" }) {
      formID
      name
      fieldsConnection(where: { edge: { isID: true } }) {
        edges {
          node {
            name
            label
          }
        }
      }
    }
  }
`

export const FormLabels = gql`
  query FormLabels($id: String!, $study: String) {
    GetFormFields(id: $id, study: $study) {
      name
      label
    }
  }
`

export const FieldData = gql`
  query GetFormFields($id: String!, $study: String) {
    GetFormFields(id: $id, study: $study) {
      component
      enablingConditions
      description
      label
      name
      regex
      minValue
      maxValue
      options
      type
      value
      studies
      datalistName
    }
  }
`;

export const FindPatients = gql`
  query GetPatient($where: PatientWhere!) {
    patients(where: $where) {
      patient_id
      program_id
      study
    }
  }
`;

export const FindOrCreatePatient = gql`
  mutation FindOrCreatePatient(
    $patient_id: String!
    $program_id: String!
    $study: String
  ) {
    findOrCreatePatient(
      patient_id: $patient_id
      program_id: $program_id
      study: $study
    ) {
      patient_id
      program_id
      study
    }
  }
`;

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
`;

export const ParentForm = gql`
  query ParentForm($id: String!) {
    ParentForm(id: $id) {
      formID
      name
    }
  }
`;

export const CreateUserSubmissionConnection = gql`
  mutation AssignUserSubmissionConnection($submissionID: ID!) {
    assignKeycloakUserToSubmission(submissionID: $submissionID) {
      keycloakUserID
    }
  }
`;

export const FindDraft = gql`
  query FindDraft($where: FormDraftWhere) {
    formDrafts(where: $where) {
      draft_id
      data
    }
  }
`;

export const FindTemplate = gql`
  query FindTemplate($where: FormTemplateWhere) {
    formTemplates(where: $where) {
      template_id
      form_id
      patient_id
      secondary_ids
      data
    }
  }
`;

export const CreateTemplate = gql`
  mutation CreateTemplate($input: [FormTemplateCreateInput!]!) {
    createFormTemplates(input: $input) {
      formTemplates {
        template_id
        patient_id
        form_id
        secondary_ids
        data
      }
    }
  }
`;

export const UpdateOrCreateDraft = gql`
  mutation UpdateOrCreateDraft($input: FormDraftCreateInput!) {
    updateOrCreateDraft(input: $input) {
      draft_id
      form_id
      patient_id
      secondary_ids
      data
    }
  }
`;

export const DeleteDraft = gql`
  mutation DeleteDrafts($where: FormDraftWhere!) {
    deleteFormDrafts(where: $where) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const DeleteTemplate = gql`
  mutation DeleteTemplates($where: FormTemplateWhere!) {
    deleteFormTemplates(where: $where) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

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
`;

export const DeleteSubmission = gql`
  mutation DeleteSubmissions($where: SubmissionWhere!) {
    deleteSubmissionAndFields(where: $where) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;
