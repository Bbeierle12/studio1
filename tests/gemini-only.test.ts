import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const SRC = path.join(process.cwd(), 'src');

/**
 * Files containing a code (non-comment) match for `pattern`. Comments are
 * excluded so migration notes explaining what was removed do not trip the guard.
 */
function grepSrc(pattern: string): string[] {
  let out: string;
  try {
    out = execSync(
      `grep -rnE ${JSON.stringify(pattern)} ${JSON.stringify(SRC)} --include=*.ts --include=*.tsx`,
      { encoding: 'utf8' }
    );
  } catch {
    // grep exits 1 when there are no matches.
    return [];
  }

  const files = out
    .split('\n')
    .filter(Boolean)
    .filter((line) => {
      const code = line.split(':').slice(2).join(':').trim();
      return !code.startsWith('//') && !code.startsWith('*') && !code.startsWith('/*');
    })
    .map((line) => path.relative(process.cwd(), line.split(':')[0]));

  return [...new Set(files)].sort();
}

/**
 * This app is Gemini-only. These guards fail loudly if an OpenAI dependency
 * creeps back into the source tree.
 */
describe('provider isolation: Gemini only', () => {
  it('imports no OpenAI SDK anywhere in src/', () => {
    const offenders = grepSrc("from '@ai-sdk/openai'|from \"openai\"|from 'openai'|require\\('openai'\\)");
    expect(offenders).toEqual([]);
  });

  it('references no OpenAI model ids in src/', () => {
    const offenders = grepSrc("['\"]gpt-[0-9]|whisper-1");
    expect(offenders).toEqual([]);
  });

  it('reads no OPENAI_* environment variables in src/', () => {
    const offenders = grepSrc('process\\.env\\.OPENAI_');
    expect(offenders).toEqual([]);
  });
});
