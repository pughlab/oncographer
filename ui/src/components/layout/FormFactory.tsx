import * as React from 'react'
import * as R from 'remeda'
import { useQuery } from "@apollo/client";
import { Segment, List, Grid, Divider } from "semantic-ui-react";
import { Forms } from "../form/queries/query";
import { FormGenerator } from "../form/FormGenerator";
import { LoadingSegment } from '../common/LoadingSegment'
import { BasicErrorMessage } from '../common/BasicErrorMessage';
import { WelcomeMessage } from './WelcomeMessage';

function ListMenuItem({
  item,
  // setContent,
  patientIdentifier,
  setPatientIdentifier,
  activeItem,
  setActiveItem
}) {
  let finalItem = null

  const isActive = activeItem === item
  const hasSubForms = item.next_form.length > 0
  const isActiveAndHasSubForms = isActive && hasSubForms

  console.log(item)
  // if (!item.next_form) {
  //   finalItem = (
  //     <List.Item active={isActive}>
  //       <List.Icon name="file" />
  //       <List.Content>
  //         <a onClick={() => {
  //           setContent(
  //             <FormGenerator
  //               metadata={item}
  //               patientIdentifier={patientIdentifier}
  //               setPatientIdentifier={setPatientIdentifier}
  //             />
  //           )
  //           setActiveItem(item)
  //         }}>{item.form_name}</a>
  //       </List.Content>
  //     </List.Item>
  //   )
  // } else {
    finalItem = (
      <List.Item active={isActive}  >
        <List.Icon name={isActiveAndHasSubForms ? "folder open" : hasSubForms ? "folder open outline" : isActive ? "file alternate" : "file outline"} color={isActive ? 'teal' : 'grey'} />
        <List.Content>
          <a style={isActive ? { color: "#02B5AE" } : {}} onClick={() => {
            // setContent(
            //   <FormGenerator
            //     metadata={item}
            //     patientIdentifier={patientIdentifier}
            //     setPatientIdentifier={setPatientIdentifier}
            //   />
            // )
            setActiveItem(item)
          }}>{item.form_name}</a>
          <List.List>
            {
              item.next_form.map((subform) => {
                return <ListMenuItem
                  key={subform.form_id}
                  item={subform}
                  // setContent={setContent}
                  patientIdentifier={patientIdentifier}
                  setPatientIdentifier={setPatientIdentifier}
                  activeItem={activeItem}
                  setActiveItem={setActiveItem}
                />
              })
            }
          </List.List>
        </List.Content>
      </List.Item>
    )
  // }

  return finalItem
}

function ListMenu({ 
  items,
  // setContent,
  patientIdentifier,
  setPatientIdentifier,
  activeItem,
  setActiveItem
}) {
  const menuItems = items.map((item) => {
    return (
      <ListMenuItem
        key={item.form_id}
        item={item}
        // setContent={setContent} 
        patientIdentifier={patientIdentifier} 
        setPatientIdentifier={setPatientIdentifier} 
        activeItem={activeItem} 
        setActiveItem={setActiveItem}
      />
    )
  })

  return (
    <Segment basic>
    <List link size="large">
      {menuItems}
    </List>
    </Segment>
  )
}

export default function FormFactory({ patientIdentifier, setPatientIdentifier }) {
  const { loading, error, data } = useQuery(Forms)
  // const [ content, setContent ] = React.useState(<></>)
  const [ activeItem, setActiveItem ] = React.useState(null)
  
  // React.useEffect(() => setContent(
  //   data
  //   ? <FormGenerator
  //       metadata={activeItem !== null ? activeItem : data.forms[0]}
  //       patientIdentifier={patientIdentifier}
  //       setPatientIdentifier={setPatientIdentifier} />
  //   : <WelcomeMessage />
  // ), [patientIdentifier])

  if (loading) {
    return <LoadingSegment />
  }

  if (error) {
    return <BasicErrorMessage />
  }

  if (R.isNil(data)) {
    return null
  }

  return (
    <Segment>
      <Grid>
        <Grid.Column width={3}>
          <ListMenu
            items={data.forms}
            // setContent={setContent}
            patientIdentifier={patientIdentifier}
            setPatientIdentifier={setPatientIdentifier}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </Grid.Column>
        <Grid.Column width={13}>
          <FormGenerator
            metadata={activeItem !== null ? activeItem : data.forms[0]}
            patientIdentifier={patientIdentifier}
            setPatientIdentifier={setPatientIdentifier} />
        </Grid.Column>
      </Grid>
    </Segment>
  )
}
