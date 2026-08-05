import assert from 'node:assert/strict';
import test from 'node:test';
import { messageActivityUpdate, reopenConversationForBuyer } from './conversation.service.js';

test('reopening an existing conversation makes it visible to its buyer', () => {
  assert.deepEqual(reopenConversationForBuyer(), { buyerArchivedAt: null });
});

test('a buyer message restores visibility for both participants', () => {
  assert.deepEqual(messageActivityUpdate(true), {
    buyerArchivedAt: null,
    sellerArchivedAt: null,
    unreadCountSeller: { increment: 1 }
  });
});

test('a seller message restores visibility for both participants', () => {
  assert.deepEqual(messageActivityUpdate(false), {
    buyerArchivedAt: null,
    sellerArchivedAt: null,
    unreadCountBuyer: { increment: 1 }
  });
});
