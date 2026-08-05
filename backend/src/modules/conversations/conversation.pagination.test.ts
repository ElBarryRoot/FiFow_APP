import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChronologicalMessagePage } from './conversation.service.js';

test('message pagination returns each page in chronological order', () => {
  const databaseRows = [{ id: 'message-6' }, { id: 'message-5' }, { id: 'message-4' }, { id: 'message-3' }];

  const page = buildChronologicalMessagePage(databaseRows, 3);

  assert.deepEqual(
    page.items.map(({ id }) => id),
    ['message-4', 'message-5', 'message-6']
  );
  assert.equal(page.nextCursor, 'message-4');
  assert.equal(page.hasNextPage, true);
});

test('prepending the next page creates continuous history without duplicates', () => {
  const latestPage = buildChronologicalMessagePage(
    [{ id: 'message-6' }, { id: 'message-5' }, { id: 'message-4' }, { id: 'message-3' }],
    3
  );
  const olderPage = buildChronologicalMessagePage([{ id: 'message-3' }, { id: 'message-2' }, { id: 'message-1' }], 3);

  const history = [...olderPage.items, ...latestPage.items].map(({ id }) => id);

  assert.deepEqual(history, ['message-1', 'message-2', 'message-3', 'message-4', 'message-5', 'message-6']);
  assert.equal(new Set(history).size, history.length);
  assert.equal(olderPage.nextCursor, null);
  assert.equal(olderPage.hasNextPage, false);
});
