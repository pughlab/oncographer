export const initialState = {
  fieldWidgets: [],
  idFields: [],
  mutexFields: [],
  requiredFields: [],
  draftID: null,
  draft: null,
  lastDraftUpdate: null,
  lastTemplateUpdate: null,
  lastSubmissionUpdate: null,
  fieldValues: {},
  validationErrors: [],
};

export const formReducer = (state: any, action: any) => {
  switch (action.type) {
    case "UPDATE_FIELD_VALUES":
      return {
        ...state,
        fieldValues: {
          ...state.fieldValues,
          ...action.payload,
        },
      };
    case "FILL_FORM":
      return {
        ...state,
        fieldValues: {
          ...state.fieldValues,
          ...action.payload,
        },
        draftID: null,
        lastDraftUpdate: null,
      };
    case "UPDATE_DRAFT_ID":
      return {
        ...state,
        draftID: action.payload,
      };
    case "UPDATE_DRAFT":
      return {
        ...state,
        draft: action.payload,
      }
    case "CLEAR_FORM":
      return {
        ...state,
        fieldValues: {},
        validationErrors: [],
      };
    case "UPDATE_WIDGETS":
      return {
        ...state,
        fieldWidgets: [...action.payload],
      };
    case "UPDATE_DRAFT_DATE":
      return {
        ...state,
        lastDraftUpdate: new Date(),
      };
    case "CLEAR_DRAFT_DATE":
      return {
        ...state,
        lastDraftUpdate: null,
      };
    case "UPDATE_TEMPLATE_DATE":
      return {
        ...state,
        lastTemplateUpdate: new Date(),
      };
    case "CLEAR_TEMPLATE_DATE":
      return {
        ...state,
        lastTemplateUpdate: null,
      };
    case "UPDATE_SUBMISSION_DATE":
      return {
        ...state,
        lastSubmissionUpdate: new Date(),
      };
    case "CLEAR_SUBMISSION_DATE":
      return {
        ...state,
        lastSubmissionUpdate: null,
      };
    case "UPDATE_EXCLUSIVE_FIELDS":
      return {
        ...state,
        mutexFields: [...action.payload],
      };
    case "UPDATE_REQUIRED_FIELDS":
      return {
        ...state,
        requiredFields: [...action.payload],
      };
    case "UPDATE_VALIDATION_ERRORS":
      return {
        ...state,
        validationErrors: [...action.payload],
      }
    default:
      return state;
  }
};
