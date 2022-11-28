import { createMachine, assign, send, DoneEventObject } from 'xstate'

// TODO: match types between initial context and state node configs
interface QueryMachineContext {
    data: any,
    errors: any,
    variables: any,
}

export const QUERY_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    LOADED: 'loaded',
    ERROR: 'error'
}

export const QUERY_EVENTS = {
    REFRESH: 'refresh',
    RETRY: 'retry',
    // FETCH: 'fetch',
    DATA_CHANGED: 'data_changed',
    UPDATE_VARIABLES: 'update_variables'
}

export const createQueryMachine = ({srcInvoker, initialVariables = {}}: {srcInvoker: any, initialVariables: any}) => {
    const queryInvoke = (target: string) => ({
        src: (context: QueryMachineContext, event: any) => srcInvoker(context, event),
        onDone: {
            target: target,
            actions: assign({
                data: (context: QueryMachineContext, event: DoneEventObject) => event.data
            })
        },
        onError: {
            target: QUERY_STATES.ERROR
        }
    })
    const updateVariablesAction = assign({
        variables: (context: QueryMachineContext, event: any) => {
            // console.log(event)
            return event.variables
        }
    })
    const machine = createMachine({
        id: 'gqlQuery',
        initial: QUERY_STATES.IDLE,
        context: {data: null, errors: [], variables: initialVariables} as QueryMachineContext,
        // @ts-ignore
        states: {
            [QUERY_STATES.IDLE]: {
                on: {
                    [QUERY_EVENTS.UPDATE_VARIABLES]: {
                        target: QUERY_STATES.IDLE,
                        actions: updateVariablesAction
                    },
                    [QUERY_EVENTS.REFRESH]: {target: QUERY_STATES.LOADING}
                }

            },
            [QUERY_STATES.LOADING]: {
                invoke: queryInvoke(QUERY_STATES.LOADED),
            },
            // [QUERY_STATES.IDLE]: {
            //     on: {
            //         [QUERY_EVENTS.DATA_CHANGED]: {target: QUERY_STATES.LOADED}
            //     }
            // },
            [QUERY_STATES.LOADED]: {
                on: {
                    [QUERY_EVENTS.UPDATE_VARIABLES]: {
                        target: QUERY_STATES.LOADED,
                        actions: updateVariablesAction
                    },
                    [QUERY_EVENTS.REFRESH]: {target: QUERY_STATES.LOADING}
                }
            },
            [QUERY_STATES.ERROR]: {
                on: {
                    [QUERY_EVENTS.RETRY]: QUERY_STATES.LOADING
                }
            }
        },
    }, {
        actions: {
            
        }
    })

    return machine
}