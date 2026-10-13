'use strict';

const Arborist = require('@npmcli/arborist');
const { styleText } = require('util');
const { manifest } = require('pacote');
const lockfileInfo = require('lockfile-info');
const flat = require('array.prototype.flat');

/** @typedef {typeof import('./index.d.ts')} GetTree */
/** @typedef {import('./index.d.ts').Tree} Tree */
/** @typedef {import('./index.d.ts').Mode} Mode */
/** @typedef {import('./index.d.ts').Options} Options */

/** @type {(tree: Tree, options: { dev: boolean, production: boolean, peer: boolean }) => Tree} */
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

/** @type {(x: { mode: Mode, arb: Arborist } & Required<Pick<Options, 'fullMetadata' | 'packumentCache' | 'path' | 'logger' | 'forceActual'>>) => Promise<Tree>} */
async function getBaseTree({
	mode,
	arb,
	path,
	fullMetadata,
	packumentCache,
	logger,
	forceActual,
}) {
	const {
		hasNodeModulesDir,
		hasLockfile,
		hasPackageJSON,
		lockfileVersion,
	} = await lockfileInfo(path);

	if (mode === 'actual' || (mode === 'auto' && hasNodeModulesDir)) {
		const messages = flat([
			hasNodeModulesDir ? `\`${styleText('gray', 'node_modules')}\` found` : [],
			mode === 'actual' ? 'mode is “actual”' : [],
		]);
		logger(styleText('green', `${messages.join(', ')}; loading tree from disk...`));
		return arb.loadActual({ forceActual, fullMetadata: true, packumentCache });
	}

	if (mode === 'virtual' || (mode === 'auto' && hasLockfile)) {
		if (hasLockfile && lockfileVersion < 2) {
			const messages = ['v1 lockfile found'].concat(mode === 'virtual' ? 'mode is “virtual”' : []);
			logger(styleText('green', `${messages.join(', ')}; loading ideal tree from lockfile...`));
			const tree = /** @type {Tree} */ (await arb.buildIdealTree({ fullMetadata: true }));
			await Promise.all(Array.from(
				tree.children.values(),
				async (node) => {
					// eslint-disable-next-line no-param-reassign
					node.package = await manifest(`${node.name}@${/** @type {NonNullable<typeof node.package>} */ (node.package).version}`, {
						...arb.options,
						fullMetadata: true,
						packumentCache,
					});
				},
			));
			return tree;
		}
		const messages = flat([
			hasLockfile ? 'Lockfile found' : [],
			mode === 'virtual' ? 'mode is “virtual”' : [],
		]);
		logger(styleText('green', `${messages.join(', ')}; loading virtual tree from lockfile...`));
		return arb.loadVirtual({ fullMetadata: true, packumentCache });
	}

	const messages = flat([
		`\`${styleText('gray', 'package.json')}\` ${hasPackageJSON ? '' : 'not '}found`,
		mode === 'ideal' ? 'mode is “ideal”' : [],
	]);
	logger(styleText('green', `${messages.join(', ')}; building ideal tree from \`${styleText('gray', 'package.json')}\`...`));
	return arb.buildIdealTree({ fullMetadata, packumentCache, update: true });
}

/** @type {(x: unknown) => void} */
const defaultLogger = (x) => console.log(x);

/** @type {typeof import('./index.d.ts')} */
module.exports = async function getTree(mode, {
	dev = false,
	peer = true,
	production = true,
	fullMetadata = false,
	packumentCache = new Map(),
	path = process.cwd(),
	logger = defaultLogger,
	forceActual = false,
	...npmOptions
} = {}) {
	const arb = new Arborist({
		...npmOptions,
		Arborist, // TODO: investigate why this absurdity is necessary
		fullMetadata,
		packumentCache,
		path,
	});
	const tree = await getBaseTree({
		mode,
		arb,
		fullMetadata,
		packumentCache,
		path,
		logger,
		forceActual,
	});
	prune(tree, {
		dev,
		production,
		peer,
	});
	return tree;
};
