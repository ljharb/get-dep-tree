declare module '@npmcli/arborist' {
    import type { PacoteOptions } from 'pacote';

    type Tree = { children: { values: typeof Array.prototype.values } };

    class Node {}

    class Arborist {
        constructor({}: {
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

        static Node: Node
    }

    export = Arborist
}
