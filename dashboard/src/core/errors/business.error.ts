import { BaseError } from './base.error';

export class BusinessLogicError extends BaseError {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, code, 400, details);
  }
}

export class ResourceNotFoundError extends BaseError {
  constructor(resource: string, id?: string, details?: Record<string, any>) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;

    super(message, 'RESOURCE_NOT_FOUND', 404, { ...details, resource, id });
  }
}

export class ResourceAlreadyExistsError extends BaseError {
  constructor(resource: string, field?: string, value?: string, details?: Record<string, any>) {
    const message =
      field && value
        ? `${resource} with ${field} '${value}' already exists`
        : `${resource} already exists`;

    super(message, 'RESOURCE_EXISTS', 409, { ...details, resource, field, value });
  }
}

export class InvalidOperationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'INVALID_OPERATION', 400, details);
  }
}
