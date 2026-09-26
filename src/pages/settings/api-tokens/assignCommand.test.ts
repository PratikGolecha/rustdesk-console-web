import { expect, test } from '@jest/globals';
import { buildAssignCommand, quoteArg } from './assignCommand';

test('builds a Windows command with only the provided options, in order', () => {
  expect(
    buildAssignCommand('windows', 'rdc_abc_def', {
      user_name: 'alice',
      note: 'front desk',
      device_group_name: 'Sales',
      strategy_name: '  ',
    }),
  ).toBe(
    '"C:\\Program Files\\RustDesk\\rustdesk.exe" --assign --token "rdc_abc_def" --user_name "alice" --device_group_name "Sales" --note "front desk"',
  );
});

test('uses sudo and the platform binary on macOS and Linux', () => {
  expect(buildAssignCommand('macos', 't', { user_name: 'a' })).toBe(
    "sudo /Applications/RustDesk.app/Contents/MacOS/RustDesk --assign --token 't' --user_name 'a'",
  );
  expect(buildAssignCommand('linux', 't', { user_name: 'a' })).toBe(
    "sudo rustdesk --assign --token 't' --user_name 'a'",
  );
});

test('quotes shell metacharacters safely', () => {
  expect(quoteArg("it's $HOME", 'linux')).toBe(`'it'\\''s $HOME'`);
  expect(quoteArg('say "hi"', 'windows')).toBe('"say \\"hi\\""');
});
