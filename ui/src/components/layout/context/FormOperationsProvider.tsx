import React, { createContext, useContext, useState } from "react";
import { FormOperations } from "../../form/dynamic_form/types";

export const FormOperationsContext = createContext<FormOperations|undefined>(undefined)
export const UpdateFormOperationsContext = createContext<
  React.Dispatch<React.SetStateAction<FormOperations>> | undefined
>(undefined);

export function useFormOperations() {
  const formOperations = useContext(FormOperationsContext)

  if (formOperations === undefined) {
    throw new Error("useFormOperations must be used with a FormOperationsContext")
  }

  return formOperations
}

export function useUpdateFormOperations() {
  const setFormOperations = useContext(UpdateFormOperationsContext)

  if (setFormOperations === undefined) {
    throw new Error("useUpdateFormOperations must be used with an UpdateFormOperationsContext")
  }

  return setFormOperations
}

export function FormOperationsProvider({ children }: Readonly<{ children: any }>) {
  const [formOperations, setFormOperations] = useState({})

  return (
    <FormOperationsContext.Provider value={formOperations}>
      <UpdateFormOperationsContext.Provider value={setFormOperations}>
        {children}
      </UpdateFormOperationsContext.Provider>
    </FormOperationsContext.Provider>
  )
}