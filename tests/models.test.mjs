import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supportsNoiseControl } from '../src/lib/models.ts';

test('Pro controls remain reachable before mode and model reports arrive', () => {
  assert.equal(supportsNoiseControl(null, 'Daniel’s AirPods Pro #2'), true);
  assert.equal(supportsNoiseControl('A3063', 'Renamed earbuds'), true);
  assert.equal(supportsNoiseControl('A9999', 'AirPods Max'), true);
});
test('hardware identification takes precedence over nicknames', () => {
  assert.equal(supportsNoiseControl('A2564', 'AirPods Pro'), false);
  assert.equal(supportsNoiseControl('A1523', 'AirPods Pro'), false);
  assert.equal(supportsNoiseControl(null, 'Headphones'), false);
});
