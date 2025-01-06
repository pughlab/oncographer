import React, { createContext, useContext } from "react";
import { ActiveSubmission } from "../../form/dynamic_form/types";
import { usePatientID } from "./PatientIDProvider";

export const ActiveSubmissionContext = createContext<
  ActiveSubmission | undefined
>(undefined);
export const UpdateActiveSubmissionContext = createContext<
  React.Dispatch<React.SetStateAction<ActiveSubmission>> | undefined
>(undefined);

export function useActiveSubmission() {
  const activeSubmission = useContext(ActiveSubmissionContext);

  if (activeSubmission === undefined) {
    throw new Error(
      "useActiveSubmission must be used with an ActiveSubmissionContext"
    );
  }

  return activeSubmission;
}

export function useUpdateActiveSubmission() {
  const setActiveSubmission = useContext(UpdateActiveSubmissionContext);

  if (setActiveSubmission === undefined) {
    throw new Error(
      "useUpdateActiveSubmission must be used with an UpdateActiveSubmissionContext"
    );
  }

  return setActiveSubmission;
}

export function ActiveSubmissionProvider({ children }: { children: any }) {
  const patientID = usePatientID();
  const [activeSubmission, setActiveSubmission] =
    React.useState<ActiveSubmission>({
      fields: [],
      submission_id: "",
      patient: patientID,
    });

  return (
    <ActiveSubmissionContext.Provider value={activeSubmission}>
      <UpdateActiveSubmissionContext.Provider value={setActiveSubmission}>
        {children}
      </UpdateActiveSubmissionContext.Provider>
    </ActiveSubmissionContext.Provider>
  );
}
