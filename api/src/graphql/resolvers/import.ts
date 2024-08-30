import { ApolloError } from "apollo-server"

export const resolvers = {
    Query: {},
    Mutation: {
        importDataFromCSVFile: async (_obj, _args, { driver }) => {
            const session = driver.session()
            try {
                const sourceFile = 'file:///data.csv'

                const importDataFromCSVFile = await session.run(
                    `CALL apoc.load.csv("${sourceFile}", { sep:";", header: true }) YIELD map AS row
                    WITH row
                    MATCH (f:Form)
                    WHERE f.form_name IN ["Donor","Sample Registration","Exposure","Biomarker","Comorbidity","Follow Up","Primary Diagnosis","Specimen","Treatment","Systemic Therapy","Surgery","Radiation"]
                    WITH f, row
                    WITH
                        CASE
                            WHEN f.form_name = "Donor" THEN 'donor_ops'
                            WHEN f.form_name = "Sample Registration" THEN 'sample_ops'
                            WHEN f.form_name = "Exposure" THEN 'exposure_ops'
                            WHEN f.form_name = "Biomarker" THEN 'biomarker_ops'
                            WHEN f.form_name = "Comorbidity" THEN 'comorbidity_ops'
                            WHEN f.form_name = "Follow Up" THEN 'followup_ops'
                            WHEN f.form_name = "Primary Diagnosis" THEN 'diagnosis_ops'
                            WHEN f.form_name = "Specimen" THEN 'specimen_ops'
                            WHEN f.form_name = "Treatment" THEN 'treatment_ops'
                            WHEN f.form_name = "Systemic Therapy" THEN 'therapy_ops'
                            WHEN f.form_name = "Surgery" THEN 'surgery_ops'
                            WHEN f.form_name = "Radiation" THEN 'radiation_ops'
                        END AS operation, f, row
                    MERGE (k:KeycloakUser {email: "importer@localhost.localdomain", keycloakUserID: '1ce45fcd-0f09-4250-964d-39c8dbb22575', name: 'Importer User'})
                    MERGE (p:Patient {patient_id: row.submitter_donor_id, program_id: row.program_id, study: row.study})
                    CREATE (s:Submission {submission_id: apoc.create.uuid(), form_id: f.form_id}), (s)-[:SUBMITTED_BY]->(k)
                    WITH operation, row, k, s, p,
                        CASE
                            WHEN operation = 'donor_ops' THEN [
                                "gender", "sex_at_birth", 'date_of_birth',
                                'lost_to_followup_after_clinical_event_identifier', 
                                'lost_to_followup_reason', 'date_alive_after_lost_to_followup',
                                'cause_of_death', 'date_of_death', 'comments_donor',
                                'submitter_donor_id', 'program_id'
                            ]
                            WHEN operation = 'sample_ops' THEN [
                                'specimen_tissue_source', 'tumour_normal_designation', 'specimen_type',
                                'sample_type', 'submitter_donor_id', 'program_id',
                                'submitter_specimen_id', 'submitter_sample_id'
                            ]
                            WHEN operation = 'exposure_ops' THEN [
                                'tobacco_smoking_status', 'tobacco_type', 'pack_years_smoked'
                            ]
                            WHEN operation = 'biomarker_ops' THEN [
                                'psa_level', 'ca125', 'cea', 'er_status', 'er_percent_positive',
                                'her2_ihc_status', 'her2_ish_status', 'hpv_ihc_status', 'hpv_pcr_status',
                                'hpv_strain', 'comments_biomarker', 'submitter_follow_up_id',
                                'submitter_treatment_id', 'submitter_specimen_id'
                            ]
                            WHEN operation = 'comorbidiy_ops' THEN [
                                'prior_malignancy', 'laterality_of_prior_malignancy', 'age_at_comorbidity_diagnosis',
                                'comorbidity_type_code', 'comorbidity_treatment_status', 'comorbidity_treatment',
                                'comments_comorbidity'
                            ]
                            WHEN operation = 'followup_ops' THEN [
                                'submitter_follow_up_id',
                                'date_of_followup',
                                'disease_status_at_followup',
                                'relapse_type',
                                'date_of_relapse',
                                'method_of_progression_status',
                                'anatomic_site_progression_or_recurrence',
                                'comments_followup',
                                'submitter_follow_up_id',
                                'submitter_treatment_id',
                                'submitter_specimen_id',
                                'submitter_primary_diagnosis_id'
                            ]
                            WHEN operation = 'diagnosis_ops' THEN [
                                'submitter_primary_diagnosis_id',
                                'type_of_diagnosis',
                                'date_of_diagnosis',
                                'cancer_type_code',
                                'primary_site',
                                'basis_of_diagnosis',
                                'laterality',
                                'clinical_tumour_staging_system',
                                'clinical_t_category',
                                'clinical_n_category',
                                'clinical_m_category',
                                'clinical_stage_group',
                                'pathological_tumour_staging_system',
                                'pathological_t_category',
                                'pathological_n_category',
                                'pathological_m_category',
                                'pathological_stage_group',
                                'comments_primary_diagnosis'
                            ]
                            WHEN operation = 'specimen_ops' THEN [
                                'submitter_specimen_id', 'specimen_processing', 'specimen_laterality', 'specimen_collection_date',
                                'cancer_status_at_collection', 'specimen_storage', 'tumour_histological_type',
                                'specimen_anatomic_location', 'reference_pathology_confirmed_diagnosis',
                                'reference_pathology_confirmed_tumour_presence', 'tumour_grading_system',
                                'tumour_grade', 'percent_tumour_cells_range', 'percent_tumour_cells_measurement_method',
                                'comments_specimen', 'submitter_treatment_id', 'submitter_primary_diagnosis_id'
                            ]
                            WHEN operation = 'treatment_ops' THEN [
                                'submitter_treatment_id', 'treatment_type', 'is_primary_treatment', 'treatment_start_date',
                                'treatment_end_date', 'status_of_treatment', 'treatment_intent', 'response_to_treatment_criteria_method',
                                'response_to_treatment', 'comments_treatment', 'submitter_primary_diagnosis_id'
                            ]
                            WHEN operation = 'therapy_ops' THEN [
                                'submitter_treatment_id', 'systemic_therapy_type', 'start_date', 'end_date',
                                'drug_reference_database', 'drug_reference_identifier', 'drug_name', 'drug_dose_units',
                                'days_per_cycle', 'number_of_cycles', 'prescribed_cumulative_drug_dose',
                                'actual_cumulative_drug_dose', 'comments_systemic_therapy','submitter_donor_id',
                                'program_id'
                            ]
                            WHEN operation = 'surgery_ops' THEN [
                                'surgery_reference_database', 'surgery_reference_identifier', 'surgery_type', 'surgery_site',
                                'surgery_location', 'tumour_length', 'tumour_width', 'greatest_dimension_tumour',
                                'tumour_focality', 'residual_tumour_classification', 'margin_types_involved',
                                'margin_types_not_involved', 'margin_types_not_assessed', 'lymphovascular_invasion',
                                'perineural_invasion', 'comments_surgery', 'submitter_treatment_id'
                            ]
                            WHEN operation = 'radiation_ops' THEN [
                                'radiation_therapy_modality', 'radiation_therapy_type', 'radiation_therapy_fractions',
                                'radiation_therapy_dosage', 'anatomical_site_irradiated', 'radiation_boost',
                                'reference_radiation_treatment_id', 'comments_radiation', 'submitter_treatment_id'
                            ]
                        END AS keys
                        WITH row, keys, s, p, [key IN keys WHERE row[key] IS NOT NULL AND row[key] <> ""] AS validKeys
                    FOREACH (key IN validKeys |
                        CREATE (v:FieldKeyValuePair {key: key, value: row[key]}),
                            (s)-[:HAS_VALUE]->(v)
                    )
                    WITH s, p
                    CREATE (s)-[:DATA_FOR]->(p)
                    RETURN p, s
                    `
                )
            } catch (error) {
                throw new ApolloError(`There was an error importing the data: ${error}`)
            } finally {
                await session.close()
            }
        }
    }
}