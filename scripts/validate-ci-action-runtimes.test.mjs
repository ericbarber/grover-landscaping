import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../.github/workflows/ci.yml', import.meta.url);

test('production image jobs use the supported Node 24 Docker action majors', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.equal(
    workflow.match(/docker\/setup-buildx-action@v4/g)?.length,
    2,
    'both production image jobs must use setup-buildx-action@v4',
  );
  assert.equal(
    workflow.match(/docker\/build-push-action@v7/g)?.length,
    2,
    'both production image jobs must use build-push-action@v7',
  );
  assert.doesNotMatch(
    workflow,
    /docker\/(?:setup-buildx-action@v3|build-push-action@v6)/,
    'Node 20 Docker action majors must not return to the CI workflow',
  );
});

test('general CI jobs stay on the reviewed Ubuntu 24.04 runner image', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.equal(
    workflow.match(/^\s+runs-on: ubuntu-24\.04$/gm)?.length,
    7,
    'all seven general CI jobs must use the reviewed Ubuntu 24.04 image',
  );
  assert.equal(
    workflow.match(/^\s+runs-on: ubuntu-24\.04-arm$/gm)?.length,
    1,
    'the Pi deployment must retain its ARM64 runner',
  );
  assert.doesNotMatch(
    workflow,
    /^\s+runs-on: ubuntu-latest$/m,
    'ubuntu-latest must not introduce an unreviewed runner-image migration',
  );
});
