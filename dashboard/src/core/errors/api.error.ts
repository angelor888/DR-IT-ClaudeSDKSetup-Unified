import { BaseError } from './base.error';

export class ApiError extends BaseError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'API_ERROR',
    details?: Record<string, any>
  ) {
    super(message, code, statusCode, details);
  }
}
