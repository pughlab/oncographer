import React from "react"
import { Button } from "semantic-ui-react"

export default function ActionsGroup(
  {disabled, send, saveTemplate}
  : Readonly<{disabled:boolean, send: (value: string) => void, saveTemplate: () => void}>)
{
  return (
    <Button.Group size="large" fluid widths={3}>
      <Button
        size='large' 
        onClick={ () => send('CLEAR') }
        fluid
        icon='trash'
        color='red'
        content='CLEAR FORM'
      />
      <Button.Or />
      <Button 
        content="SAVE TEMPLATE"
        color="black"
        icon="save"
        onClick={() => { saveTemplate() }
      }
      />
      <Button.Or />
      <Button icon="send" content="FINALIZE" color="teal"
        disabled={disabled}
        onClick={() => { send('SUBMIT') }}
      />
    </Button.Group>
  )
}