import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const repoRoot = path.resolve(root, '..', '..');

const checks = [];

function check(name, run) {
  checks.push({ name, run });
}

function fail(message, details = []) {
  return { ok: false, message, details };
}

function pass(message) {
  return { ok: true, message };
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (
        [
          'node_modules',
          'dist',
          'coverage',
          '.vite',
          'locales',
          'playwright-report',
          'test-results'
        ].includes(entry)
      ) {
        continue;
      }

      walk(fullPath, files);
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function sourceFiles() {
  const roots = ['src', 'lib']
    .map((dir) => path.join(root, dir))
    .filter((dir) => existsSync(dir));

  return roots
    .flatMap((dir) => walk(dir))
    .filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file));
}

function read(filePath) {
  return readFileSync(filePath, 'utf8');
}

function matchingLines(filePath, regex) {
  return read(filePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => regex.test(line))
    .map(({ line, number }) => `${toPosix(path.relative(repoRoot, filePath))}:${number}: ${line.trim()}`);
}

function cjkTextNodes(filePath) {
  const content = read(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS
  );

  const textKinds = new Set([
    ts.SyntaxKind.StringLiteral,
    ts.SyntaxKind.NoSubstitutionTemplateLiteral,
    ts.SyntaxKind.JsxText,
    ts.SyntaxKind.TemplateHead,
    ts.SyntaxKind.TemplateMiddle,
    ts.SyntaxKind.TemplateTail
  ]);

  const matches = [];

  function visit(node) {
    if (textKinds.has(node.kind)) {
      const text = typeof node.text === 'string' ? node.text : node.getText(sourceFile);

      if (/[\u3400-\u9fff]/.test(text)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile)
        );
        const originalLine = content.split(/\r?\n/)[line]?.trim() ?? text.trim();
        matches.push(
          `${toPosix(path.relative(repoRoot, filePath))}:${line + 1}: ${originalLine}`
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return matches;
}

check('package-manager', () => {
  const packageJson = JSON.parse(read(path.join(root, 'package.json')));
  const problems = [];

  if (!existsSync(path.join(root, 'yarn.lock'))) {
    problems.push('src/frontend/yarn.lock is required for this Yarn-managed frontend.');
  }

  for (const lockfile of ['package-lock.json', 'pnpm-lock.yaml', 'bun.lockb']) {
    if (existsSync(path.join(root, lockfile))) {
      problems.push(`src/frontend/${lockfile} must not exist in a Yarn-managed frontend.`);
    }
  }

  if (!packageJson.packageManager?.startsWith('yarn@')) {
    problems.push('src/frontend/package.json must declare "packageManager": "yarn@...".');
  }

  return problems.length
    ? fail('Package manager configuration is inconsistent.', problems)
    : pass('Yarn is the only frontend package manager.');
});

check('no-npm-commands-in-project-scripts', () => {
  const files = [
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'scripts', 'start-dev.ps1'),
    path.join(repoRoot, 'scripts', 'start-dev.bat'),
    path.join(repoRoot, 'start-dev.bat'),
    path.join(root, 'package.json'),
    path.join(root, 'playwright.config.ts'),
    path.join(root, 'netlify.toml')
  ].filter((file) => existsSync(file));

  const details = files.flatMap((file) =>
    matchingLines(file, /\bnpm\s+(install|run|i|ci|add)\b|\bnpm\.cmd\b|\bpackage-lock\.json\b|\bpnpm-lock\.yaml\b/)
  );

  return details.length
    ? fail('Project scripts or local docs still contain npm/pnpm frontend commands.', details)
    : pass('Project scripts and local docs use the configured frontend package manager.');
});

check('no-cjk-in-source', () => {
  const allowedPrefixes = [
    'src/frontend/src/',
    'src/frontend/lib/enums/'
  ];

  function allowsCjk(relativePath) {
    return allowedPrefixes.some((prefix) => relativePath.startsWith(prefix));
  }

  const details = sourceFiles()
    .filter((file) => !allowsCjk(toPosix(path.relative(repoRoot, file))))
    .flatMap((file) => cjkTextNodes(file));

  return details.length
    ? fail('Frontend source contains CJK text outside allowed Chinese business UI files.', details.slice(0, 80))
    : pass('Frontend source only uses direct CJK text in allowed Chinese business UI files.');
});

check('no-debugger-statements', () => {
  const details = sourceFiles().flatMap((file) => matchingLines(file, /\bdebugger\b/));

  return details.length
    ? fail('Frontend source contains debugger statements.', details.slice(0, 80))
    : pass('No debugger statements found.');
});

let failed = 0;
const selected = new Set(process.argv.slice(2));
const activeChecks =
  selected.size > 0 ? checks.filter(({ name }) => selected.has(name)) : checks;

for (const name of selected) {
  if (!checks.some((check) => check.name === name)) {
    console.error(`Unknown harness check: ${name}`);
    process.exit(1);
  }
}

for (const { name, run } of activeChecks) {
  const result = run();
  const status = result.ok ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}: ${result.message}`);

  if (!result.ok) {
    failed += 1;
    for (const detail of result.details ?? []) {
      console.log(`  - ${detail}`);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} harness check(s) failed.`);
  process.exit(1);
}

console.log('\nHarness checks passed.');
