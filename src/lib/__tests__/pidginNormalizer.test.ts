import { normalizePidginGrammar, isLikelyPidgin } from '../pidginNormalizer';

test('normalize common pidgin pronoun mistakes', () => {
  expect(normalizePidginGrammar('Me dey kampe.')).toBe('I dey kampe.');
  expect(normalizePidginGrammar('Tell I wetin you want.')).toBe('Tell me wetin you want.');
  expect(normalizePidginGrammar('Give I the file')).toBe('Give me the file');
  expect(normalizePidginGrammar('I tell me')).toBe('I tell you');
  expect(normalizePidginGrammar('Me go do am')).toBe('I go do am');
});

test('isLikelyPidgin detects pidgin phrases', () => {
  expect(isLikelyPidgin('I dey kampe')).toBe(true);
  expect(isLikelyPidgin('Hello, how are you?')).toBe(false);
});

test('normalize preserves valid pidgin and handles negatives, imperatives, compound sentences', () => {
  // negatives
  expect(normalizePidginGrammar('Me no understand.')).toBe('I no understand.');
  expect(normalizePidginGrammar('I no sabi')).toBe('I no sabi');
  // imperatives
  expect(normalizePidginGrammar('Give I the file now.')).toBe('Give me the file now.');
  expect(normalizePidginGrammar('Show I the image.')).toBe('Show me the image.');
  // compound
  expect(normalizePidginGrammar('Me and am go there.')).toBe('Me and am go there.'); // idiomatic - preserve when ambiguous
  expect(normalizePidginGrammar('I go come, but me no sure.')).toBe('I go come, but I no sure.');
});

