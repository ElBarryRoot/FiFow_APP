import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hashToken,
  parseDurationSeconds,
  randomToken,
  safeTokenEquals
} from './crypto.js';

describe('sécurité des jetons', () => {
  it('génère des jetons distincts avec une entropie suffisante', () => {
    const first = randomToken(48);
    const second = randomToken(48);
    assert.notEqual(first, second);
    assert.ok(first.length >= 64);
    assert.ok(second.length >= 64);
  });

  it('compare un jeton avec son hash sans accepter une autre valeur', () => {
    const token = randomToken();
    const hash = hashToken(token);
    assert.equal(safeTokenEquals(token, hash), true);
    assert.equal(safeTokenEquals(`${token}x`, hash), false);
  });

  it('convertit uniquement les durées explicitement supportées', () => {
    assert.equal(parseDurationSeconds('15m'), 900);
    assert.equal(parseDurationSeconds('7d'), 604_800);
    assert.throws(() => parseDurationSeconds('1 month'));
  });
});
