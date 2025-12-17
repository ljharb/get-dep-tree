/// <reference types="node" />

import { EventEmitter } from 'events';
import { Options as PacoteOptions, Packument } from 'pacote';

declare class Arborist extends EventEmitter {
	constructor(options?: Arborist.Options);
	cache: string;
	path: string;
	registry: string;
	options: Arborist.NormalizedOptions;
	actualTree?: Arborist.Node | null;
	idealTree: Arborist.Node | null;
	virtualTree?: Arborist.Node | null;
	installLinks: boolean;
	legacyPeerDeps: boolean;

	buildIdealTree(options?: Arborist.BuildIdealTreeOptions): Promise<Arborist.Node>;
	loadActual(options?: Arborist.Options): Promise<Arborist.Node>;
	loadVirtual(options?: Arborist.Options): Promise<Arborist.Node>;
	reify(options?: Arborist.ReifyOptions): Promise<Arborist.Node>;
	dedupe(options?: Omit<Arborist.ReifyOptions, 'preferDedupe' | 'names'>): Promise<Arborist.Node>;
	workspaceNodes(tree: Arborist.Node, workspaces: string[]): Arborist.Node[];
	workspaceDependencySet(tree: Arborist.Node, workspaces: string[], includeWorkspaceRoot?: boolean): Set<Arborist.Node>;
	excludeWorkspacesDependencySet(tree: Arborist.Node): Set<Arborist.Node>;
}

declare namespace Arborist {
	const Arborist: Arborist;

	interface Options extends PacoteOptions {
		path?: string;
		nodeVersion?: string;
		lockfileVersion?: number | null;
		workspacesEnabled?: boolean;
		replaceRegistryHost?: string;
		saveType?: SaveType;
		progress?: boolean;
		follow?: boolean;
		force?: boolean;
		global?: boolean;
		globalStyle?: boolean;
		idealTree?: Node | null;
		includeWorkspaceRoot?: boolean;
		installLinks?: boolean;
		installStrategy?: 'hoisted' | 'nested' | 'shallow' | 'linked';
		legacyPeerDeps?: boolean;
		packageLock?: boolean;
		strictPeerDeps?: boolean;
		workspaces?: string[];
		actualTree?: Node | null;
		virtualTree?: Node | null;
		ignoreScripts?: boolean;
		scriptShell?: string;
		binLinks?: boolean;
		rebuildBundle?: boolean;
		savePrefix?: string;
		packageLockOnly?: boolean;
		dryRun?: boolean;
		formatPackageLock?: boolean;
	}

	interface NormalizedOptions extends Options {
		nodeVersion: NonNullable<Options['nodeVersion']>;
		registry: NonNullable<Options['registry']>;
		path: NonNullable<Options['path']>;
		cache: NonNullable<Options['cache']>;
		packumentCache: NonNullable<Options['packumentCache']>;
		workspacesEnabled: NonNullable<Options['workspacesEnabled']>;
		replaceRegistryHost: NonNullable<Options['replaceRegistryHost']>;
		lockfileVersion: number | null;
	}

	type SaveType = 'dev' | 'optional' | 'prod' | 'peerOptional' | 'peer';

	interface BuildIdealTreeOptions {
		rm?: string[];
		add?: string[];
		saveType?: SaveType;
		saveBundle?: boolean;
		update?: boolean | { all?: boolean; names?: string[] };
		prune?: boolean;
		preferDedupe?: boolean;
		legacyBundling?: boolean;
		engineStrict?: boolean;
		/** Passed through to pacote for registry fetches */
		fullMetadata?: boolean;
		/** Passed through to pacote for registry fetches */
		packumentCache?: Map<string, import('pacote').Packument>;
	}

	interface ReifyOptions extends BuildIdealTreeOptions {
		omit?: SaveType[];
		save?: boolean;
	}

	/** package.json content type */
	interface PackageJsonType {
		name?: string;
		version?: string;
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
		optionalDependencies?: Record<string, string>;
		bundledDependencies?: string[] | false;
		bin?: string | Record<string, string>;
		scripts?: Record<string, string>;
		engines?: Record<string, string>;
		[key: string]: unknown;
	}

	class Node {
		protected constructor(options: never);
		name: string;
		parent: Node | null;
		children: Map<string, Node | Link>;
		fsParent: Node | null;
		fsChildren: Set<Node>;
		package: PackageJsonType;
		path: string;
		realpath: string;
		resolved: string | null;
		integrity: string | null;
		location: string;
		readonly isLink: boolean;
		dev: boolean;
		optional: boolean;
		devOptional: boolean;
		peer: boolean;
		extraneous: boolean;
		workspaces: Map<string, string> | null;
		errors: Error[];
		target: Node;
		edgesOut: Map<string, Edge>;
		edgesIn: Set<Edge>;
		linksIn: Set<Link>;
		inventory: Inventory;
		overrides?: OverrideSet;
		sourceReference?: Node;
		isInStore: boolean;
		hasShrinkwrap: boolean;
		installLinks: boolean;
		legacyPeerDeps: boolean;
		tops: Set<Node>;
		dummy: boolean;

