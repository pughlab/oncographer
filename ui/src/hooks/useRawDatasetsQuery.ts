import { gql, useMutation, useQuery } from '@apollo/client'
import { useCallback, useState } from 'react'

export default function useRawDatasetsQuery({ }) {
  const [searchText, setSearchText] = useState('')
  const { data, loading, error } = useQuery(gql`
  query RawDatasets($searchText: String!) {
    rawDatasets (
      where: {OR :[{name_CONTAINS: $searchText}, {description_CONTAINS: $searchText}]}
    ) {
      rawDatasetID
      name
      description
      fromStudy {
        studyID
        shortName
      }
    }
  }`, { variables: { searchText }, fetchPolicy: 'network-only' })
  return { data, loading, error, searchText, setSearchText }
}