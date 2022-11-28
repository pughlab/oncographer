import { Button, Form } from "semantic-ui-react";
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  CopyFormMutation,
  NodeExist,
  conditionalsHandler,
  ParseError,
  InputGraphQL,
  UpdateFormMutation,
} from "../utils";

// **Refactor**
export function AbstractButton({
  identifiers,
  data,
  info,
  onClear,
  populate,
  validator,
  relation,
  form,
  form_id,
  errorHandler,
  submission,
  setSubmission,
}) {
  // TODO override the getNode Qury if patient is clicked from table; cause this implies thet the Node Exist already
  const [getNode, { loading, error }] = useLazyQuery(NodeExist, {
    fetchPolicy: "network-only",
  });
  const [CreateNode] = useMutation(CopyFormMutation);
  const [UpdateNode] = useMutation(UpdateFormMutation);

  const catchError = (data) => {
    // =====================
    // Error Handler
    // =====================
    errorHandler({ error: [], errorMessage: {} });
    let catches = [];
    let messages = {};
    const form = data;
    form.forEach((value) => {
      // if the condition is not bounded by a conditional
      // or all the condtional are true implying that the field is on then
      let item = info[value.name];
      if (
        value.conditionals === "" ||
        (value.conditionals !== "" &&
          !conditionalsHandler(JSON.parse(value.conditionals), info))
      ) {
        if (value.type === "date") {
          item = new Date(item);
        } else if (value.type === "number") {
          item = parseInt(item === "" ? 0 : item);
        }
        let valid = validator[value.name].safeParse(item);
        if (!valid.success) {
          catches.push(value.name);
          messages[value.name] = ParseError(JSON.parse(valid.error));
        }
      }
    });

    // if there where any catches set the errors state and display the message and don't continue futher
    errorHandler({ error: catches, errorMessage: messages });
    return catches.length > 0;
  };

  if (loading) return null;

  if (error) alert("an error has occured");

  return (
    <Form.Group widths={"equal"}>
      <Form.Field
        fluid
        name="add"
        control={Button}
        onClick={() => {
          console.log(validator)
          if (catchError(data)) return; // do nothing if the catcheError method is return True

          getNode({
            variables: {
              form_id: form_id,
              label: populate,
              ...identifiers,
            },
          }).then((res) => {
            
            if (submission.type === "create") {
              if (res.data.form.length > 0) {
                if (relation === "1:1") {
                  alert("Do Nothing");
                  return;
                } else if (relation === "1:M") {
                  alert("Created Form Node **Only For Test**");
                  CreateNode({
                    variables: {
                      form_id: form_id,
                      ...identifiers,
                      info: InputGraphQL(info, data),
                    },
                  });
                  data.forEach((value) => {
                    onClear((feild) => ({ ...feild, [value.name]: "" }));
                  });
                  return;
                }
              } else {
                alert("Node does not exist; create node... **Only For Test**");
                CreateNode({
                  variables: {
                    form_id: form_id,
                    ...identifiers,
                    info: InputGraphQL(info, data),
                  },
                });
                data.forEach((value) => {
                  onClear((feild) => ({ ...feild, [value.name]: "" }));
                });
                return;
              }
            } else {
              alert("update");
              if (res.data.form.length > 0) {
                UpdateNode({
                  variables: {
                    form_id: form_id,
                    uuid: submission.id,
                    ...identifiers,
                    info: InputGraphQL(info, data),
                  },
                });
                data.forEach((value) => {
                  onClear((feild) => ({ ...feild, [value.name]: "" }));
                });
              }
            }
          });
        }}
      >
        Submit
      </Form.Field>
      <Form.Field
        fluid
        name="clear"
        control={Button}
        onClick={() => {
          data.forEach((value) => {
            onClear((feild) => ({ ...feild, [value.name]: "" }));
            setSubmission({ type: "create", id: "" });
          });
        }}
      >
        Clear
      </Form.Field>
    </Form.Group>
  );
}
