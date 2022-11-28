import { gql, useMutation, useQuery } from '@apollo/client'
import { useEffect, useReducer, useState } from 'react'

export default function useUpdateGeographyCityToStudy({ }) {
	const [mutation, { data, loading, error }] = useMutation(gql`
	mutation UpdateGeographyCityToStudy ($cityID: ID!, $studyID: ID!) {
		updateGeographyCityToStudy(cityID: $cityID, studyID: $studyID) {
				id
				cityID
				city
				country
				latitude
				longitude
			}
		}
	`)
	console.log(data, loading, error)
	return {mutation, data, loading, error}
}