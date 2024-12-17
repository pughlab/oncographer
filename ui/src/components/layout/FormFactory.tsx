import * as React from 'react'
import * as R from 'remeda'
import { useQuery } from "@apollo/client";
import { Segment, List, Grid, SemanticICONS, SemanticCOLORS } from "semantic-ui-react";

import keycloak from '../../keycloak/keycloak'
import { FormTree } from "../form/dynamic_form/queries/form";
import { LoadingSegment } from '../common/LoadingSegment'
import { BasicErrorMessage } from '../common/BasicErrorMessage';
import { PatientFoundContext, PatientIdentifierContext } from '../Portal';
import { ParentSubmissionTable } from '../form/table/ParentSubmissionTable';
import { WelcomeMessage } from './WelcomeMessage';
import { PatientTable } from '../form/table/PatientTable';
import { DynamicForm } from '../form/dynamic_form/DynamicForm';
import { Form } from '../form/dynamic_form/types';

export const DisplayNamesContext = React.createContext({})
export const ActiveSubmissionContext = React.createContext({})

export function useDisplayNamesContext() {
  return React.useContext(DisplayNamesContext)
}

// helper functions
function compareForms(a, b) {
  let result = 0
  const aWeight = a.node.weight
  const bWeight = b.node.weight

  if (aWeight > bWeight) {
    result = 1
  } else if (aWeight < bWeight) {
    result = -1
  }
  return result
}

// components
function ListMenuItem({
  item,
  study,
  activeItem,
  setActiveItem
}) {

  const node = item.node ? item.node : item
  const isActive = activeItem === node 
  const hasSubForms = node.next_formConnection.edges.length > 0
  const isActiveAndHasSubForms = isActive && hasSubForms
  const itemBelongsToStudy = node.studies.includes(study)
  const subForms = [...node.next_formConnection.edges].sort(compareForms)
  let iconName : SemanticICONS = "file outline"
  let iconColor : SemanticCOLORS = "grey"

  if (isActiveAndHasSubForms) {
    iconName = "folder open"
  } else if (hasSubForms) {
    iconName = "folder open outline"
  } else if (isActive) {
    iconName = "file alternate"
    iconColor = "teal"
  }

  return itemBelongsToStudy
  ? (
    <List.Item active={isActive}  >
      <List.Icon name={iconName} color={iconColor} />
      <List.Content>
        <a style={isActive ? { color: "#02B5AE" } : {}} onClick={() => {
          setActiveItem(node)
        }}>{ node.label ? node.label[study] ?? node.label.default : node.name }</a>
        <List.List>
          {
            subForms.map((subform) => {
              const currentSubform = subform.node ? subform.node : subform
              return <ListMenuItem
                key={`${currentSubform.name}-${currentSubform.formID}`}
                item={subform}
                study={study}
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
            })
          }
        </List.List>
      </List.Content>
    </List.Item>
  )
  : <></>
}

function ListMenu({ 
  root,
  study,
  activeItem,
  setActiveItem
}) {
  const node = root.node ? root.node : root
  return (
    <Segment basic>
    <List link size="large">
      <ListMenuItem
        key={`${node.name}-${node.formID}`}
        item={node}
        study={study}
        activeItem={activeItem} 
        setActiveItem={setActiveItem}
      />
    </List>
    </Segment>
  )
}

// main component
export default function FormFactory() {
  const { patientIdentifier } = React.useContext(PatientIdentifierContext)
  const { patientFound } = React.useContext(PatientFoundContext)
  const [displayNames, setDisplayNames] = React.useState({})
  const patienIdentifierKeys = React.useMemo(() => Object.keys(patientIdentifier), [])
  const { loading, error, data } = useQuery(FormTree, {
    variables: {
      study: patientIdentifier.study
    }
  })
  const [ activeItem, setActiveItem ] = React.useState<Form|null>(null)
  const [activeSubmission, setActiveSubmission] = React.useState({})

  if (loading) {
    return <LoadingSegment />
  }

  if (error) {
    return <BasicErrorMessage />
  }

  if (R.isNil(data)) {
    return null
  }

  const root =  data.forms[0]
  const adminRoles = JSON.parse(process.env.KEYCLOAK_ADMIN_ROLES)
  const validStudy = patientIdentifier.study !== ""
  const roles = (
    keycloak?.tokenParsed?.resource_access[process.env.KEYCLOAK_SERVER_CLIENT]?.roles || []
  ).filter((role) => !adminRoles.includes(role))

  return (
    validStudy && roles.length > 0
    ? <Segment>
        <Grid>
          <Grid.Column width={3}>
            <ListMenu
              root={root}
              study={patientIdentifier.study}
              activeItem={activeItem}
              setActiveItem={setActiveItem}
            />
          </Grid.Column>
          {/* add empty column to provide spacing between the menu and the main content */}
          <Grid.Column width={1}/>
          {/* main content */}
          <Grid.Column width={12}>
            {
              patientFound && activeItem && activeItem !== root
              ? <DisplayNamesContext.Provider value={{displayNames, setDisplayNames}}>
                  <PatientTable patientIdentifier={patientIdentifier} />
                </DisplayNamesContext.Provider>
              : <></>
            }
            <ActiveSubmissionContext.Provider value={{activeSubmission, setActiveSubmission}}>
              {
                activeItem && activeItem !== root
                ? <ParentSubmissionTable 
                    key={activeItem.formID}
                    formID={activeItem.formID}
                    patientIdentifier={patientIdentifier}
                    displayNames={displayNames}
                  />
                : <></>
              }
              {
                validStudy && <DynamicForm key={activeItem ? activeItem.name : root.name} form={activeItem ?? root} excluded_fields={patienIdentifierKeys} /> 
              }
            </ActiveSubmissionContext.Provider>
          </Grid.Column>
        </Grid>
      </Segment>
      
    : <WelcomeMessage withRoles={roles.length > 0}/>
  )
}
