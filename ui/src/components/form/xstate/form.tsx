import { createMachine } from 'xstate';

export const formStateMachine = createMachine({
    id : "form",
    initial : "pending",
    states : {
        pending : {
            on : {
                VALIDATE : {target : 'validating'}
            }
        },
        validating : {
            on : {
                RESOLVE: { target: 'validated' },
                REJECT: { target: 'rejected' }
            }
        },
        validated : {
            on : {
               DOES_EXIST : 'exist'
            }
        },
        exist : {
            on : {
                EXIST : "submit",
                DOES_NOT_EXSIT : "rejected"

            }
        },
        submit : {
            on : {
                UPDATE : "updating",
                SUBMIT : "submitting"
            }
        },
        updating : {
            type : "final"
        },
        submitting : {
            type : "final"
        },
        rejected : {
            on : {
                REDO : "pending"
            }
        }
    }
})

// UPDATE : { target : "update", cond : false},
// SUBMIT : { target : "submit", cond : true}