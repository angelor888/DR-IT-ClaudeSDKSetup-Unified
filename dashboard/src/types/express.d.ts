import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: DecodedIdToken & {
        id: string;
        roles?: string[];
        teamId?: string;
      };
    }
  }
}

export {};
