import React, { createContext, useContext, useState } from "react";
import { LabelObject } from "../../form/dynamic_form/types";

export const LabelsContext = createContext<LabelObject | undefined>(undefined);
export const UpdateLabelsContext = createContext<
  React.Dispatch<React.SetStateAction<LabelObject>> | undefined
>(undefined);

export function useLabelsContext() {
  const labels = useContext(LabelsContext);

  if (labels === undefined) {
    throw new Error("useLabelsContext must be used within a LabelsContext");
  }

  return labels;
}

export function useUpdateLabelsContext() {
  const setLabels = useContext(UpdateLabelsContext);

  if (setLabels === undefined) {
    throw new Error(
      "useUpdateLabelsContext must be used within an UpdateLabelsContext"
    );
  }

  return setLabels;
}

export function LabelsProvider({ children }: Readonly<{ children: any }>) {
  const [labels, setLabels] = useState<LabelObject>({})

  return (
    <LabelsContext.Provider value={labels}>
      <UpdateLabelsContext.Provider value={setLabels}>
        { children }
      </UpdateLabelsContext.Provider>
    </LabelsContext.Provider>
  )
}
