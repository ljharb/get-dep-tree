declare module '@npmcli/arborist' {
    import type { Packument, PacoteOptions } from 'pacote';

    export type Tree = { children: { values: typeof Array.prototype.values } };

    export = class Arborist {
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

        static Node = class Node {}
    }
}
