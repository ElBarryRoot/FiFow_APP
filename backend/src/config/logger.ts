import { env } from './env.js';

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';
type Metadata = Record<string, unknown>;

const priorities: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};
const secretPattern = /password|secret|token|authorization|cookie|signature|providerKey/i;

function sanitize(value: unknown, key = '', depth = 0): unknown {
  if (secretPattern.test(key)) return '[REDACTED]';
  if (depth > 5) return '[MAX_DEPTH]';
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map((item) => sanitize(item, key, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitize(childValue, childKey, depth + 1)
      ])
    );
  }
  return value;
}

function write(level: LogLevel, message: string, metadata: Metadata = {}) {
  if (priorities[level] > priorities[env.LOG_LEVEL]) return;
  const safeMetadata = sanitize(metadata) as Metadata;
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...safeMetadata
  });
  const output = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  output.write(`${entry}\n`);
}

export const logger = {
  log: write,
  error: (message: string, metadata?: Metadata) => write('error', message, metadata),
  warn: (message: string, metadata?: Metadata) => write('warn', message, metadata),
  info: (message: string, metadata?: Metadata) => write('info', message, metadata),
  http: (message: string, metadata?: Metadata) => write('http', message, metadata),
  debug: (message: string, metadata?: Metadata) => write('debug', message, metadata)
};
