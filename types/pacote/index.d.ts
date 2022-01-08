declare module 'pacote' {
    import { Packument, manifest } from 'pacote';

    // TODO: remove once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/58059 is released
    interface PacoteOptions {
        packumentCache?: Map<string, Packument>;
    }

    export { manifest };
}