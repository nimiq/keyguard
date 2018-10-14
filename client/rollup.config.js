// rollup.config.js
export default [
    {
        input: 'build/main.js',
        output: {
            file: 'dist/KeyguardClient.common.js',
            format: 'cjs',
            globals: { '@nimiq/rpc': 'rpc' }
        },
        external: [ '@nimiq/rpc' ],
    },
    {
        input: 'build/main.js',
        output: {
            file: 'dist/KeyguardClient.umd.js',
            format: 'umd',
            name: 'KeyguardClient',
            globals: { '@nimiq/rpc': 'rpc' }
        },
        external: [ '@nimiq/rpc' ]
    },
    {
        input: 'build/main.js',
        output: {
            file: 'dist/KeyguardClient.es.js',
            format: 'es',
            name: 'KeyguardClient',
            globals: { '@nimiq/rpc': 'rpc' }
        },
        external: [ '@nimiq/rpc' ]
    }
];
