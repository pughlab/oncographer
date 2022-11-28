import { gql, useMutation, useQuery } from '@apollo/client'
import { useEffect, useReducer, useState } from 'react'

export default function useStudiesQuery({ }) {
	const { data, loading, error } = useQuery(gql`
		query {
			studies {
				studyID
				fullName
				shortName
				description
				studySites {
					cityID
					city
					country
					latitude
					longitude
				}
			}
		}
	`, {fetchPolicy: 'network-only'})
	return { data, loading, error }
}