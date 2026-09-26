export type AssignOs = 'windows' | 'macos' | 'linux';

export type AssignOptions = {
  user_name?: string;
  strategy_name?: string;
  device_group_name?: string;
  address_book_name?: string;
  address_book_tag?: string;
  address_book_alias?: string;
  address_book_password?: string;
  address_book_note?: string;
  note?: string;
  device_username?: string;
  device_name?: string;
};

/** Option order matches the RustDesk client's `--assign` documentation. */
export const ASSIGN_OPTION_KEYS: (keyof AssignOptions)[] = [
  'user_name',
  'strategy_name',
  'device_group_name',
  'address_book_name',
  'address_book_tag',
  'address_book_alias',
  'address_book_password',
  'address_book_note',
  'note',
  'device_username',
  'device_name',
];

const EXECUTABLE: Record<AssignOs, string> = {
  windows: '"C:\\Program Files\\RustDesk\\rustdesk.exe"',
  macos: 'sudo /Applications/RustDesk.app/Contents/MacOS/RustDesk',
  linux: 'sudo rustdesk',
};

/** Quote one argument for cmd.exe / a POSIX shell. */
export function quoteArg(value: string, os: AssignOs): string {
  if (os === 'windows') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildAssignCommand(
  os: AssignOs,
  token: string,
  options: AssignOptions,
): string {
  const parts = [EXECUTABLE[os], '--assign', '--token', quoteArg(token, os)];
  for (const key of ASSIGN_OPTION_KEYS) {
    const value = options[key]?.trim();
    if (value) parts.push(`--${key}`, quoteArg(value, os));
  }
  return parts.join(' ');
}
