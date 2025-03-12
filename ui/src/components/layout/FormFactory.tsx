import * as React from "react";
import * as R from "remeda";
import {
  Segment,
  List,
  Grid,
  SemanticICONS,
  SemanticCOLORS,
  Divider,
  Modal,
  Header,
  Icon,
  Button,
} from "semantic-ui-react";

import keycloak from "../../keycloak/keycloak";
import { LoadingSegment } from "../common/LoadingSegment";
import { BasicErrorMessage } from "../common/BasicErrorMessage";
import { ParentSubmissionTable } from "../form/table/ParentSubmissionTable";
import { WelcomeMessage } from "./WelcomeMessage";
import { PatientTable } from "../form/table/PatientTable";
import { DynamicForm } from "../form/dynamic_form/DynamicForm";
import { FormModalProps, Form } from "../form/dynamic_form/types";
import { FormOperationsProvider } from "./context//FormOperationsProvider"
import useFormTree from "../../hooks/useFormTree";
import { ApolloError } from "@apollo/client";
import { TemplateTable } from "../form/table/TemplateTable";
import { SubmissionTable } from "../form/table/SubmissionTable";
import useRootForm from "../../hooks/useRootForm";
import { LabelsProvider } from "./context/LabelsProvider";
import { ActiveSubmissionProvider } from "./context/ActiveSubmissionProvider";
import { usePatientID } from "./context/PatientIDProvider";

// helper functions
function compareForms(a: any, b: any) {
  let result = 0;
  const aWeight = a.node.weight;
  const bWeight = b.node.weight;

  if (aWeight > bWeight) {
    result = 1;
  } else if (aWeight < bWeight) {
    result = -1;
  }
  return result;
}

// components
function ListMenuItem({ item, activeItem, setActiveItem }: any) {
  const { study } = usePatientID();
  const node = item.node ? item.node : item;
  const isActive = activeItem === node;
  const hasSubForms = node.next_formConnection.edges.length > 0;
  const isActiveAndHasSubForms = isActive && hasSubForms;
  const itemBelongsToStudy = node.studies.includes(study);
  const subForms = [...node.next_formConnection.edges].sort(compareForms);
  let iconName: SemanticICONS = "file outline";
  let iconColor: SemanticCOLORS = "grey";

  if (isActiveAndHasSubForms) {
    iconName = "folder open";
  } else if (hasSubForms) {
    iconName = "folder open outline";
  } else if (isActive) {
    iconName = "file alternate";
    iconColor = "teal";
  }

  return itemBelongsToStudy ? (
    <List.Item active={isActive}>
      <List.Icon name={iconName} color={iconColor} />
      <List.Content>
        <a
          href="#content"
          aria-label={node.label ? node.label[study] ?? node.label.default : node.name}
          style={isActive ? { color: "#02B5AE" } : {}}
          onClick={(e) => {
            e.preventDefault()
            setActiveItem(node);
          }}
        >
          {node.label ? node.label[study] ?? node.label.default : node.name}
        </a>
        <List.List>
          {subForms.map((subform) => {
            const currentSubform = subform.node ? subform.node : subform;
            return (
              <ListMenuItem
                key={`${currentSubform.name}-${currentSubform.formID}`}
                item={subform}
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
            );
          })}
        </List.List>
      </List.Content>
    </List.Item>
  ) : (
    <></>
  );
}

function ListMenu({ activeItem, setActiveItem }: any) {
  const {
    loading,
    error,
    data,
  }: {
    loading: boolean;
    error: ApolloError | undefined;
    data: { forms?: any };
  } = useFormTree();

  React.useEffect(() => {
    if (data && !activeItem) {
      setActiveItem(data.forms[0]);
    }
  }, [data]);

  if (loading) {
    return <LoadingSegment />;
  }

  if (error) {
    return <BasicErrorMessage />;
  }

  if (R.isNil(data)) {
    return null;
  }

  const root = data?.forms[0];
  const node = root.node ? root.node : root;

  return (
    <Segment basic>
      <List link size="large">
        <ListMenuItem
          key={`${node.name}-${node.formID}`}
          item={node}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />
      </List>
    </Segment>
  );
}

