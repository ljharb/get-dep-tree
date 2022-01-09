'use strict';

const test = require('tape');
const sinon = require('sinon-sandbox');
const Arborist = require('@npmcli/arborist');
const { Node } = Arborist;

const getTree = require('..');
const { stripColors } = require('colors/safe');

test('getTree: auto', async (t) => {
	t.teardown(() => sinon.restore());

	const logger = sinon.stub();
	const p = getTree('auto', { logger });
	t.equal(Promise.resolve(p), p, 'returns a Promise');

	const tree = await p;

	t.deepEqual(
		logger.getCalls().map((x) => x.args.map((arg) => stripColors(arg))),
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
		logger.getCalls().map((x) => x.args.map((arg) => stripColors(arg))),
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
		logger.getCalls().map((x) => x.args.map((arg) => stripColors(arg))),
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
		logger.getCalls().map((x) => x.args.map((arg) => stripColors(arg))),
		[
			['`package.json` found, mode is “ideal”; building ideal tree from `package.json`...'],
		],
		'expected messages were logged',
	);

	t.ok(tree instanceof Node);
});

// TODO: fixture tests, to cover all scenarios with all modes, and check an actual tree
