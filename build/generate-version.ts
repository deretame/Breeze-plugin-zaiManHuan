import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const infoPath = resolve(process.cwd(), 'src/get-info.ts');
  const info = await readFile(infoPath, 'utf-8');
  const match = info.match(/version:\s*'([^']*)'/);
  if (!match) {
    throw new Error('version not found in src/get-info.ts');
  }
  const version = match[1];

  const pkgPath = resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
  pkg.version = version;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
  console.log(`[version] synced package.json <- src/get-info.ts -> ${version}`);
}

void main().catch((error) => {
  console.error('[version] generate failed:', error);
  process.exit(1);
});
