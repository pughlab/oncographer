import {atom, useAtom} from 'jotai'
import {addDays, addMonths, addYears, isSameDay, format} from 'date-fns'
import { gql, useQuery } from '@apollo/client'
import { useMemo } from 'react'

const today = new Date()
const endDateAtom = atom(today)
const startDateAtom = atom((get) => addDays(get(endDateAtom), -364))

export default function useRawDatasetCalendarHeatmapQuery () {
    const [endDate, setEndDate] = useAtom(endDateAtom)
    const [startDate] = useAtom(startDateAtom)
    const {data, loading, error} = useQuery(gql`
        query test ($startDate: Date!, $endDate: Date!) {
            rawDatasetCalendarHeatmap(
                startDate: $startDate,
                endDate: $endDate
            ) {
                date
                count
            }
        }
    `, {
        variables: {startDate, endDate}
    })
    const heatmapData = useMemo(() => {
        if (!data) {
            return []
        } else {
            const dateCounts = Object.fromEntries(data.rawDatasetCalendarHeatmap.map(({date, count}: {date: any, count: number}) => [date, count]))
            // console.log(dateCounts)
            return Array.from({ length: 365 }, (_, i) => i).map(index => {
                const date = format(addDays(endDate, -index), 'yyyy-MM-dd')
                return {
                    date,
                    count: dateCounts[date] ?? 0
                }
            })
        }
    }, [data])
    console.log(heatmapData)
    return {variables: {startDate, endDate, setEndDate}, heatmapData, loading}
}