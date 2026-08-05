declare global {
  namespace Express {
    interface Request {
      requestId: string;
      rawBody?: Buffer;
      validated?: unknown;
      auth?: {
        userId: string;
        sessionId: string;
        role: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
        emailVerified: boolean;
      };
    }
  }
}

export {};