		get global(): boolean;
		get globalTop(): boolean;
		get isRoot(): boolean;
		get isProjectRoot(): boolean;
		get isRegistryDependency(): boolean;
		get root(): Node;
		set root(value: Node | null);
		get depth(): number;
		get isTop(): boolean;
		get top(): Node;
		get isFsTop(): boolean;
		get fsTop(): Node;
		get resolveParent(): Node;
		get binPaths(): string[];
		get hasInstallScript(): boolean;
		get version(): string;
		get packageName(): string;
		get pkgid(): string;
		get inBundle(): boolean;
		get inDepBundle(): boolean;
		get inShrinkwrap(): boolean;
		get isWorkspace(): boolean;
		get overridden(): boolean;

		ancestry(): Generator<Node, void>;
		resolve(name: string): Node;
		inNodeModules(): string | false;
		querySelectorAll(query: string): Promise<Node[]>;
		toJSON(): Node;
		explain(seen?: Node[]): Explanation;
		isDescendentOf(node: Node): boolean;
		getBundler(path?: Node[]): Node | null;
		canReplaceWith(node: Node, ignorePeers?: Iterable<Node>): boolean;
		canReplace(node: Node, ignorePeers?: Iterable<Node>): boolean;
		canDedupe(preferDedupe?: boolean): boolean;
		satisfies(requested: Edge | string): boolean;
		matches(node: Node): boolean;
		replaceWith(node: Node): void;
		replace(node: Node): void;
	}

	class Link extends Node {
		readonly isLink: true;
	}

	type DependencyProblem = 'DETACHED' | 'MISSING' | 'PEER LOCAL' | 'INVALID';

	class Edge {
		constructor(fields: Pick<Edge, 'accept' | 'from' | 'type' | 'name' | 'spec' | 'overrides'>);
		readonly from: Node | null;
		readonly type: SaveType;
		readonly name: string;
		readonly spec: string;
		readonly to: Node | null;
		readonly accept: string;
		overrides?: ChildOverrideSet;
		get valid(): boolean;
		get invalid(): boolean;
		get missing(): boolean;
		get peerLocal(): boolean;
		error: DependencyProblem | null;
		reload(hard?: boolean): void;
		explain(seen?: Node[]): Explanation;
		get bundled(): boolean;
		get workspace(): boolean;
		get prod(): boolean;
		get dev(): boolean;
		get optional(): boolean;
		get peer(): boolean;
		get rawSpec(): string;
		detach(): void;
	}

	class Shrinkwrap {
		constructor();
		path: string;
		filename: string | null;
		type: string | null;
		loadedFromDisk: boolean;
		resolveOptions: PacoteOptions;
		commit(): PackageLock;
		toJSON(): PackageLock;
		toString(options?: { format?: boolean }): string;
		save(options?: { format?: boolean }): Promise<[undefined, undefined | false]>;
	}

	type OverrideSet = RootOverrideSet | ChildOverrideSet;

	interface BaseOverrideSet {
		parent?: OverrideSet;
		children: Map<string, ChildOverrideSet>;
		getEdgeRule(edge: Edge): OverrideSet;
		getNodeRule(edge: Node): OverrideSet;
		getMatchingRule(edge: Node): OverrideSet | null;
		ancestry(): Generator<OverrideSet, void>;
		readonly isRoot: boolean;
		get ruleset(): Map<string, ChildOverrideSet>;
	}

	interface RootOverrideSet extends BaseOverrideSet {
		readonly isRoot: true;
		parent?: undefined;
	}

	interface ChildOverrideSet extends BaseOverrideSet {
		readonly isRoot: false;
		parent: OverrideSet | ChildOverrideSet;
		name: string;
		key: string;
		keySpec: string;
		value: string;
	}

	interface Inventory extends Omit<Map<string, Node>, 'delete' | 'set' | 'has'> {
		get primaryKey(): string;
		get indexes(): string[];
		filter(fn: (node: Node) => boolean): Generator<Node, void>;
		add(node: Node): void;
		delete(node: Node): void;
		query(key: string, val: string | undefined): Set<Node>;
		query(key: string): IterableIterator<string | undefined>;
		has(node: Node): boolean;
		set?(k: never, v: never): never;
	}

	interface Explanation {
		name: string;
		version: string;
		errors?: Error[];
		package?: PackageJsonType;
		whileInstalling?: { name: string; version: string; path: string };
		location?: string;
		isWorkspace?: boolean;
		dependents?: DependencyExplanation[];
		linksIn?: DependencyExplanation[];
	}

	interface DependencyExplanation {
		type: string | null;
		name: string;
		spec: string;
		rawSpec?: string;
		overridden?: boolean;
		bundled?: boolean;
		error?: DependencyProblem;
		from?: Node;
	}

	interface PackageLockBase {
		name: string;
		version?: string;
		lockfileVersion: number;
		requires?: boolean;
		packages?: Record<string, unknown>;
		dependencies?: Record<string, unknown>;
	}

	interface PackageLockV1 extends PackageLockBase {
		lockfileVersion: 1;
		dependencies: NonNullable<PackageLockBase['dependencies']>;
		packages?: never;
	}

	interface PackageLockV2 extends PackageLockBase {
		lockfileVersion: 2;
		dependencies: NonNullable<PackageLockBase['dependencies']>;
		packages: NonNullable<PackageLockBase['packages']>;
	}

	interface PackageLockV3 extends PackageLockBase {
		lockfileVersion: 3;
		dependencies?: never;
		packages: NonNullable<PackageLockBase['packages']>;
	}

	type PackageLock = PackageLockV1 | PackageLockV2 | PackageLockV3;
}

export = Arborist;
