/// <reference types="node" />

export interface PackageDist {
	tarball: string;
	integrity?: string | undefined;
	shasum?: string | undefined;
	fileCount?: number | undefined;
	unpackedSize?: number | undefined;
	'npm-signature'?: string | undefined;
}

export interface Person {
	name: string;
	email?: string | undefined;
	url?: string | undefined;
}

export interface CommonMetadata {
	author?: Person | undefined;
	bugs?: {
		url?: string | undefined;
		email?: string | undefined;
	} | undefined;
	contributors?: Person[] | undefined;
	homepage?: string | undefined;
	keywords?: string[] | undefined;
	license?: string | undefined;
	maintainers?: Person[] | undefined;
	readme?: string | undefined;
	readmeFilename?: string | undefined;
	repository?: {
		type?: string | undefined;
		url?: string | undefined;
		directory?: string | undefined;
	} | undefined;
	users?: Record<string, boolean> | undefined;
}

export interface Manifest extends CommonMetadata {
	name: string;
	version: string;
	dist: PackageDist;
	dependencies?: Record<string, string> | undefined;
	optionalDependencies?: Record<string, string> | undefined;
	devDependencies?: Record<string, string> | undefined;
	peerDependencies?: Record<string, string> | undefined;
	bundledDependencies?: false | string[] | undefined;
	bin?: Record<string, string> | undefined;
	directories?: Record<string, string> | undefined;
	engines?: Record<string, string> | undefined;
	browser?: string | undefined;
	config?: Record<string, unknown> | undefined;
	cpu?: string[] | undefined;
	description?: string | undefined;
	files?: string[] | undefined;
	main?: string | undefined;
	man?: string | string[] | undefined;
	os?: string[] | undefined;
	publishConfig?: Record<string, unknown> | undefined;
	scripts?: Record<string, string> | undefined;
	deprecated?: string | undefined;
	_id: string;
	_nodeVersion?: string | undefined;
	_npmVersion?: string | undefined;
	_npmUser?: Person | undefined;
	[key: string]: unknown;
}

export type AbbreviatedManifest = Pick<
	Manifest,
	| 'name'
	| 'version'
	| 'bin'
	| 'directories'
	| 'dependencies'
	| 'devDependencies'
	| 'peerDependencies'
	| 'bundledDependencies'
	| 'optionalDependencies'
	| 'engines'
	| 'dist'
	| 'deprecated'
>;

export interface Packument extends CommonMetadata {
	name: string;
	versions: Record<string, Manifest>;
	'dist-tags': { latest: string } & Record<string, string>;
	time: Record<string, string> & {
		created: string;
		modified: string;
	};
}

export type AbbreviatedPackument = {
	versions: Record<string, AbbreviatedManifest>;
} & Pick<Packument, 'name' | 'dist-tags'>;

export interface FetchResult {
	from: string;
	resolved: string;
	integrity: string;
}

export interface ManifestResult {
	_from: string;
	_resolved: string;
	_integrity: string;
	_id: string;
}

export interface PackumentResult {
	_contentLength: number;
}

export interface Options {
	cache?: string | undefined;
	where?: string | undefined;
	resolved?: string | undefined;
	integrity?: string | undefined;
	umask?: number | undefined;
	fmode?: number | undefined;
	dmode?: number | undefined;
	preferOnline?: boolean | undefined;
	preferOffline?: boolean | undefined;
	offline?: boolean | undefined;
	before?: Date | null | undefined;
	defaultTag?: string | undefined;
	registry?: string | undefined;
	fullMetadata?: boolean | undefined;
	fullReadJson?: boolean | undefined;
	packumentCache?: Map<string, Packument> | undefined;
	tufCache?: string | undefined;
	defaultIntegrityAlgorithm?: string | undefined;
	allowGitIgnore?: boolean | undefined;
	npmBin?: string | undefined;
	npmInstallCmd?: string[] | undefined;
	npmCliConfig?: string[] | undefined;
	[key: string]: unknown;
}

export function resolve(spec: string, opts?: Options): Promise<string>;

export function extract(spec: string, dest?: string, opts?: Options): Promise<FetchResult>;

export function manifest(
	spec: string,
	opts: Options & ({ before: Date } | { fullMetadata: true }),
): Promise<Manifest & ManifestResult>;
export function manifest(spec: string, opts?: Options): Promise<AbbreviatedManifest & ManifestResult>;

export function packument(spec: string, opts: Options & { fullMetadata: true }): Promise<Packument & PackumentResult>;
export function packument(spec: string, opts?: Options): Promise<AbbreviatedPackument & PackumentResult>;

export function tarball(spec: string, opts?: Options): Promise<Buffer & FetchResult>;

export namespace tarball {
	function file(spec: string, dest: string, opts?: Options): Promise<FetchResult>;
	function stream<T>(spec: string, streamHandler: (stream: NodeJS.ReadableStream) => Promise<T>, opts?: Options): Promise<T>;
}

export class GitFetcher {}
export class RegistryFetcher {}
export class FileFetcher {}
export class DirFetcher {}
export class RemoteFetcher {}
