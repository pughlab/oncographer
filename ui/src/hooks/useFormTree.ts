import { useQuery } from "@apollo/client"
import { FormTree } from "../components/form/dynamic_form/queries/form"
import { defaultStudy } from "../App"
import { usePatientID } from "../components/layout/context/PatientIDProvider"

export default function useFormTree() {
    const { study } = usePatientID()

    const { loading, error, data } = useQuery(FormTree, {
        variables: {
            study: study ?? defaultStudy
        }
    })

    return { loading, error, data }
}