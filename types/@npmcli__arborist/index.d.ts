declare module '@npmcli/arborist' {
    import type { PacoteOptions } from 'pacote';
    import npa from 'npm-package-arg';

    type Tree = { children: { values: typeof Array.prototype.values } };

    class Node {}

    class Link extends Node {}

    class Edge {
        static types: ['prod', 'dev', 'optional', 'peer', 'peerOptional', 'workspace'];
        static errors: ['DETACHED', 'MISSING', 'PEER LOCAL', 'INVALID'];
    }

    class Shrinkwrap {
        checkYarnLock: (spec: Parameters<typeof npa>[0], options?: {}) => ReturnType<typeof npa>
        reset: () => void
        load: /** @async */ () => Promise<object>
        delete: (nodePath: string) => void
        get: (nodePath: string) => unknown // data
        add: (node: Node) => void
        addEdge: (edge: Edge) => void
        commit: () => unknown // data
        toJSON: () => ReturnType<Shrinkwrap['commit']>
        toString: (options?: { format?: boolean }) => string
        save: /** @async */ (options?: Parameters<Shrinkwrap['toString']>[0]) => Promise<[void, void]>
    }

    class Arborist {
        constructor({}: {
            Arborist: typeof Arborist;
            fullMetadata?: PacoteOptions['fullMetadata'];
            packumentCache?: PacoteOptions['packumentCache'];
            path?: string;
        });

        loadActual({}: {
            fullMetadata?: PacoteOptions['fullMetadata'];
            packumentCache?: PacoteOptions['packumentCache'];
            update?: boolean | { all: boolean };
        }): Tree

        loadVirtual({}: {
            fullMetadata?: PacoteOptions['fullMetadata'];
            packumentCache?: PacoteOptions['packumentCache'];
            update?: boolean | { all: boolean };
        }): Tree

        buildIdealTree({}: {
            fullMetadata?: PacoteOptions['fullMetadata'];
            packumentCache?: PacoteOptions['packumentCache'];
            update?: boolean | { all: boolean };
        }): Tree

        static Arborist: Arborist
        static Node: Node
        static Link: Link
        static Edge: Edge
        static Shrinkwrap: Shrinkwrap
    }

    export { Node, Link, Edge, Shrinkwrap, Arborist}
    export default Arborist
}
