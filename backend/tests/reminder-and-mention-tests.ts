import assert from 'node:assert/strict';
import { extractMentionedEmails } from '../src/utils/commentMentions';

export function runReminderAndMentionTests() {
  const emails = extractMentionedEmails(
    'Please review this @owner@taskflow.demo and sync with @editor@taskflow.demo. Also cc @owner@taskflow.demo'
  );

  assert.deepEqual(emails, ['owner@taskflow.demo', 'editor@taskflow.demo']);
}
