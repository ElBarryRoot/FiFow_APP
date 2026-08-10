import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { NextFunction, Request, Response } from 'express';

describe('requireVerifiedEmail', () => {
  it('autorise la poursuite en développement même si l’email n’est pas vérifié', async () => {
    process.env['NODE_ENV'] = 'development';
    const { requireVerifiedEmail } = await import('./auth.middleware.js');

    let nextError: unknown;
    let nextCalled = false;
    const next: NextFunction = (error?: unknown) => {
      nextCalled = true;
      nextError = error;
    };

    const request = {
      auth: {
        userId: 'user-1',
        sessionId: 'session-1',
        role: 'USER',
        emailVerified: false
      }
    } as unknown as Request;
    requireVerifiedEmail(request, {} as Response, next);

    assert.equal(nextCalled, true);
    assert.equal(nextError, undefined);
  });
});
