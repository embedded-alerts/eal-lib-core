import fs from 'node:fs';

const registry = JSON.parse(
  fs.readFileSync('embedding-contract/model-space-v3.json', 'utf8'),
);
const fail = (message) => {
  throw new Error(message);
};

if (registry.contractVersion !== '3.1.0') fail('version drift');
if (registry.product !== 'embedded-alerts') fail('product drift');
if (registry.storage.slots !== 4100) fail('storage width drift');
for (const rejection of [
  'non-finite',
  'all-zero-learned-prefix',
  'non-zero-tail',
]) {
  if (!registry.storage.reject.includes(rejection)) {
    fail(`missing rejection ${rejection}`);
  }
}
if (!registry.providers.embedding.includes('voyage')) {
  fail('Voyage embedding provenance is required');
}
if (registry.providers.embedding.includes('anthropic')) {
  fail('Anthropic cannot be an embedding provider');
}
if (!registry.providers.generation.includes('anthropic')) {
  fail('Anthropic generation provenance is required');
}
if (registry.models['nvidia/NV-Embed-v2'].strategy !== 'binary-full-rerank') {
  fail('fixed NVIDIA 4096 strategy drift');
}
if (registry.models['baai/bge-en-icl'].strategy !== 'binary-full-rerank') {
  fail('fixed BAAI 4096 strategy drift');
}
if (registry.models['qwen/Qwen3-Embedding-8B'].strategy !== 'halfvec-mrl') {
  fail('Qwen MRL strategy drift');
}
if (registry.database.globalFilteredAnnIndex !== false) {
  fail('global filtered ANN index must remain disabled');
}
if (registry.database.fusion !== 'reciprocal-rank-fusion') {
  fail('hybrid fusion drift');
}
if (
  registry.activation.profilesEnabledByDefault !== false ||
  registry.activation.spacesEnabledByDefault !== false
) {
  fail('activation must default to disabled');
}
if (
  JSON.stringify(registry.purposes) !==
  JSON.stringify(['webpage_search', 'change_correlation', 'alert'])
) {
  fail('purpose drift');
}

console.log('Embedded Alerts model-space v3 registry verified');
