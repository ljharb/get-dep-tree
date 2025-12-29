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
