/**
 * Unit tests for the broker/agent signature payload helper.
 *
 * Run with:
 *   npx ts-node --transpile-only \
 *     -O '{"module":"commonjs","moduleResolution":"node","customConditions":null}' \
 *     lib/api/agentSignaturePayload.test.ts
 *
 * The compiler options override is needed because the project tsconfig
 * extends `expo/tsconfig.base`, which sets `module: "preserve"` and
 * `customConditions` — both incompatible with ts-node's CommonJS runner.
 * Uses node:assert + a tiny ad-hoc runner so it works without adding a test
 * framework dep — the rest of the repo currently has no Jest setup.
 */

import * as assert from 'node:assert/strict';
import {
  EmptySignatureError,
  buildAgentSignaturePayload,
} from './agentSignaturePayload';

type Test = [name: string, run: () => void];

const tests: Test[] = [
  ['returns null for empty string', () => {
    assert.equal(buildAgentSignaturePayload(''), null);
  }],
  ['returns null for whitespace-only string', () => {
    assert.equal(buildAgentSignaturePayload('   \n  '), null);
  }],
  ['returns null for non-string input', () => {
    assert.equal(buildAgentSignaturePayload(undefined), null);
    assert.equal(buildAgentSignaturePayload(null), null);
    assert.equal(buildAgentSignaturePayload(42 as unknown), null);
  }],
  ['returns null when the resulting data URL is shorter than 32 chars', () => {
    // Backend threshold: signatureData.length < 32 => `missing_signature`.
    // "data:image/png;base64," is 22 chars on its own.
    assert.equal(buildAgentSignaturePayload('a'), null);
  }],
  ['wraps raw base64 in a PNG data URL', () => {
    const longBase64 = 'A'.repeat(64);
    const out = buildAgentSignaturePayload(longBase64);
    assert.ok(out, 'expected a string payload');
    assert.equal(
      out,
      `data:image/png;base64,${longBase64}`,
      'raw base64 should be wrapped in a data URL prefix',
    );
  }],
  ['passes a full data URL through unchanged', () => {
    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const out = buildAgentSignaturePayload(dataUrl);
    assert.equal(out, dataUrl);
  }],
  ['trims surrounding whitespace before deciding emptiness', () => {
    const longBase64 = '  ' + 'B'.repeat(64) + '\n';
    const out = buildAgentSignaturePayload(longBase64);
    assert.ok(out);
    assert.ok(out!.startsWith('data:image/png;base64,'));
    assert.ok(!out!.includes(' '));
  }],
  ['EmptySignatureError carries a recognizable name', () => {
    const err = new EmptySignatureError();
    assert.equal(err.name, 'EmptySignatureError');
    assert.ok(err instanceof Error);
  }],
];

let failed = 0;
for (const [name, run] of tests) {
  try {
    run();
    process.stdout.write(`ok  ${name}\n`);
  } catch (err) {
    failed += 1;
    process.stdout.write(`FAIL ${name}\n`);
    console.error(err);
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log(`\n${tests.length} test(s) passed`);
}
