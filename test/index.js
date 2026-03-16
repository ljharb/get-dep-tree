'use strict';

const test = require('tape');
const sinon = require('sinon-sandbox');
const { Node } = require('@npmcli/arborist');
const fs = require('fs');
const path = require('path');
const os = require('os');

const getTree = require('..');
const { stripVTControlCharacters } = require('util');

const originalCwd = process.cwd();

/** @param {{ [k in string]: import('@npmcli/arborist').Node['package'] | import('@npmcli/arborist').PackageLock }} files */
function createFixture(files) {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'get-dep-tree-test-'));
	Object.keys(files).forEach((name) => {
		fs.writeFileSync(path.join(tmpDir, name), JSON.stringify(files[name]));
	});
	return tmpDir;
}

test('getTree: auto', async (t) => {
	t.teardown(() => sinon.restore());

	const logger = sinon.stub();
	const p = getTree('auto', { logger });
	t.equal(Promise.resolve(p), p, 'returns a Promise');

	const tree = await p;

	t.deepEqual(
		logger.getCalls().map((x) => x.args.map((arg) => stripVTControlCharacters(arg))),
		[
			['`node_modules` found; loading tree from disk...'],
		],
		'expected messages were logged',
	);

	t.ok(tree instanceof Node);
});

test('getTree: actual', async (t) => {
	t.teardown(() => sinon.restore());

	const logger = sinon.stub();
	const p = getTree('actual', { logger });
	t.equal(Promise.resolve(p), p, 'returns a Promise');

	const tree = await p;

	t.deepEqual(
		logger.getCalls().map((x) => x.args.map((arg) => stripVTControlCharacters(arg))),
		[
			['`node_modules` found, mode is “actual”; loading tree from disk...'],
		],
		'expected messages were logged',
	);

	t.ok(tree instanceof Node);
});

test('getTree: virtual', async (t) => {
	t.teardown(() => sinon.restore());

	const logger = sinon.stub();
	const p = getTree('virtual', { logger });
	t.equal(Promise.resolve(p), p, 'returns a Promise');

	await p.then(null, (e) => {
		t.ok(e instanceof Error, 'is an Error');
		t.equal(e.message, 'loadVirtual requires existing shrinkwrap file');
	});

	t.deepEqual(
		logger.getCalls().map((x) => x.args.map((arg) => stripVTControlCharacters(arg))),
		[
			['mode is “virtual”; loading virtual tree from lockfile...'],
		],
		'expected messages were logged',
	);
});

test('getTree: ideal', async (t) => {
	t.teardown(() => sinon.restore());

	const logger = sinon.stub();
	const p = getTree('ideal', { logger });
	t.equal(Promise.resolve(p), p, 'returns a Promise');

	const tree = await p;

	t.deepEqual(
		logger.getCalls().map((x) => x.args.map((arg) => stripVTControlCharacters(arg))),
		[
			['`package.json` found, mode is “ideal”; building ideal tree from `package.json`...'],
		],
		'expected messages were logged',
	);

	t.ok(tree instanceof Node);
});

test('getTree: default logger', async (t) => {
	t.teardown(() => sinon.restore());

	const spy = sinon.spy(console, 'log');
	const tree = await getTree('auto');

	t.ok(spy.called, 'console.log was called');
	t.ok(tree instanceof Node);
});

test('getTree: prune with dev and production both true skips pruning', async (t) => {
	t.teardown(() => sinon.restore());

	const logger = sinon.stub();
	const tree = await getTree('auto', { logger, dev: true, production: true });

	t.ok(tree instanceof Node);
});

test('getTree: prune with production false', async (t) => {
	t.teardown(() => sinon.restore());

	const logger = sinon.stub();
	const tree = await getTree('auto', { logger, production: false });

	t.ok(tree instanceof Node);
});

test('getTree: prune with peer false', async (t) => {
	t.teardown(() => sinon.restore());

	const logger = sinon.stub();
	const tree = await getTree('auto', { logger, peer: false });

	t.ok(tree instanceof Node);
});

