export const initialState = {
  validators: {},
  errorMessages: {},
  conditions: {},
  options: {},
  patientID: {},
  formIDs: {},
  fields: {},
  draftID: null,
  fieldWidgets: {
    patientIDFields: [],
    formIDFields: [],
    formFields: []
  },
  lastDraftUpdate: null,
  lastTemplateUpdate: null,
  lastSubmissionUpdate: null
};

export const formReducer = (state: any, action: any) => {
  switch (action.type) {
    case "UPDATE_VALIDATORS":
      return {
        ...state,
        validators: {
          ...state.validators,
          ...action.validators,
        },
      };
    case "UPDATE_ERROR_MESSAGES":
      return {
        ...state,
        errorMessages: {
          ...state.errorMessages,
          ...action.errorMessages,
        },
      };
    case "UPDATE_CONDITIONS":
      return {
        ...state,
        conditions: {
          ...state.conditions,
          ...action.conditions,
        },
      };
    case "UPDATE_OPTIONS":
      return {
        ...state,
        options: {
          ...state.options,
          ...action.options,
        },
      };
    case "UPDATE_PATIENT_ID":
      return {
        ...state,
        patientID: {
          ...state.patientID,
          ...action.payload,
        },
      };
    case "UPDATE_FORM_IDS":
      return {
        ...state,
        formIDs: {
          ...state.formIDs,
          ...action.payload,
        },
      };
    case "UPDATE_FIELDS":
      return {
        ...state,
        fields: {
          ...state.fields,
          ...action.payload,
        },
      };
    case "FILL_FORM":
      return {
        ...state,
        patientID: {
          ...state.patientID,
          ...action.payload.patientID,
        },
        formIDs: {
          ...state.formIDs,
          ...action.payload.formIDs,
        },
        fields: {
          ...state.fields,
          ...action.payload.fields,
        },
        lastDraftUpdate: null,
        lastTemplateUpdate: null,
        lastSubmissionUpdate: null
      };
    case "UPDATE_DRAFT_ID":
      return {
        ...state,
        draftID: action.payload,
      };
    case "CLEAR_FORM":
      return {
        ...state,
        formIDs: {},
        fields: {},
        draftID: null,
        lastDraftUpdate: null,
        lastTemplateUpdate: null,
        lastSubmissionUpdate: null,
      };
    case "UPDATE_WIDGETS":
      return {
        ...state,
        fieldWidgets: {
          patientIDFields: action.payload.patientIDFields,
          formIDFields: action.payload.formIDFields,
          formFields: action.payload.formFields
        }
      }
    case "UPDATE_DRAFT_DATE":
      return {
        ...state,
        lastDraftUpdate: new Date()
      }
    case "CLEAR_DRAFT_DATE":
      return {
        ...state,
        lastDraftUpdate: null
      }
    default:
      return state;
  }
};