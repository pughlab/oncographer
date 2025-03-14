import { Action, Field, FormReducer, ValidationError } from "../types";

export const initialState: FormReducer = {
  fieldWidgets: [],
  idFields: [],
  mutexFields: [],
  requiredFields: [],
  draft: {
    id: null,
    lastUpdate: null
  },
  lastTemplateUpdate: null,
  lastSubmissionUpdate: null,
  validationErrors: [],
};

export function clearForm(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "CLEAR_FORM"
  })
}

export function updateDraftId(dispatch: React.Dispatch<Action>, draftId: string) {
  dispatch({
    type: "UPDATE_DRAFT_ID",
    payload: draftId
  })
}

export function clearDraftId(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "UPDATE_DRAFT_ID",
    payload: null
  })
}

export function updateDraftDate(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "UPDATE_DRAFT_DATE"
  })
}

export function clearDraftDate(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "CLEAR_DRAFT_DATE"
  })
}

export function updateTemplateDate(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "UPDATE_TEMPLATE_DATE"
  })
}

export function clearTemplateDate(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "CLEAR_TEMPLATE_DATE"
  })
}

export function updateSubmissionDate(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "UPDATE_SUBMISSION_DATE"
  })
}

export function clearSubmissionDate(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "CLEAR_SUBMISSION_DATE"
  })
}

export function updateWidgets(dispatch: React.Dispatch<Action>, widgets: Field[]) {
  dispatch({
    type: "UPDATE_WIDGETS",
    payload: widgets
  })
}

export function updateExclusiveFields(dispatch: React.Dispatch<Action>, fieldNames: string[]) {
  dispatch({
    type: "UPDATE_EXCLUSIVE_FIELDS",
    payload: fieldNames
  })
}

export function updateRequiredFields(dispatch: React.Dispatch<Action>, fieldNames: string[]) {
  dispatch({
    type: "UPDATE_REQUIRED_FIELDS",
    payload: fieldNames
  })
}

export function updateValidationErrors(dispatch: React.Dispatch<Action>, errors: ValidationError[]) {
  dispatch({
    type: "UPDATE_VALIDATION_ERRORS",
    payload: errors
  })
}

export function clearValidationErrors(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: "UPDATE_VALIDATION_ERRORS",
    payload: []
  })
}

export const formReducer = (state: any, action: any) => {
  switch (action.type) {
    case "UPDATE_DRAFT_ID":
      return {
        ...state,
        draft: {
          ...state.draft,
          id: action.payload,
        }
      };
    case "CLEAR_FORM":
      return {
        ...state,
        draft: {
          id: null,
          lastUpdate: null
        },
        lastTemplateUpdate: null,
        lastSubmissionUpdate: null,
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
        draft: {
          ...state.draft,
          lastUpdate: new Date(),
        }
      };
    case "CLEAR_DRAFT_DATE":
      return {
        ...state,
        draft: {
          ...state.draft,
          lastUpdate: null,
        }
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
