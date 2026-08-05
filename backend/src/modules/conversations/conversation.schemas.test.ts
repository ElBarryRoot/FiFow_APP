import assert from 'node:assert/strict';
import test from 'node:test';
import { listMessagesSchema } from './conversation.schemas.js';

const conversationId = '00000000-0000-4000-8000-000000000001';

test('message pagination applies its default limit', () => {
  const result = listMessagesSchema.parse({
    body: undefined,
    params: { conversationId },
    query: {}
  });

  assert.equal(result.query.limit, 50);
  assert.equal(result.query.cursor, undefined);
});

test('message pagination accepts a UUID cursor and coerces the limit', () => {
  const cursor = '00000000-0000-4000-8000-000000000002';
  const result = listMessagesSchema.parse({
    body: undefined,
    params: { conversationId },
    query: { cursor, limit: '100' }
  });

  assert.equal(result.query.cursor, cursor);
  assert.equal(result.query.limit, 100);
});

test('message pagination rejects limits above 100', () => {
  const result = listMessagesSchema.safeParse({
    body: undefined,
    params: { conversationId },
    query: { limit: '101' }
  });

  assert.equal(result.success, false);
});
