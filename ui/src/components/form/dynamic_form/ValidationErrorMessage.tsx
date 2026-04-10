import React from "react"
import { Message, List, ListItem, ListIcon, ListContent } from "semantic-ui-react"
import { useStudyLabels } from "../../../hooks/useLabels"
import { FormReducer, ValidationError } from "./types"

export default function ValidationErrorMessage({ reducer }: Readonly<{ reducer: FormReducer }>) {
  const labels = useStudyLabels()
  return (
    <Message negative>
      <Message.Header>Form has errors, please review:</Message.Header>
      <List>
        {
          reducer.validationErrors
            .filter((error: ValidationError) => error.type === 'required')
            .map((error: ValidationError) => (
              <ListItem key={`error-${error.field}`}>
                <ListIcon name="exclamation" />
                <ListContent>{`${labels[error.field]} is required`}</ListContent>
              </ListItem>
            )
          )
        }
        {
          reducer.mutexFields.length > 0 &&
          <ListItem key="error-mutex">
            <ListIcon name="exclamation" />
            <ListContent>{
              "Only one of " + reducer.validationErrors
                .filter((error: ValidationError) => error.type === 'mutex')
                .map((error: ValidationError) => error.field)
                .map((field: string) => labels[field])
                .join(', ') + " is needed"
            }</ListContent>
          </ListItem>
        }
      </List>
    </Message>
  )
}