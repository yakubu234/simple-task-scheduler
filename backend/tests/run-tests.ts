import assert from 'node:assert/strict';
import { hasRequiredRole, makeRequireProjectRole, roleOrder } from '../src/utils/permissions';
import { parseProjectIdsQuery } from '../src/utils/taskQueries';
import { runReminderAndMentionTests } from './reminder-and-mention-tests';

function createMockResponse() {
  return {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

async function runTest(name: string, testFn: () => void | Promise<void>) {
  try {
    await testFn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function main() {
  await runTest('role order matches expected collaboration hierarchy', () => {
    assert.deepEqual(roleOrder, ['viewer', 'editor', 'admin', 'owner']);
  });

  await runTest('hasRequiredRole respects role hierarchy', () => {
    assert.equal(hasRequiredRole('owner', 'viewer'), true);
    assert.equal(hasRequiredRole('admin', 'editor'), true);
    assert.equal(hasRequiredRole('editor', 'admin'), false);
    assert.equal(hasRequiredRole('viewer', 'viewer'), true);
    assert.equal(hasRequiredRole(null, 'viewer'), false);
  });

  await runTest('makeRequireProjectRole denies access when user has no role', async () => {
    const requireRole = makeRequireProjectRole(async () => null);
    const res = createMockResponse();

    const result = await requireRole(1, 2, 'viewer', res as any);

    assert.equal(result, null);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: 'Access denied' });
  });

  await runTest('makeRequireProjectRole denies access when role is too low', async () => {
    const requireRole = makeRequireProjectRole(async () => 'viewer');
    const res = createMockResponse();

    const result = await requireRole(1, 2, 'editor', res as any);

    assert.equal(result, null);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: 'Insufficient permissions' });
  });

  await runTest('makeRequireProjectRole allows access when role is sufficient', async () => {
    const requireRole = makeRequireProjectRole(async () => 'admin');
    const res = createMockResponse();

    const result = await requireRole(1, 2, 'editor', res as any);

    assert.equal(result, 'admin');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body, null);
  });

  await runTest('parseProjectIdsQuery parses comma-separated string ids', () => {
    const result = parseProjectIdsQuery('1, 2,3');
    assert.equal(result.normalizedProjectIds, '1, 2,3');
    assert.deepEqual(result.parsedIds, [1, 2, 3]);
  });

  await runTest('parseProjectIdsQuery parses array query values', () => {
    const result = parseProjectIdsQuery(['4', '5', '6']);
    assert.equal(result.normalizedProjectIds, '4,5,6');
    assert.deepEqual(result.parsedIds, [4, 5, 6]);
  });

  await runTest('parseProjectIdsQuery ignores invalid ids', () => {
    const result = parseProjectIdsQuery('abc,7,,NaN,8');
    assert.deepEqual(result.parsedIds, [7, 8]);
  });

  await runTest('parseProjectIdsQuery returns empty values for unsupported input', () => {
    const result = parseProjectIdsQuery(undefined);
    assert.equal(result.normalizedProjectIds, '');
    assert.deepEqual(result.parsedIds, []);
  });

  await runTest('extractMentionedEmails deduplicates valid email mentions', () => {
    runReminderAndMentionTests();
  });

  console.log('All backend tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
