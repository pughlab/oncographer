import { useQuery } from "@apollo/client";
import { getForms } from "../form/queries/query";
import { FormGenerator } from "../form/FormGenerator";
import { Segment, Tab, Message, Image } from "semantic-ui-react";
import * as React from 'react'
import logo from '../logos/logo.png'
import * as R from 'remeda'



export default function FormFactory({patientIdentifier}) {
  const { loading, error, data } = useQuery(getForms);
  if (loading) {
    return (
    <>
    <Segment loading style={{height: '100%'}}>
      <Image src={logo} centered size='medium' />
    </Segment>
    </>
  )
  }

  if (error) {
    return (
  <>
  <Message warning>
  <Message.Header>Something went wrong</Message.Header>
    <p>Restart the page, then try again.</p>
  </Message>
  </> 
  )
  }

  if (R.isNil(data)) {
    return null
  }

  //WIP - ordering needs to be changed to the query
  let newData ={forms: null}
  if (data) {
  newData.forms = [data.forms[2], data.forms[0], data.forms[3], data.forms[1], data.forms[5], data.forms[6], data.forms[7], data.forms[8], data.forms[9], data.forms[4], data.forms[10], data.forms[11]]
  }
  const paneData = newData.forms.map(form => ({
    id: form.form_id,
    name: form.form_name,
    displayName: form.form_name,
    content: () => (
      <FormGenerator metadata={form} patientIdentifier={patientIdentifier}/>
    )
  }))
  const panes = paneData.map((item) => {
    return { key: item.name, menuItem: item.displayName, render: () => <Tab.Pane>{item.content()}</Tab.Pane> }
  })
  return (
    <Segment>
      <Tab menu={{color:'teal', active: true, fluid: true, vertical: true, tabular: true }} panes={panes} />
    </Segment>
  );
}

// export default FormFactory;

