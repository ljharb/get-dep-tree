'use strict';

const test = require('tape');
const sinon = require('sinon-sandbox');
const { Node } = require('@npmcli/arborist');
const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');

const getTree = require('..');
const { stripVTControlCharacters } = require('util');

const originalCwd = process.cwd();

/** @param {{ [k in string]: import('@npmcli/arborist').Node['package'] | import('@npmcli/arborist').PackageLock }} files */
function createFixture(files) {
	// arborist roots a symlinked `path` (eg, macOS `/var` -> `/private/var`) as a Link with no children
	const tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'get-dep-tree-test-')));
	Object.keys(files).forEach((name) => {
		fs.mkdirSync(path.dirname(path.join(tmpDir, name)), { recursive: true });
		fs.writeFileSync(path.join(tmpDir, name), JSON.stringify(files[name]));
	});
	return tmpDir;
}

/** @type {(node: import('..').Tree | undefined, key: string) => unknown} */
function pkgField(node, key) {
	const pkg = /** @type {Record<string, unknown> | undefined} */ (/** @type {unknown} */ (node && node.package));
	return pkg && pkg[key];
}

/** @type {() => Promise<{ registry: string, authKey: string, requests: import('http').IncomingMessage[], close: () => Promise<void> }>} */
async function createRegistry() {
	/** @type {import('http').IncomingMessage[]} */
	const requests = [];
	const server = http.createServer((req, res) => {
		requests.push(req);
		const { port } = /** @type {import('net').AddressInfo} */ (server.address());
		const registry = `http://127.0.0.1:${port}/`;
		if (req.url === '/is-positive') {
			res.writeHead(200, { 'content-type': 'application/json' });
			res.end(JSON.stringify({
				name: 'is-positive',
				'dist-tags': { latest: '1.0.0' },
				versions: {
					'1.0.0': {
						name: 'is-positive',
						version: '1.0.0',
						description: 'served by the test registry',
						dist: { tarball: `${registry}is-positive/-/is-positive-1.0.0.tgz` },
					},
				},
			}));
		} else {
			res.writeHead(404, { 'content-type': 'application/json' });
			res.end('{}');
		}
	});
	await new Promise((resolve) => { server.listen(0, '127.0.0.1', () => resolve(undefined)); });
	const { port } = /** @type {import('net').AddressInfo} */ (server.address());
	return {
		registry: `http://127.0.0.1:${port}/`,
		authKey: `//127.0.0.1:${port}/:_authToken`,
		requests,
		close: () => new Promise((resolve) => { server.close(() => resolve(undefined)); }),
	};
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
		t.match(e.message, /^loadVirtual requires existing (?:shrinkwrap|package-lock\.json) file$/, 'has expected message');
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
	const tree = await getTree('virtual', { logger, path: tmpDir });

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
	const tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'get-dep-tree-test-')));
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

