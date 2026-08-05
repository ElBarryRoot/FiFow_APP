import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from './auth.schemas.js';

describe('schémas d’authentification', () => {
  it('normalise l’email et accepte un mot de passe robuste', () => {
    const parsed = registerSchema.parse({
      body: {
        fullName: 'Aissatou Diallo',
        email: '  AISSATOU@EXAMPLE.COM ',
        password: 'FiFowSecure2026',
        passwordConfirmation: 'FiFowSecure2026',
        acceptedTerms: true
      },
      params: {},
      query: {}
    });
    assert.equal(parsed.body.email, 'aissatou@example.com');
  });

  it('refuse une inscription sans acceptation explicite des conditions', () => {
    const parsed = registerSchema.safeParse({
      body: {
        fullName: 'Aissatou Diallo',
        email: 'aissatou@example.com',
        password: 'FiFowSecure2026',
        passwordConfirmation: 'FiFowSecure2026',
        acceptedTerms: false
      },
      params: {},
      query: {}
    });
    assert.equal(parsed.success, false);
  });

  it('refuse les mots de passe faibles et les confirmations différentes', () => {
    for (const [password, confirmation] of [
      ['motdepasse', 'motdepasse'],
      ['SANSCHIFFRE', 'SANSCHIFFRE'],
      ['FiFowSecure2026', 'FiFowSecure2027']
    ]) {
      const parsed = registerSchema.safeParse({
        body: {
          fullName: 'Utilisateur Test',
          email: 'test@example.com',
          password,
          passwordConfirmation: confirmation,
          acceptedTerms: true
        },
        params: {},
        query: {}
      });
      assert.equal(parsed.success, false);
    }
  });

  it('normalise les emails de connexion et de récupération', () => {
    const login = loginSchema.parse({
      body: { email: ' TEST@EXAMPLE.COM ', password: 'secret' },
      params: {},
      query: {}
    });
    const forgot = forgotPasswordSchema.parse({
      body: { email: ' TEST@EXAMPLE.COM ' },
      params: {},
      query: {}
    });
    assert.equal(login.body.email, 'test@example.com');
    assert.equal(forgot.body.email, 'test@example.com');
  });

  it('applique la même politique au nouveau mot de passe', () => {
    const result = resetPasswordSchema.safeParse({
      body: {
        token: 'a'.repeat(40),
        password: 'faible',
        passwordConfirmation: 'faible'
      },
      params: {},
      query: {}
    });
    assert.equal(result.success, false);
  });

  it('valide un changement de mot de passe complet', () => {
    const result = changePasswordSchema.safeParse({
      body: {
        currentPassword: 'FiFowSecure2025',
        password: 'FiFowSecure2026',
        passwordConfirmation: 'FiFowSecure2026'
      },
      params: {},
      query: {}
    });
    assert.equal(result.success, true);
  });

  it('refuse un changement sans mot de passe actuel valide au format attendu', () => {
    for (const currentPassword of ['', 'a'.repeat(73)]) {
      const result = changePasswordSchema.safeParse({
        body: {
          currentPassword,
          password: 'FiFowSecure2026',
          passwordConfirmation: 'FiFowSecure2026'
        },
        params: {},
        query: {}
      });
      assert.equal(result.success, false);
    }
  });

  it('refuse la réutilisation du mot de passe actuel et une confirmation différente', () => {
    const reused = changePasswordSchema.safeParse({
      body: {
        currentPassword: 'FiFowSecure2026',
        password: 'FiFowSecure2026',
        passwordConfirmation: 'FiFowSecure2026'
      },
      params: {},
      query: {}
    });
    const mismatched = changePasswordSchema.safeParse({
      body: {
        currentPassword: 'FiFowSecure2025',
        password: 'FiFowSecure2026',
        passwordConfirmation: 'FiFowSecure2027'
      },
      params: {},
      query: {}
    });
    assert.equal(reused.success, false);
    assert.equal(mismatched.success, false);
  });
});
