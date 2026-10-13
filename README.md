# get-dep-tree <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![dependency status][deps-svg]][deps-url]
[![dev dependency status][dev-deps-svg]][dev-deps-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

Use npm's Arborist to get a dependency tree for a package.

## Example

```js
const getDepTree = require('get-dep-tree');
const { Node } = require('@npmcli/arborist');
const assert = require('assert');

getDepTree().then((tree) => {
	assert.ok(tree instanceof Node);
});
```

## API

### `getDepTree(mode, options = {})`

Returns a Promise for an Arborist `Node` representing the root of the tree.

`mode` is one of:
 - `'actual'`: load the tree from `node_modules` on disk
 - `'virtual'`: load the tree from `package-lock.json` (a v1 lockfile is used to build an ideal tree)
 - `'ideal'`: build an ideal tree from `package.json`, using the registry
 - `'auto'`: `'actual'` if `path` has a `node_modules` directory, otherwise `'virtual'` if it has a `package-lock.json`, otherwise `'ideal'`

`options`:
 - `path`: the package directory to load. Default: `process.cwd()`
 - `dev`: keep dev dependencies. Default: `false`
 - `production`: keep production dependencies; when `false`, only nodes needed by the dev hierarchy are kept. Default: `true`
 - `peer`: keep peer dependencies. Default: `true`
 - `optional`: keep optional dependencies. Default: `true`
 - `fullMetadata`: passed through to `@npmcli/arborist` and `pacote`, for registry fetches. Default: `false`. Note that `@npmcli/arborist` always fetches full manifests while building an ideal tree, that top-level nodes from a v1 lockfile are always given full manifests, and that `'actual'` and `'virtual'` modes otherwise do not fetch from the registry, so `node.package` only has what is on disk (see `forceActual`) or in the lockfile.
 - `packumentCache`: a `Map` to cache packuments in; share one across calls to avoid refetching. Default: a new `Map`
 - `logger`: a function called with progress messages. Default: `console.log`
 - `forceActual`: when loading from `node_modules` (`'actual'` mode, or `'auto'` mode when `node_modules` exists), ignore the hidden lockfile (`node_modules/.package-lock.json`), so each node's `package` is its real `package.json`, rather than the subset of fields the hidden lockfile stores. Default: `false`
 - `registry`: the registry URL. Default: `'https://registry.npmjs.org/'`
 - any other flattened npm config options (eg, `cache`, `offline`, or `'//registry.example.com/:_authToken'`) are passed through to `@npmcli/arborist` and `pacote`. Note that `.npmrc` files are not read; use `@npmcli/config` to load and flatten them.

Pruning applies to every node in the tree, at any depth, based on arborist's `dev`, `optional`, `devOptional`, and `peer` flags. `dev: false`, `peer: false`, and `optional: false` use arborist's `node.shouldOmit`, the same check as `npm install --omit=dev`/`--omit=peer`/`--omit=optional`; so, for example, a dependency needed by both the dev and the optional hierarchies is only pruned when both `dev` and `optional` are `false`.

[package-url]: https://npmjs.org/package/get-dep-tree
[npm-version-svg]: https://versionbadg.es/ljharb/get-dep-tree.svg
[deps-svg]: https://david-dm.org/ljharb/get-dep-tree.svg
[deps-url]: https://david-dm.org/ljharb/get-dep-tree
[dev-deps-svg]: https://david-dm.org/ljharb/get-dep-tree/dev-status.svg
[dev-deps-url]: https://david-dm.org/ljharb/get-dep-tree#info=devDependencies
[npm-badge-png]: https://nodei.co/npm/get-dep-tree.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/get-dep-tree.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/get-dep-tree.svg
[downloads-url]: https://npm-stat.com/charts.html?package=get-dep-tree
[codecov-image]: https://codecov.io/gh/ljharb/get-dep-tree/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/get-dep-tree/
[actions-image]: https://img.shields.io/github/check-runs/ljharb/get-dep-tree/main
[actions-url]: https://github.com/ljharb/get-dep-tree/actions
