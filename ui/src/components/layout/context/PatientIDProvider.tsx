import React, { createContext, useContext, useState } from "react";
import { PatientID } from "../../form/dynamic_form/types";

const PatientIDContext = createContext<PatientID | undefined>(undefined);
const UpdatePatientIDContext = createContext<
  React.Dispatch<React.SetStateAction<PatientID>> | undefined
>(undefined);

export function usePatientID() {
  const patientID = useContext(PatientIDContext);

  if (patientID === undefined) {
    throw new Error("usePatientID must be used within a PatientIDContext");
  }

  return patientID;
}

export function useUpdatePatientID() {
  const setPatientID = useContext(UpdatePatientIDContext);

  if (setPatientID === undefined) {
    throw new Error(
      "useUpdatePatientID must be used within an UpdatePatientContext"
    );
  }

  return setPatientID;
}

export function PatientIDProvider({ children }: { children: any }) {
  const [patientID, setPatientID] = useState({
    submitter_donor_id: "",
    program_id: "",
    study: "",
  });

  return (
    <PatientIDContext.Provider value={patientID}>
      <UpdatePatientIDContext.Provider value={setPatientID}>
        {children}
      </UpdatePatientIDContext.Provider>
    </PatientIDContext.Provider>
  );
}
