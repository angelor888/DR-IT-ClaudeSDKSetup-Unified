import { ServiceError } from './service.error';

export class SlackError extends ServiceError {
  constructor(
    message: string,
    code: string = 'SLACK_ERROR',
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super('slack', message, code, statusCode, details);
  }
}

export class SlackAuthError extends SlackError {
  constructor(message: string = 'Slack authentication failed') {
    super(message, 'SLACK_AUTH_ERROR', 401);
  }
}

export class SlackRateLimitError extends SlackError {
  constructor(retryAfter?: number) {
    super(
      'Slack API rate limit exceeded',
      'SLACK_RATE_LIMIT',
      429,
      { retryAfter }
    );
  }
}

export class SlackChannelNotFoundError extends SlackError {
  constructor(channelId: string) {
    super(
      `Slack channel ${channelId} not found`,
      'SLACK_CHANNEL_NOT_FOUND',
      404,
      { channelId }
    );
  }
}

export class SlackUserNotFoundError extends SlackError {
  constructor(userId: string) {
    super(
      `Slack user ${userId} not found`,
      'SLACK_USER_NOT_FOUND',
      404,
      { userId }
    );
  }
}

export class SlackWebhookError extends SlackError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SLACK_WEBHOOK_ERROR', 400, details);
  }
}

export class SlackMessageError extends SlackError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SLACK_MESSAGE_ERROR', 400, details);
  }
}