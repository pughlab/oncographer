import { createMachine } from "xstate";

export const formStateMachine = createMachine({
  id: 'formMachine',
  initial: 'loading',
  states: {
    loading: {
      on: {
        DONE: { target: 'idle' },
        ERROR: { target: 'error' }
      }
    },
    error: { type: 'final' },
    empty: {
      entry: 'executeClearForm',
      always: { target: 'idle' }
    },
    idle: {
      after: {
        10000: { 
          target: 'saving',
          cond: 'canSave'
        } 
      },
      on: {
        SUBMIT: [
          {
            target: 'submitting',
            cond: 'isFormValid'
          },
          { target: 'invalid' }
        ],
        UPDATE: { target: 'updating' },
        INVALID: { target: 'invalid' },
        CLEAR: { target: 'empty' },
        SAVED: { target: 'idle' },
        FAILED: { target: 'failure' },
        RELOAD: { target: 'loading' },
      }
    },
    submitting: {
      invoke: {
        src: 'executeSubmitForm',
        onDone: { target: 'submitted' },
        onError: { target: 'failure' }
      }
    },
    updating: {
      always: { target: 'idle' }
    },
    submitted: {
      always: 'empty' 
    },
    invalid: {
      entry: 'showValidationErrors',
      on: {
        CLEAR: { target: 'empty' },
        SUBMIT: {
          target: 'submitting',
          cond: 'isFormValid'
        },
        RELOAD: { target: 'loading' },
      }
    },
    saving: {
      invoke: {
        src: 'executeSaveDraft',
        onDone: {
          target: 'idle'
        },
        onError: { target: 'failure' }
      }
    },
    failure: {
      entry: 'showModal',
      on: {
        RETRY: { target: 'submitting' },
        CANCEL: { target: 'idle' },
        RELOAD: { target: 'loading' },
      }
    }
  }
})