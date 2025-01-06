import { FieldValue, Form, FormOperations, PatientID } from "../types";
import {
  CreateSubmission,
  CreateTemplate,
  CreateUserSubmissionConnection,
  DeleteDraft,
  FindDraft,
  FindOrCreatePatient,
  UpdateOrCreateDraft,
} from "../queries/form";
import { ApolloClient } from "@apollo/client";
import { getFilledFields } from "./field";

export async function submitForm(
  form: Form,
  values: { [key: string]: FieldValue },
  draftID: string,
  gqlClient: ApolloClient<object>,
  patientID: PatientID,
  formOperations: FormOperations
) {
  const valuesToSubmit = getFilledFields(values);
  const submissionInput = {
    form_id: form.formID,
    patient: {
      connect: {
        where: {
          node: {
            patient_id: patientID.submitter_donor_id,
            program_id: patientID.program_id,
            study: patientID.study,
          },
        },
      },
    },
    fields: {
      create: valuesToSubmit.map(function (key: string) {
        return {
          node: {
            key: key,
            value: values[key],
          },
        };
      }),
    },
  };
  const { clearDraftDate, clearDraftId, updateSubmissionDate } = formOperations;

  if (!(clearDraftDate && clearDraftId && updateSubmissionDate)) {
    return;
  }

  const patientMutation = await gqlClient.mutate({
    mutation: FindOrCreatePatient,
    variables: {
      patient_id: patientID.submitter_donor_id,
      program_id: patientID.program_id,
      study: patientID.study,
    },
  });
  if (patientMutation.data?.findOrCreatePatient) {
    // submit only if patient was successfully found or created
    const submissionQuery = await gqlClient.mutate({
      mutation: CreateSubmission,
      variables: {
        input: submissionInput,
      },
    });

    const submissionID: string =
      submissionQuery.data.createSubmissions.submissions[0].submission_id;
    const postCreateMutations: { mutation: Promise<any>; label: string }[] = [];
    postCreateMutations.push({
      mutation: gqlClient.mutate({
        mutation: DeleteDraft,
        variables: {
          where: {
            draft_id: draftID,
          },
        },
      }),
      label: "DeleteDraft",
    });
    postCreateMutations.push({
      label: "ConnectUser",
      mutation: gqlClient.mutate({
        mutation: CreateUserSubmissionConnection,
        variables: {
          submissionID,
        },
      }),
    });
    const postCreateResults = await Promise.allSettled(
      postCreateMutations.map(({ mutation }) => mutation)
    );
    postCreateResults.forEach((result, index) => {
      const { label } = postCreateMutations[index];
      if (result.status === "fulfilled") {
        if (label === "ConnectUser") {
          console.log(`Connected user to submission ${submissionID}`);
        } else {
          clearDraftId();
          clearDraftDate();
          console.log("Draft has been deleted");
        }
      } else if (label === "ConnectUser") {
        console.log("Could not connect user to submission");
      }
    });
    updateSubmissionDate();
    console.log("Form submitted!");
  }
}

export async function saveTemplate(
  form: Form,
  values: { [key: string]: FieldValue },
  gqlClient: ApolloClient<object>,
  patientID: PatientID,
  formOperations: FormOperations
) {
  const { updateTemplateDate } = formOperations;

  if (!updateTemplateDate) {
    return;
  }
  const filledFields = getFilledFields(values)
  const templateData: {[key: string]: FieldValue} = {}

  filledFields.forEach(fieldName => {
    templateData[fieldName] = values[fieldName]
  })
  await gqlClient.mutate({
    mutation: CreateTemplate,
    variables: {
      input: {
        form_id: form.formID,
        data: JSON.stringify(templateData),
        patient_id: JSON.stringify(patientID),
      },
    },
  });

  updateTemplateDate();
  console.log("Template saved");
}

export async function loadDraft(
  form: Form,
  gqlClient: ApolloClient<object>,
  patientID: PatientID,
  formOperations: FormOperations
) {
  const { fillForm, updateDraftId } = formOperations;

  const draftQuery = await gqlClient.query({
    query: FindDraft,
    variables: {
      where: {
        form_id: form.formID,
        patient_id: JSON.stringify(patientID),
      },
    },
  });
  const data = draftQuery.data?.formDrafts || [];

  if (data.length > 0 && fillForm && updateDraftId) {
    fillForm(JSON.parse(data[0].data));
    updateDraftId(data[0].draft_id);
  }
}

export async function saveDraft(
  form: Form,
  values: { [key: string]: FieldValue },
  lastUpdate: Date,
  gqlClient: ApolloClient<object>,
  patientID: PatientID,
  formOperations: FormOperations
) {
  const { updateDraftId, updateDraftDate } = formOperations;

  if (!(updateDraftId && updateDraftDate)) {
    return;
  }

  try {
    const date = new Date();
    const millisecondsDifference = date.getTime() - lastUpdate?.getTime() || 0;
    const secondsDifference = millisecondsDifference / 1000;

    if (secondsDifference >= 10 || !lastUpdate) {
      const filledFields = getFilledFields(values)
      const draftData: {[key: string]: FieldValue} = {}

      filledFields.forEach(fieldName => {
        draftData[fieldName] = values[fieldName]
      })
      const { data: draft } = await gqlClient.mutate({
        mutation: UpdateOrCreateDraft,
        variables: {
          input: {
            form_id: form.formID,
            data: JSON.stringify(draftData),
            patient_id: JSON.stringify(patientID),
          },
        },
      });
      updateDraftId(draft.updateOrCreateDraft.draft_id);
      updateDraftDate();
      console.log("Draft saved");
    }
  } catch (error: any) {
    console.log(`Error while saving draft: ${error.message}`);
  }
}
