import React, { useState, useReducer, useMemo, useEffect } from 'react'
import { gql, useQuery } from '@apollo/client'

import {useMachine} from '@xstate/react'
import { createQueryMachine, QUERY_EVENTS } from '../../machines/queryMachine';

import * as R from 'remeda'
import apolloClient from '../../apolloClient';

export default function useStudiesDatasetsQueryMachine () {
    const STUDIES_DATASETS_QUERY = gql`
        query StudiesDatasets {
            studies {
                fullName
                shortName
                studyID
                rawDatasets {
                    name
                    generatedCuratedDataset {
                        curatedDatasetID
                        dataVariablesAggregate {
                            count
                        }
                    }
                }
            }
        }
    `
    const srcInvoker = async (context: any, event: any) => {
        // console.log('event', event)
        try {
            const res = await apolloClient.query({query: STUDIES_DATASETS_QUERY, variables: context.variables})
            return res.data
        } catch (e) {
            throw e
        }
    }
    const queryMachine = useMemo(() => createQueryMachine({srcInvoker, initialVariables: {}}), [])
    const [currentQuery, sendQuery] = useMachine(queryMachine)

    useEffect(() => {
        sendQuery({type: QUERY_EVENTS.REFRESH})
    }, [])
    return {
        query: {state: currentQuery, send: sendQuery},
    }


}