import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import { verifyWebhookSignature } from './webhook-signature.js';

describe('signature des webhooks financiers', () => {
  const secret = 's'.repeat(64);
  const body = Buffer.from('{"status":"SUCCEEDED","amount":"125000"}');
  const signature = createHmac('sha256', secret).update(body).digest('hex');

  it('accepte la signature HMAC exacte avec ou sans préfixe', () => {
    assert.equal(verifyWebhookSignature(body, signature, secret), true);
    assert.equal(verifyWebhookSignature(body, `sha256=${signature}`, secret), true);
  });

  it('refuse un corps modifié et une signature issue d’un autre secret', () => {
    assert.equal(
      verifyWebhookSignature(Buffer.from(`${body.toString()} `), signature, secret),
      false
    );
    assert.equal(verifyWebhookSignature(body, signature, 'x'.repeat(64)), false);
  });

  it('refuse proprement les signatures absentes ou mal formées', () => {
    assert.equal(verifyWebhookSignature(undefined, signature, secret), false);
    assert.equal(verifyWebhookSignature(body, undefined, secret), false);
    assert.equal(verifyWebhookSignature(body, 'not-hex', secret), false);
    assert.equal(verifyWebhookSignature(body, '00'.repeat(31), secret), false);
  });
});
