import { createMachine, assign } from 'xstate'
import {useMachine} from '@xstate/react'
import { useMemo } from 'react'
import * as R from 'remeda'

interface FilterMachineContext {
    searchText: string,
    studiesWithDatasets: any,
}

export const FILTER_STATES = {
    IDLE: 'idle',
    READY: 'ready'
}

export const FILTER_EVENTS = {
    CHANGE_SEARCH_TEXT: 'change_search_text',
    SET_STUDIES_DATA: 'set_studies_data',
    CHANGE_STUDIES: 'change_studies',
    CHANGE_DATASETS: 'change_datasets',
    RESET: 'reset'
}

export const createStudiesDatasetsFilterMachine = () => {
    const machine = createMachine({
        id: 'snapshot',
        initial: FILTER_STATES.IDLE,
        schema: {
            context: {} as FilterMachineContext,
            events: {} as { type: string; payload: any }
        },
        context: {searchText: '', studiesWithDatasets: {}},
        // @ts-ignore
        states: {
            [FILTER_STATES.IDLE]: {
                on: {
                    [FILTER_EVENTS.SET_STUDIES_DATA]: {
                        target: FILTER_STATES.READY,
                        actions: assign({
                            studiesWithDatasets: (context, event: any) => {
                                const {data} = event.payload
                                const studiesWithDatasets = R.pipe(
                                    data.studies,
                                    R.map(({studyID, rawDatasets}): [string, any] => ([
                                        studyID,
                                        R.fromPairs(R.map(rawDatasets, (rd: any): [string, boolean] => [rd.generatedCuratedDataset.curatedDatasetID, false]))
                                    ])),
                                    R.fromPairs
                                )
                                return studiesWithDatasets
                            }
                        })
                    }
                }
            },
            [FILTER_STATES.READY]: {
                on: {
                    [FILTER_EVENTS.CHANGE_SEARCH_TEXT]: {
                        target: FILTER_STATES.READY,
                        actions: assign({
                            searchText: (context: any, event: any) => event.payload.searchText
                        })
                    },
                    [FILTER_EVENTS.CHANGE_STUDIES]: {
                        target: FILTER_STATES.READY,
                        actions: assign({
                            studiesWithDatasets: (context: any, event: any) => {
                                const {selectedStudies} = event.payload
                                const {studiesWithDatasets} = context
                                // this will not work for when studies are selected, some of their datasets are unselected and a new study added
                                // need to do diff
                                const newStudiesWithDatasets = R.pipe(
                                    studiesWithDatasets,
                                    R.mapValues((studyDatasets, studyID) =>  R.mapValues(studyDatasets, (datasetSelected, datasetID) => selectedStudies.includes(studyID)))
                                )
                                console.log(newStudiesWithDatasets)
                                return newStudiesWithDatasets
                            },
                        })
                    },
                    [FILTER_EVENTS.CHANGE_DATASETS]: {
                        target: FILTER_STATES.READY,
                        actions: assign({
                            studiesWithDatasets: (context: any, event: any) => {
                                const {selectedDatasets} = event.payload
                                const {studiesWithDatasets} = context

                                const newStudiesWithDatasets = R.pipe(
                                    studiesWithDatasets,
                                    R.mapValues((studyDatasets, studyID) =>  R.mapValues(studyDatasets, (datasetSelected, datasetID) => selectedDatasets.includes(datasetID)))
                                )
                                console.log(newStudiesWithDatasets)
                                return newStudiesWithDatasets
                            },
                        })
                    },
                }
            },
        },
    }, {
    })

    return machine
}


export function useStudiesDatasetsFilterMachine () {
    const filterMachine = useMemo(() => createStudiesDatasetsFilterMachine(), [])
    const [current, send] = useMachine(filterMachine)
    return {filter: {state: current, send: send}}
}