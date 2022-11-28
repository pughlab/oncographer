import { gql, useMutation, useQuery } from '@apollo/client'
import { useEffect, useReducer, useState } from 'react'

export default function useStudyDetailsQuery({ studyID }: { studyID: string }) {
	const [study, setStudy] = useState()
	const { data, loading, error } = useQuery(gql`
		query StudyDetails ($studyID: ID!) {
			studies(where: {studyID: $studyID}) {
				studyID
				fullName
				shortName
				description
				studySites {
					city
					country
					latitude
					longitude
				}
			}
		}
	`, {
		variables: { studyID },
		fetchPolicy: 'network-only'
	})
	useEffect(() => {
		if (!!data?.studies && data.studies.length > 0) {
			setStudy(data.studies[0])
		}
	}, [data])
	return { study, loading, error }
}
