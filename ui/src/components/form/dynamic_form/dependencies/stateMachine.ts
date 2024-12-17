import { createMachine } from "xstate";

export const formStateMachine = createMachine({
  id: 'formMachine',
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        src: 'initializeForm',
        onDone: { target: 'clean' },
        onError: { target: 'error' }
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
        1000: { 
          target: 'saving',
          cond: 'isFormValid'
        } // save the draft 1 second (1000 milliseconds) after user stopped typing, but only do it if the form is valid
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
        CHANGE: { actions: 'storeDraft' },
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
        src: 'saveDraft',
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