/** Placeholder for future auth middleware. */
export interface RequestUser {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
      user?: RequestUser;
    }
    interface Locals {
      /** Set by `aliasTopTours` so `getAll` can read a mutable, sanitized query. */
      apiQuery?: Record<string, string | undefined>;
    }
  }
}

export {};