const FormModal: React.FC<FormModalProps> = ({
  open,
  onClose,
  title,
  content,
  error = false,
}) => {
  return (
    <Modal open={open} onClose={onClose} closeIcon>
      <Header icon>
        <Icon
          name={error ? "times circle" : "check circle"}
          color={error ? "red" : "green"}
        />
        {title}
      </Header>
      <Modal.Content>
        <p>{content}</p>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose} color="teal">
          <Icon name="close" /> Close
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

// main component
export default function FormFactory() {
  const patientID = usePatientID();
  const patienIdentifierKeys = React.useMemo(() => Object.keys(patientID), []);
  const [activeForm, setActiveForm] = React.useState<Form | null>(null);
  const [openModal, setOpenModal] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState("");
  const [modalContent, setModalContent] = React.useState("");
  const [modalError, setModalError] = React.useState<boolean | undefined>(
    false
  );
  const [templateUpdates, setTemplateUpdates] = React.useState<number>(0)
  const [submissionUpdates, setSubmissionUpdates] = React.useState<number>(0)
  const { data: rootForm } = useRootForm();
  const modalOperations = {
    setOpenModal,
    setModalTitle,
    setModalContent,
    setModalError,
  };

  const adminRoles = JSON.parse(process.env.KEYCLOAK_ADMIN_ROLES ?? "[]");
  const validStudy = patientID.study !== "";
  const roles = (
    keycloak?.tokenParsed?.resource_access?.[
      process.env.KEYCLOAK_SERVER_CLIENT ?? ""
    ]?.roles ?? []
  ).filter((role) => !adminRoles.includes(role));
  const isRootForm = rootForm?.GetRootForm?.formID === activeForm?.formID;

  return validStudy && roles.length > 0 ? (
    <Segment>
      <Grid>
        <Grid.Column width={3}>
          <ListMenu activeItem={activeForm} setActiveItem={setActiveForm} />
        </Grid.Column>
        {/* add divider to provide spacing between the menu and the main content */}
        <Divider vertical />
        {/* main content */}
        <Grid.Column width={12} id="content">
          <LabelsProvider>
            {patientID && activeForm && !isRootForm ? <PatientTable /> : <></>}
            <ActiveSubmissionProvider>
              <FormOperationsProvider>
                {activeForm && !isRootForm && (
                  <>
                    <Divider hidden />
                    <ParentSubmissionTable formID={activeForm?.formID} />
                  </>
                )}
                {activeForm && validStudy && (
                  <>
                    <Divider hidden />
                    <TemplateTable
                      formID={activeForm.formID}
                      modalOperations={modalOperations}
                      templateUpdates={templateUpdates}
                    />
                    <Divider hidden />
                    <SubmissionTable
                      formID={activeForm.formID}
                      modalOperations={modalOperations}
                      submissionUpdates={submissionUpdates}
                    />
                  </>
                )}
                {activeForm && validStudy && (
                  <>
                    <Divider hidden />
                    <DynamicForm
                      key={activeForm.name}
                      form={activeForm}
                      excluded_fields={patienIdentifierKeys}
                      modalOperations={modalOperations}
                      updateTemplates={() => {
                        setTemplateUpdates(templateUpdates + 1)
                      }}
                      updateSubmissions={() => {
                        setSubmissionUpdates(submissionUpdates + 1)
                      }}
                    />
                  </>
                )}
              </FormOperationsProvider>
            </ActiveSubmissionProvider>
          </LabelsProvider>
          <FormModal
            open={openModal}
            onClose={() => {
              setOpenModal(false);
            }}
            title={modalTitle}
            content={modalContent}
            error={modalError}
          />
        </Grid.Column>
      </Grid>
    </Segment>
  ) : (
    <WelcomeMessage withRoles={roles.length > 0} />
  );
}
