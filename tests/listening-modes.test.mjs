import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listeningModes } from '../src/lib/listening-modes.ts';

test('adaptive hardware has one three-way Transparency/Adaptive/ANC selector', () => {
  const modes = listeningModes(true);
  assert.equal(modes.length, 3);
  assert.deepEqual(modes.map(mode => mode.value), [3, 4, 2]);
});
test('older hardware keeps Off in the centre and does not receive Adaptive commands', () => {
  const modes = listeningModes(false);
  assert.equal(modes.length, 3);
  assert.deepEqual(modes.map(mode => mode.value), [3, 1, 2]);
});
