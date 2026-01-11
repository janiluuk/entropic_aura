const test = require('node:test');
const assert = require('node:assert');
const { getMoodFilters, isValidMood, listMoods } = require('../config/moods');

test('getMoodFilters returns filters for valid mood', () => {
  const filters = getMoodFilters('Relaxing');
  assert.ok(Array.isArray(filters));
  assert.ok(filters.length > 0);
  assert.ok(filters.some(f => f.includes('lowpass')));
});

test('getMoodFilters returns default for invalid mood', () => {
  const filters = getMoodFilters('NonExistentMood');
  assert.ok(Array.isArray(filters));
  assert.ok(filters.length > 0);
});

test('getMoodFilters returns different filters for different moods', () => {
  const relaxing = getMoodFilters('Relaxing');
  const energizing = getMoodFilters('Energizing');
  assert.notDeepStrictEqual(relaxing, energizing);
});

test('isValidMood returns true for valid moods', () => {
  assert.strictEqual(isValidMood('Relaxing'), true);
  assert.strictEqual(isValidMood('Energizing'), true);
  assert.strictEqual(isValidMood(''), true); // empty is valid (uses default)
});

test('isValidMood returns false for invalid moods', () => {
  assert.strictEqual(isValidMood('InvalidMood'), false);
  assert.strictEqual(isValidMood('random'), false);
});

test('listMoods returns array of available moods', () => {
  const moods = listMoods();
  assert.ok(Array.isArray(moods));
  assert.ok(moods.includes('Relaxing'));
  assert.ok(moods.includes('Energizing'));
  assert.ok(!moods.includes('default')); // default should not be in the list
});
