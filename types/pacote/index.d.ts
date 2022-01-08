import type { Packument } from 'pacote';

declare module 'pacote' {
    // TODO: remove once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/58059 is released
    export interface PacoteOptions {
        packumentCache?: Map<string, Packument>;
    }
}