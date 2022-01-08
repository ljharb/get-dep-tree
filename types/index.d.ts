import type Arborist = require('@npmcli/arborist');

export type Mode = 'actual' | 'ideal' | 'virtual' | 'auto';

export type Logger = (x: unknown) => void;

export type Tree = ReturnType<Arborist['loadVirtual']> | ReturnType<Arborist['loadActual']> | ReturnType<Arborist['buildIdealTree']>

type ArboristConstructorOptions = Pick<ConstructorParameters<typeof Arborist>[0], 'fullMetadata' | 'packumentCache' | 'path'>;

export type GetTreeOptions = PruneOptions
    & ArboristConstructorOptions
    & {
        logger?: Logger;
    };

export type GetBaseTreeOptions = {
    mode: Mode;
    logger: Logger;
    arb: Arborist;
} & Required<Pick<ArboristConstructorOptions, 'fullMetadata' | 'packumentCache'>>;

export type PruneOptions = {
    dev?: boolean;
    peer?: boolean;
    production?: boolean;
}