import assert from 'node:assert/strict';
import {
  canEditRole,
  canManageProjectSettings,
  canManageTaskForProject,
  getProjectRoleMap,
  getRoleLabel,
} from '../../src/lib/projectRoles';
import type { ProjectUI } from '../../src/types/database';

async function runTest(name: string, testFn: () => void | Promise<void>) {
  try {
    await testFn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const demoProjects: ProjectUI[] = [
  {
    id: '1',
    name: 'Owner Project',
    color: '#2563eb',
    ownerId: '1',
    currentRole: 'owner',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
  {
    id: '2',
    name: 'Viewer Project',
    color: '#0ea5e9',
    ownerId: '5',
    currentRole: 'viewer',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
];

async function main() {
  await runTest('getRoleLabel formats role names', () => {
    assert.equal(getRoleLabel('owner'), 'Owner');
    assert.equal(getRoleLabel('admin'), 'Admin');
    assert.equal(getRoleLabel('editor'), 'Editor');
    assert.equal(getRoleLabel('viewer'), 'Viewer');
  });

  await runTest('canEditRole allows owner admin and editor', () => {
    assert.equal(canEditRole('owner'), true);
    assert.equal(canEditRole('admin'), true);
    assert.equal(canEditRole('editor'), true);
    assert.equal(canEditRole('viewer'), false);
    assert.equal(canEditRole(undefined), false);
  });

  await runTest('canManageProjectSettings allows owner and admin only', () => {
    assert.equal(canManageProjectSettings('owner'), true);
    assert.equal(canManageProjectSettings('admin'), true);
    assert.equal(canManageProjectSettings('editor'), false);
    assert.equal(canManageProjectSettings('viewer'), false);
  });

  await runTest('getProjectRoleMap returns project role lookup', () => {
    const roleMap = getProjectRoleMap(demoProjects);
    assert.equal(roleMap.get('1'), 'owner');
    assert.equal(roleMap.get('2'), 'viewer');
  });

  await runTest('canManageTaskForProject respects mapped role state', () => {
    const roleMap = getProjectRoleMap(demoProjects);
    assert.equal(canManageTaskForProject(roleMap, '1'), true);
    assert.equal(canManageTaskForProject(roleMap, '2'), false);
    assert.equal(canManageTaskForProject(roleMap, 'unknown'), false);
  });

  console.log('All frontend tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