test('getTree: actual without node_modules', async (t) => {
	const tmpDir = createFixture({
		'package.json': { name: 'test-no-nm', version: '1.0.0' },
	});
	process.chdir(tmpDir);
	t.teardown(() => {
		process.chdir(originalCwd);
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const logger = sinon.stub();
	const tree = await getTree('actual', { logger, path: tmpDir });

	t.equal(logger.callCount, 1, 'logger called once');
	t.equal(
		stripVTControlCharacters(logger.getCall(0).args[0]),
		'mode is “actual”; loading tree from disk...',
		'expected message was logged',
	);
	t.ok(tree instanceof Node);
});

test('getTree: virtual with v1 lockfile', async (t) => {
	const tmpDir = createFixture({
		'package.json': {
			name: 'test-v1-lockfile',
			version: '1.0.0',
			dependencies: { 'is-positive': '1.0.0' },
		},
		'package-lock.json': {
			name: 'test-v1-lockfile',
			version: '1.0.0',
			lockfileVersion: 1,
			requires: true,
			dependencies: {
				'is-positive': {
					version: '1.0.0',
					resolved: 'https://registry.npmjs.org/is-positive/-/is-positive-1.0.0.tgz',
				},
			},
		},
	});
	process.chdir(tmpDir);
	t.teardown(() => {
		process.chdir(originalCwd);
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const logger = sinon.stub();
	const tree = await getTree('virtual', { logger, path: originalCwd });

	t.equal(logger.callCount, 1, 'logger called once');
	t.equal(
		stripVTControlCharacters(logger.getCall(0).args[0]),
		'v1 lockfile found, mode is “virtual”; loading ideal tree from lockfile...',
		'expected message was logged',
	);
	t.ok(tree instanceof Node);
	t.ok(tree.children.size > 0, 'tree has children');
});

test('getTree: auto with v1 lockfile', async (t) => {
	const tmpDir = createFixture({
		'package.json': {
			name: 'test-v1-auto',
			version: '1.0.0',
			dependencies: { 'is-positive': '1.0.0' },
		},
		'package-lock.json': {
			name: 'test-v1-auto',
			version: '1.0.0',
			lockfileVersion: 1,
			requires: true,
			dependencies: {
				'is-positive': {
					version: '1.0.0',
					resolved: 'https://registry.npmjs.org/is-positive/-/is-positive-1.0.0.tgz',
				},
			},
		},
	});
	process.chdir(tmpDir);
	t.teardown(() => {
		process.chdir(originalCwd);
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const logger = sinon.stub();
	const tree = await getTree('auto', { logger, path: tmpDir });

	t.deepEqual(
		logger.getCalls().map((x) => x.args.map((arg) => stripVTControlCharacters(arg))),
		[
			['v1 lockfile found; loading ideal tree from lockfile...'],
		],
		'expected messages were logged',
	);
	t.ok(tree instanceof Node);
});

test('getTree: virtual with v2 lockfile', async (t) => {
	const tmpDir = createFixture({
		'package.json': {
			name: 'test-v2-virtual',
			version: '1.0.0',
			dependencies: { 'is-positive': '1.0.0' },
		},
		'package-lock.json': {
			name: 'test-v2-virtual',
			version: '1.0.0',
			lockfileVersion: 2,
			requires: true,
			packages: {
				'': {
					name: 'test-v2-virtual',
					version: '1.0.0',
					dependencies: { 'is-positive': '1.0.0' },
				},
				'node_modules/is-positive': {
					version: '1.0.0',
					resolved: 'https://registry.npmjs.org/is-positive/-/is-positive-1.0.0.tgz',
				},
			},
			dependencies: {
				'is-positive': {
					version: '1.0.0',
					resolved: 'https://registry.npmjs.org/is-positive/-/is-positive-1.0.0.tgz',
				},
			},
		},
	});
	process.chdir(tmpDir);
	t.teardown(() => {
		process.chdir(originalCwd);
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const logger = sinon.stub();
	const tree = await getTree('virtual', { logger, path: tmpDir });

	t.equal(logger.callCount, 1, 'logger called once');
	t.equal(
		stripVTControlCharacters(logger.getCall(0).args[0]),
		'Lockfile found, mode is “virtual”; loading virtual tree from lockfile...',
		'expected message was logged',
	);
	t.ok(tree instanceof Node);
});

test('getTree: auto with v2 lockfile, no node_modules', async (t) => {
	const tmpDir = createFixture({
		'package.json': {
			name: 'test-v2-auto',
			version: '1.0.0',
			dependencies: { 'is-positive': '1.0.0' },
		},
		'package-lock.json': {
			name: 'test-v2-auto',
			version: '1.0.0',
			lockfileVersion: 2,
			requires: true,
			packages: {
				'': {
					name: 'test-v2-auto',
					version: '1.0.0',
					dependencies: { 'is-positive': '1.0.0' },
				},
				'node_modules/is-positive': {
					version: '1.0.0',
					resolved: 'https://registry.npmjs.org/is-positive/-/is-positive-1.0.0.tgz',
				},
			},
			dependencies: {
				'is-positive': {
					version: '1.0.0',
					resolved: 'https://registry.npmjs.org/is-positive/-/is-positive-1.0.0.tgz',
				},
			},
		},
	});
	process.chdir(tmpDir);
	t.teardown(() => {
		process.chdir(originalCwd);
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const logger = sinon.stub();
	const tree = await getTree('auto', { logger, path: tmpDir });

	t.deepEqual(
		logger.getCalls().map((x) => x.args.map((arg) => stripVTControlCharacters(arg))),
		[
			['Lockfile found; loading virtual tree from lockfile...'],
		],
		'expected messages were logged',
	);
	t.ok(tree instanceof Node);
});

test('getTree: auto with no package.json', async (t) => {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'get-dep-tree-test-'));
	process.chdir(tmpDir);
	t.teardown(() => {
		process.chdir(originalCwd);
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const logger = sinon.stub();
	const tree = await getTree('auto', { logger, path: tmpDir });

	t.deepEqual(
		logger.getCalls().map((x) => x.args.map((arg) => stripVTControlCharacters(arg))),
		[
			['`package.json` not found; building ideal tree from `package.json`...'],
		],
		'expected messages were logged',
	);
	t.ok(tree instanceof Node);
});

// TODO: fixture tests, to cover all scenarios with all modes, and check an actual tree
