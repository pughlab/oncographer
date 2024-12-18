import { createContext, useContext } from "react";

export interface PatientID {
    submitter_donor_id: string,
    program_id: string,
    study: string
}

export const PatientIDContext = createContext<PatientID|undefined>(undefined)
export const UpdatePatientContext = createContext<React.Dispatch<React.SetStateAction<{
    submitter_donor_id: string;
    program_id: string;
    study: string;
}>>|undefined>(undefined)


export function usePatientID() {
    const patientID = useContext(PatientIDContext)

    if (patientID === undefined) {
        throw new Error('usePatientID must be used with a PatientIDContext')
    }

    return patientID
}

export function useUpdatePatientID() {
    const setPatientID = useContext(UpdatePatientContext)

    if (setPatientID === undefined) {
        throw new Error('useUpdatePatientID must be used with an UpdatePatientContext')
    }

    return setPatientID
}