// Twilio module exports
export { TwilioClient } from './client';
export { TwilioService } from './service';
export * from './types';

import { TwilioService } from './service';

// Singleton service instance
let twilioService: TwilioService | null = null;

export function getTwilioService(): TwilioService {
  if (!twilioService) {
    twilioService = new TwilioService();
  }
  return twilioService;
}

// Reset function for testing
export function resetTwilioService(): void {
  twilioService = null;
}
