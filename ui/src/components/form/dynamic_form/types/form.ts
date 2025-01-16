import { ReactElement } from "react"
import { EventObject } from "xstate"

export interface PatientID {
    submitter_donor_id: string;
    program_id: string;
    study: string;
}

export interface Action {
    type: string,
    payload?: any
}

export type Label = {
    default: string
    [key: string]: string
}

export type LabelObject = {
    [key: string]: Label | undefined
}

export interface ActiveSubmission {
    submission_id: string
    fields: { key: string, value: FieldValue|FieldValue[] }[]
    patient: PatientID
}

export interface Form {
    formID: string
    name: string
    weight: number
    studies: string[]
    label?: Label
    id_fields?: string[]
    required_fields?: {
        default: string[]
        [key: string]: string[]
    }
    mutex_fields?: {
        default: string[]
        [key: string]: string[]
    }
}

export interface Field {
    name: string
    component: string
    type: string
    studies: string|string[]
    label: Label
    placeholder?: string
    description?: string
    regex?: string
    minValue?: number
    maxValue?: number
    options?: string | string[]
    enablingConditions?: string[]
    datalistName?: string
}

export interface FormDraft {
    draft_id?: string
    form_id: string
    patient_id: string
    data?: string
}

export interface FormReducer {
    fieldWidgets: Field[],
    idFields?: string[],
    mutexFields: string[],
    requiredFields?: string[],
    draft?: {
        id: string|null,
        lastUpdate: Date|null,
    }
    draftID?: string|null,
    lastDraftUpdate?: Date|null,
    lastTemplateUpdate?: Date|null,
    lastSubmissionUpdate?: Date|null,
    fieldValues?: { [key: string]: FieldValue },
    validationErrors: ValidationError[],
}

export interface FormOperations {
    clearForm?: () => void,
    fillForm?: (values: { [key: string]: FieldValue; }) => void,
    updateTemplateDate?: () => void,
    updateSubmissionDate?: () => void,
    updateDraftId?: (draftID: string) => void,
    clearDraftId?: () => void,
    updateDraftDate?: () => void,
    clearDraftDate?: () => void,
    clearTemplateDate?: () => void,
    clearSubmissionDate?: () => void,
    updateWidgets?: () => void,
    updateExclusiveFields?: () => void,
    updateRequiredFields?: () => void,
    updateValidationErrors?: () => void,
    clearValidationErrors?: () => void
}

export type FieldValue = string | string[]

export interface FormFieldPropsBase {
    field: Field,
    study: string,
    label: string,
    value: FieldValue,
    defaultValue: FieldValue,
    disabled: boolean,
    readonly: boolean,
    required: boolean,
    validators?: Validator[],
    errorMessage?: string,
    notifyError?: () => void,
    children: (props: { 
        study: string,
        defaultValue: FieldValue,
        disabled: boolean,
        readonly: boolean,
        onChange: (field: Field, value: FieldValue) => void,
        onClick?: (field: Field, value: FieldValue) => void
    }) => ReactElement
}

export type FormFieldProps = 
    | (FormFieldPropsBase & { onClick: (field: Field, value: FieldValue) => void, onChange?: never })
    | (FormFieldPropsBase & { onClick?: never, onChange: (field: Field, value: FieldValue) => void })

export type Validator = (value: FieldValue) => string | null

export type ValidationError = { field: string, type: string }

export interface SelectFieldPropsBase {
    label: string;
    value: FieldValue;
    defaultValue: FieldValue;
    disabled: boolean;
    multiple: boolean;
    field: Field;
    readonly: boolean;
    required: boolean;
    validators?: Validator[];
    options: string[];
    isReset: boolean;
}

export type ButtonSelectFieldProps = SelectFieldPropsBase & { onClick: (field: Field, value: FieldValue) => void; }
export type DropdownSelectFieldProps = SelectFieldPropsBase & { onChange: (field: Field, value: FieldValue) => void; notifyError?: () => void }
export type SelectFieldProps = ButtonSelectFieldProps & DropdownSelectFieldProps

export interface InputFieldPropsBase {
    field: Field,
    label: string,
    value: FieldValue,
    defaultValue: FieldValue,
    disabled: boolean,
    readonly: boolean,
    required: boolean,
    validators?: Validator[],
    notifyError?: () => void,
    type: string,
    isReset: boolean,
    onChange: (field: Field, value: FieldValue) => void,
    datalist?: string
}

export type DateInputFieldProps = InputFieldPropsBase & { onChange: (field: Field, value: FieldValue) => void; resolution: string; }
export type InputFieldProps = InputFieldPropsBase & { resolution?: string;}

export interface TextareaProps {
    label: string,
    value: string,
    defaultValue: string,
    field: Field,
    readonly: boolean,
    required: boolean,
    disabled: boolean,
    isReset: boolean,
    validators?: Validator[],
    notifyError?: () => void,
    onChange: (field: {name: string}, value: FieldValue) => void
}

export interface FormModalProps {
    open: boolean,
    onClose: () => void,
    title: string,
    content: string,
    error?: boolean
}

export interface DynamicFormProps {
    form: Form,
    study?: string,
    excluded_fields?: string[]
}

export interface ModalEvent extends EventObject {
    title: string,
    content: string,
    error?: boolean
}