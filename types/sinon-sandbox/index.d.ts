// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/58062
declare module 'sinon-sandbox' {
    import { createSandbox } from 'sinon';
    const sandbox: ReturnType<typeof createSandbox>;
    export = sandbox;
}