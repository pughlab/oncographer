import { createMachine } from "xstate";

export const formStateMachine = createMachine({
  id: 'formMachine',
  initial: 'loading',
  states: {
    loading: {
      on: {
        DONE: { target: 'clean' },
        ERROR: { target: 'error' }
      }
    },
    error: { type: 'final' },
    empty: {
      entry: 'executeClearForm',
      always: { target: 'clean' }
    },
    clean: {
      on: {
        CHANGE: { target: 'modified' },
        SUBMIT: [
          {
            target: 'submitting',
            cond: 'isFormValid'
          },
          { target: 'invalid' }
        ],
        INVALID: { target: 'invalid' },
        CLEAR: { target: 'empty' },
        SAVED: { target: 'clean' },
        FAILED: { target: 'failure' },
        RELOAD: { target: 'loading' },
      }
    },
    modified: {
      after: {
        5000: { 
          target: 'saving'
        } // save the draft 5 seconds (5000 milliseconds) after user has stopped typing
      },
      on: {
        SUBMIT: [
          {
            target: 'submitting',
            cond: 'isFormValid'
          },
          { target: 'invalid' }
        ],
        INVALID: { target: 'invalid' },
        CHANGE: { target: 'modified' },
        SAVED: { target: 'clean' },
        CLEAR: { target: 'empty' },
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
    submitted: {
      always: 'empty' 
    },
    invalid: {
      entry: 'showValidationErrors',
      on: {
        CLEAR: { target: 'empty' },
        CHANGE: { target: 'modified' },
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
          target: 'clean'
        },
        onError: { target: 'failure' }
      }
    },
    failure: {
      entry: 'showModal',
      on: {
        RETRY: { target: 'submitting' },
        CANCEL: { target: 'clean' },
        RELOAD: { target: 'loading' },
      }
    }
  }
})