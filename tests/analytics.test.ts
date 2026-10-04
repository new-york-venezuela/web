// Ejecutar: bun test tests/analytics.test.ts
import { expect, test } from 'bun:test';
import { classifyTraffic } from '../src/scripts/analytics';

const h = 'www.alimentosnewyork.com';
const c = (referrer = '', search = '') => classifyTraffic({ referrer, search, hostname: h });

test('organic google', () => {
  expect(c('https://www.google.com/')).toEqual({ traffic_channel: 'organic_search', ai_source: '', search_engine: 'google' });
});
test('chatgpt via utm_source', () => {
  expect(c('', '?utm_source=chatgpt.com')).toMatchObject({ traffic_channel: 'ai_assistant', ai_source: 'chatgpt' });
});
test('perplexity / claude / gemini referrers', () => {
  expect(c('https://www.perplexity.ai/').ai_source).toBe('perplexity');
  expect(c('https://claude.ai/').ai_source).toBe('claude');
  expect(c('https://gemini.google.com/').traffic_channel).toBe('ai_assistant');
});
test('bing chat is copilot, bing search is organic', () => {
  expect(c('https://www.bing.com/chat?x=1').ai_source).toBe('copilot');
  expect(c('https://www.bing.com/search?q=a')).toMatchObject({ traffic_channel: 'organic_search', search_engine: 'bing' });
});
test('paid, email, social, referral, direct', () => {
  expect(c('https://www.google.com/', '?gclid=abc').traffic_channel).toBe('paid');
  expect(c('', '?utm_medium=email').traffic_channel).toBe('email');
  expect(c('https://l.facebook.com/').traffic_channel).toBe('social');
  expect(c('https://example.org/').traffic_channel).toBe('referral');
  expect(c('').traffic_channel).toBe('direct');
  expect(c(`https://${h}/x/`).traffic_channel).toBe('direct');
});