test('getTree: auto detects lockfile and `node_modules` at `path`, not the cwd', async (t) => {
	const tmpDir = createFixture({
		'package.json': {
			name: 'test-auto-path',
			version: '1.0.0',
			dependencies: { 'is-positive': '1.0.0' },
		},
		'package-lock.json': {
			name: 'test-auto-path',
			version: '1.0.0',
			lockfileVersion: 3,
			requires: true,
			packages: {
				'': {
					name: 'test-auto-path',
					version: '1.0.0',
					dependencies: { 'is-positive': '1.0.0' },
				},
				'node_modules/is-positive': {
					version: '1.0.0',
					resolved: 'https://registry.npmjs.org/is-positive/-/is-positive-1.0.0.tgz',
				},
			},
		},
	});
	t.teardown(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	t.equal(process.cwd(), originalCwd, 'cwd is the package root, which has `node_modules`');

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
	t.equal(tree.path, tmpDir, 'tree is rooted at `path`');
	t.deepEqual(Array.from(tree.children.keys()), ['is-positive'], 'tree has the lockfile’s dependencies');
});

test('getTree: passes `registry` and other npm config options through to arborist', async (t) => {
	const { registry, authKey, requests, close } = await createRegistry();
	const tmpDir = createFixture({
		'package.json': {
			name: 'test-registry-ideal',
			version: '1.0.0',
			dependencies: { 'is-positive': '1.0.0' },
		},
	});
	t.teardown(async () => {
		await close();
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const tree = await getTree('ideal', {
		logger: sinon.stub(),
		path: tmpDir,
		registry,
		[authKey]: 'test-token',
		cache: path.join(tmpDir, '.cache'),
	});

	const child = tree.children.get('is-positive');
	t.equal(child && child.version, '1.0.0', 'dependency was resolved');
	t.ok(requests.length > 0, 'the test registry was used');
	t.deepEqual(
		requests.map((req) => req.headers.authorization),
		requests.map(() => 'Bearer test-token'),
		'the registry auth token was sent with every request',
	);
});

test('getTree: passes `registry` and other npm config options through to pacote, with a v1 lockfile', async (t) => {
	const { registry, authKey, requests, close } = await createRegistry();
	const tmpDir = createFixture({
		'package.json': {
			name: 'test-registry-v1',
			version: '1.0.0',
			dependencies: { 'is-positive': '1.0.0' },
		},
		'package-lock.json': {
			name: 'test-registry-v1',
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
	t.teardown(async () => {
		await close();
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const tree = await getTree('virtual', {
		logger: sinon.stub(),
		path: tmpDir,
		registry,
		[authKey]: 'test-token',
		cache: path.join(tmpDir, '.cache'),
	});

	t.equal(
		pkgField(tree.children.get('is-positive'), 'description'),
		'served by the test registry',
		'manifest came from the test registry',
	);
	t.ok(requests.length > 0, 'the test registry was used');
	t.deepEqual(
		requests.map((req) => req.headers.authorization),
		requests.map(() => 'Bearer test-token'),
		'the registry auth token was sent with every request',
	);
});

test('getTree: `forceActual` reads `package.json` files instead of the hidden lockfile', async (t) => {
	const tmpDir = createFixture({
		'package.json': {
			name: 'test-force-actual',
			version: '1.0.0',
			dependencies: { foo: '1.0.0' },
		},
		'node_modules/foo/package.json': {
			name: 'foo',
			version: '1.0.0',
			license: 'MIT',
			repository: 'ljharb/foo',
		},
		'node_modules/.package-lock.json': {
			name: 'test-force-actual',
			version: '1.0.0',
			lockfileVersion: 3,
			requires: true,
			packages: {
				'node_modules/foo': {
					version: '1.0.0',
					license: 'MIT',
				},
			},
		},
	});
	t.teardown(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const hidden = await getTree('actual', { logger: sinon.stub(), path: tmpDir });
	t.equal(pkgField(hidden.children.get('foo'), 'license'), 'MIT', 'hidden lockfile: has lockfile fields');
	t.equal(pkgField(hidden.children.get('foo'), 'repository'), undefined, 'hidden lockfile: lacks non-lockfile fields');

	const actual = await getTree('actual', { logger: sinon.stub(), path: tmpDir, forceActual: true });
	t.equal(pkgField(actual.children.get('foo'), 'repository'), 'ljharb/foo', '`forceActual`: has the real `package.json` fields');
});

/** @type {() => string} */
function createFlagsFixture() {
	return createFixture({
		'package.json': {
			name: 'root',
			version: '1.0.0',
			dependencies: {
				a: '1.0.0',
			},
			devDependencies: {
				c: '1.0.0',
			},
			optionalDependencies: {
				o: '1.0.0',
			},
		},
		'package-lock.json': {
			name: 'root',
			version: '1.0.0',
			lockfileVersion: 3,
			requires: true,
			packages: {
				'': {
					name: 'root',
					version: '1.0.0',
					dependencies: {
						a: '1.0.0',
					},
					devDependencies: {
						c: '1.0.0',
					},
					optionalDependencies: {
						o: '1.0.0',
					},
				},
				'node_modules/a': {
					version: '1.0.0',
					dependencies: {
						w: '1.0.0',
					},
					optionalDependencies: {
						ox: '1.0.0',
					},
					peerDependencies: {
						p: '1.0.0',
					},
				},
				'node_modules/a/node_modules/w': {
					version: '1.0.0',
					peerDependencies: {
						q: '1.0.0',
					},
				},
				'node_modules/a/node_modules/q': {
					version: '1.0.0',
					peer: true,
				},
				'node_modules/a/node_modules/ox': {
					version: '1.0.0',
					optional: true,
				},
				'node_modules/p': {
					version: '1.0.0',
					peer: true,
				},
				'node_modules/c': {
					version: '1.0.0',
					dev: true,
					dependencies: {
						d: '1.0.0',
						both: '1.0.0',
					},
					optionalDependencies: {
						e: '1.0.0',
					},
				},
				'node_modules/c/node_modules/d': {
					version: '1.0.0',
					dev: true,
				},
				'node_modules/c/node_modules/e': {
					version: '1.0.0',
					dev: true,
					optional: true,
				},
				'node_modules/o': {
					version: '1.0.0',
					optional: true,
					dependencies: {
						both: '1.0.0',
					},
				},
				'node_modules/both': {
					version: '1.0.0',
					devOptional: true,
				},
			},
		},
	});
}

/** @type {(tree: import('..').Tree) => string[]} */
function locations(tree) {
	return Array.from(tree.inventory.values(), (node) => node.location).filter(Boolean).sort();
}

test('getTree: pruning applies at every depth', async (t) => {
	const tmpDir = createFlagsFixture();
	t.teardown(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const all = await getTree('virtual', { logger: sinon.stub(), path: tmpDir, dev: true });
	t.deepEqual(
		locations(all),
		[
			'node_modules/a',
			'node_modules/a/node_modules/ox',
			'node_modules/a/node_modules/q',
			'node_modules/a/node_modules/w',
			'node_modules/both',
			'node_modules/c',
			'node_modules/c/node_modules/d',
			'node_modules/c/node_modules/e',
			'node_modules/o',
			'node_modules/p',
		],
		'`dev: true`: nothing is pruned',
	);

	const prod = await getTree('virtual', { logger: sinon.stub(), path: tmpDir });
	t.deepEqual(
		locations(prod),
		[
			'node_modules/a',
			'node_modules/a/node_modules/ox',
			'node_modules/a/node_modules/q',
			'node_modules/a/node_modules/w',
			'node_modules/both',
			'node_modules/o',
			'node_modules/p',
		],
		'defaults: dev deps are pruned; a dep of both the dev and optional hierarchies is kept',
	);

	const noPeer = await getTree('virtual', { logger: sinon.stub(), path: tmpDir, dev: true, peer: false });
	t.deepEqual(
		locations(noPeer),
		[
			'node_modules/a',
			'node_modules/a/node_modules/ox',
			'node_modules/a/node_modules/w',
			'node_modules/both',
			'node_modules/c',
			'node_modules/c/node_modules/d',
			'node_modules/c/node_modules/e',
			'node_modules/o',
		],
		'`peer: false` alone prunes peer deps, including nested ones',
	);

	const devOnly = await getTree('virtual', { logger: sinon.stub(), path: tmpDir, dev: true, production: false });
	t.deepEqual(
		locations(devOnly),
		[
			'node_modules/both',
			'node_modules/c',
			'node_modules/c/node_modules/d',
			'node_modules/c/node_modules/e',
		],
		'`production: false` prunes everything not needed by the dev hierarchy',
	);
});

// TODO: fixture tests, to cover all scenarios with all modes, and check an actual tree
