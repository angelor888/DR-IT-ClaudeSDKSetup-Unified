import { BaseError } from './base.error';

export interface ValidationErrorField {
  field: string;
  message: string;
  value?: any;
}

export class ValidationError extends BaseError {
  public readonly fields: ValidationErrorField[];

  constructor(message: string, fields: ValidationErrorField[]) {
    super(
      message,
      'VALIDATION_ERROR',
      422,
      { fields }
    );
    this.fields = fields;
  }

  static fromFieldErrors(errors: Record<string, string[]>): ValidationError {
    const fields: ValidationErrorField[] = [];
    
    for (const [field, messages] of Object.entries(errors)) {
      for (const message of messages) {
        fields.push({ field, message });
      }
    }
    
    return new ValidationError('Validation failed', fields);
  }
}