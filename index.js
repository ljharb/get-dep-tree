'use strict';

const Arborist = require('@npmcli/arborist');
const colors = require('colors/safe');
const { manifest } = require('pacote');
const lockfileInfo = require('lockfile-info');
const flat = require('array.prototype.flat');

function prune(tree, {
	dev: keepDev,
	production: keepProduction,
	peer: keepPeer,
}) {
	if (!keepDev || !keepProduction) {
		for (const node of tree.children.values()) {
			if ((!keepDev && node.dev) || (!keepProduction && !node.dev) || (!keepPeer && node.peer)) {
				node.root = null;
			}
		}
	}
	return tree;
}

async function getBaseTree({
	mode,
	arb,
	fullMetadata,
	packumentCache,
	logger,
}) {
	const {
		hasNodeModulesDir,
		hasLockfile,
		hasPackageJSON,
		lockfileVersion,
	} = await lockfileInfo();

	if (mode === 'actual' || (mode === 'auto' && hasNodeModulesDir)) {
		const messages = flat([
			hasNodeModulesDir ? `\`${colors.gray('node_modules')}\` found` : [],
			mode === 'actual' ? 'mode is “actual”' : [],
		]);
		logger(colors.green(`${messages.join(', ')}; loading tree from disk...`));
		return arb.loadActual({ fullMetadata: true, packumentCache });
	}

	if (mode === 'virtual' || (mode === 'auto' && hasLockfile)) {
		if (hasLockfile && lockfileVersion < 2) {
			const messages = ['v1 lockfile found'].concat(mode === 'virtual' ? 'mode is “virtual”' : []);
			logger(colors.green(`${messages.join(', ')}; loading ideal tree from lockfile...`));
			const tree = await arb.buildIdealTree({ fullMetadata: true });
			await Promise.all(Array.from(
				tree.children.values(),
				async (node) => {
					// eslint-disable-next-line no-param-reassign
					node.package = await manifest(`${node.name}@${node.package.version}`, { fullMetadata: true, packumentCache });
				},
			));
			return tree;
		}
		const messages = flat([
			hasLockfile ? 'Lockfile found' : [],
			mode === 'virtual' ? 'mode is “virtual”' : [],
		]);
		logger(colors.green(`${messages.join(', ')}; loading virtual tree from lockfile...`));
		return arb.loadVirtual({ fullMetadata: true, packumentCache });
	}

	const messages = flat([
		`\`${colors.gray('package.json')}\` ${hasPackageJSON ? '' : 'not '}found`,
		mode === 'ideal' ? 'mode is “ideal”' : [],
	]);
	logger(colors.green(`${messages.join(', ')}; building ideal tree from \`${colors.gray('package.json')}\`...`));
	return arb.buildIdealTree({ fullMetadata, packumentCache, update: true });
}

const defaultLogger = (x) => console.log(x);

module.exports = async function getTree(mode, {
	dev = false,
	peer = true,
	production = true,
	fullMetadata = false,
	packumentCache = new Map(),
	path = process.cwd(),
	logger = defaultLogger,
} = {}) {
	const arb = new Arborist({
		fullMetadata,
		packumentCache,
		path,
	});
	const tree = await getBaseTree({
		mode,
		arb,
		fullMetadata,
		packumentCache,
		logger,
	});
	prune(tree, {
		dev,
		production,
		peer,
	});
	return tree;
};
