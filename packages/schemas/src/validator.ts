import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { workflowConfigSchema, WorkflowConfig } from "./workflow.schema";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validate = ajv.compile<WorkflowConfig>(workflowConfigSchema);

export interface ValidationResult {
    valid: boolean;
    errors: ErrorObject[];
}

export function validateWorkflowConfig(input: unknown): ValidationResult {
    const valid = validate(input);
    return {
        valid: Boolean(valid),
        errors: validate.errors ?? [],
    };
}
