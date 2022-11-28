import { gql, useMutation, useQuery } from '@apollo/client'
import { useEffect, useReducer, useState } from 'react'

export default function useSearchGeographyCitiesQuery({ }) {
	const initialState = { searchText: '', results: [] }
	const [state, dispatch] = useReducer((state: any, action: any) => {
		const { type, payload } = action
		switch (type) {
			case 'updateSearchText':
				return { searchText: payload.searchText, results: [] }
			case 'updateResults':
				return { ...state, results: payload.results }
			default:
				throw new Error()
		}
	}, initialState)
	const { data, loading, error } = useQuery(gql`
		query SearchGeographyCities ($name: String!) {
			searchGeographyCities(name: $name) {
				cityID
				country
				city
				latitude
				longitude
			}
		}
	`, { variables: { name: state.searchText }, skip: !state.searchText })
	useEffect(() => {
		if (!!data?.searchGeographyCities) {
			dispatch({ type: 'updateResults', payload: { results: data.searchGeographyCities } })
		}
	}, [data])
	return { state, dispatch, loading, error }
}