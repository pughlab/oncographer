import { ReactElement } from "react"
import { EventObject } from "xstate"

export interface Action {
    type: string,
    payload?: any
}

export type Label = {
    default: string
    [key: string]: string
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
}

export interface FormDraft {
    draft_id?: string
    form_id: string
    patient_id: string
    data?: string
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
        onChange: (field: {name: string}, value: FieldValue) => void,
        onClick?: (field: {name: string}, value: FieldValue) => void
    }) => ReactElement
}

export type FormFieldProps = 
    | (FormFieldPropsBase & { onClick: (field: {name: string}, value: FieldValue) => void, onChange?: never })
    | (FormFieldPropsBase & { onClick?: never, onChange: (field: {name: string}, value: FieldValue) => void })

export type Validator = (value: FieldValue) => string | null

export type ValidationError = { field: string, type: string }

export interface SelectFieldPropsBase {
    label: string;
    value: FieldValue;
    defaultValue: FieldValue;
    disabled: boolean;
    multiple: boolean;
    field: { name: string };
    readonly: boolean;
    required: boolean;
    validators?: Validator[];
    options: string[];
}

export type ButtonSelectFieldProps = SelectFieldPropsBase & { onClick: (field: { name: string }, value: FieldValue) => void; }
export type DropdownSelectFieldProps = SelectFieldPropsBase & { onChange: (field: { name: string }, value: FieldValue) => void; formWasCleared: boolean; notifyError?: () => void }
export type SelectFieldProps = ButtonSelectFieldProps & DropdownSelectFieldProps

export interface InputFieldPropsBase {
    label: string,
    value: FieldValue,
    defaultValue: FieldValue,
    disabled: boolean,
    field: { name: string },
    readonly: boolean,
    required: boolean,
    validators?: Validator[],
    notifyError?: () => void,
    type: string,
    onChange: (field: {name: string}, value: FieldValue) => void,
}

export type DateInputFieldProps = InputFieldPropsBase & { resolution: string; formWasCleared: boolean }
export type InputFieldProps = InputFieldPropsBase & { resolution?: string; formWasCleared: boolean }

export interface TextareaProps {
    label: string,
    value: FieldValue,
    defaultValue: string,
    field: { name: string },
    readonly: boolean,
    required: boolean,
    disabled: boolean,
    validators?: Validator[],
    notifyError?: () => void,
    onChange: (field: {name: string}, value: FieldValue) => void
}

export interface DynamicFormModalProps {
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