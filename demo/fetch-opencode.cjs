// Official npm binaries, version and integrity pinned for reproducible builds.
const { createHash } = require('node:crypto');
const { writeFile } = require('node:fs/promises');
const releases = {
  arm64: ['arm64', 'NgBu9go6DTgi2OJ04Q54kgbQFWOmv70cdBUsGr74SdXWEpi/VNIWc/5e5eYJ123ogW25uB03H5jFQx5XKsKzUQ=='],
  amd64: ['x64', '6naffcRwMLUM0kYuwJ3tRWt1/NXPybt9u8ZqTvSZwATM54+GhQmoiz8Qb9GYFTiwSJmB1rq8VoEmwh1VPzBcFw=='],
};
async function main() {
  const release = releases[process.argv[2]];
  if (!release) throw new Error('The demo supports Docker arm64 and amd64.');
  const [arch, checksum] = release;
  const name = `opencode-linux-${arch}`;
  const url = `https://registry.npmjs.org/${name}/-/${name}-1.17.13.tgz`;
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`OpenCode download failed: ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (createHash('sha512').update(data).digest('base64') !== checksum) {
    throw new Error('OpenCode checksum verification failed.');
  }
  await writeFile('/tmp/opencode.tgz', data);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
