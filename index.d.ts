import Arborist from '@npmcli/arborist';
import { manifest, Manifest, ManifestResult } from 'pacote';

// Internal replacer: the `Top` flag indicates whether T is the top-level
// Arborist.Node being mapped. When Top is true and T === Arborist.Node, we
// map its properties into a plain object (recursing), instead of emitting
// `TreeNode` immediately. For nested occurrences (Top = false), we replace
// Arborist.Node with the recursive `TreeNode` type.
type ReplaceArboristNodeInternal<T, Top extends boolean = false> =
    // exact match to Arborist.Node -> replace with TreeNode except at root
    [T] extends [Arborist.Node]
        ? Top extends true
            ? { [P in keyof T]: ReplaceArboristNodeInternal<T[P], false> }
            : TreeNode

    // functions: keep parameters, replace return types
    : T extends (...args: infer A) => infer R ? (...args: A) => ReplaceArboristNodeInternal<R, false>

    : T extends Promise<infer U> ? Promise<ReplaceArboristNodeInternal<U, false>>
    : T extends Generator<infer Y, infer R, infer N> ? Generator<ReplaceArboristNodeInternal<Y, false>, ReplaceArboristNodeInternal<R, false>, ReplaceArboristNodeInternal<N, false>>

    // Maps and Sets
    : T extends Map<infer K, infer V> ? Map<K, ReplaceArboristNodeInternal<V, false>>
    : T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<K, ReplaceArboristNodeInternal<V, false>>
    : T extends Set<infer U> ? Set<ReplaceArboristNodeInternal<U, false>>
    : T extends ReadonlySet<infer U> ? ReadonlySet<ReplaceArboristNodeInternal<U, false>>

    // Arrays / tuples
    : T extends Array<infer U> ? Array<ReplaceArboristNodeInternal<U, false>>
    : T extends ReadonlyArray<infer U> ? ReadonlyArray<ReplaceArboristNodeInternal<U, false>>

    // Objects: map over properties recursively
    : T extends object ? { [P in keyof T]: ReplaceArboristNodeInternal<T[P], false> }

    // fallback to identity
    : T;

// TreeNode: map the top-level Arborist.Node into an object shape, but for any
// nested Arborist.Node occurrences (inside properties) the replacer will
// substitute the recursive `TreeNode` type.
type TreeNodeBase = ReplaceArboristNodeInternal<Arborist.Node, true>;

// Override a few properties where runtime mutability or broader typing is
// expected by this module. Use Omit to replace those properties rather than
// intersecting, which would require compatibility with both types.
type TreeNode = Omit<TreeNodeBase, 'package' | 'root'> & {
    // module assigns arbitrary package manifests to `node.package`, but also
    // accepts the original PackageJsonType from Arborist.Node.
    // Includes both abbreviated and full manifest types (fullMetadata overload).
    package?: Arborist.Node['package'] | Awaited<ReturnType<typeof manifest>> | (Manifest & ManifestResult);
    // runtime sets `node.root = null` in prune(), so allow null here.
    // Include Arborist.Node for compatibility when assigning raw nodes.
    root: TreeNodeBase['root'] | null;
};

declare function getTree(
    mode: getTree.Mode,
    options?: getTree.Options,
): Promise<getTree.Tree>;

declare namespace getTree {
    type Mode = 'actual' | 'ideal' | 'virtual' | 'auto';
    type Tree = TreeNode;
    type Options = {
        dev?: boolean;
        peer?: boolean;
        production?: boolean;
        fullMetadata?: boolean;
        packumentCache?: NonNullable<ConstructorParameters<typeof Arborist>[0]>['packumentCache'];
        path?: string;
        logger?: typeof console.log;
    };
}

export = getTree;