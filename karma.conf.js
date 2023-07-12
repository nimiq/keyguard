// Karma configuration

module.exports = function (/** @type {any} */ config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            'node_modules/@nimiq/core-web/web-offline.js',
            {pattern: 'node_modules/@nimiq/core-web/worker-wasm.wasm', included: false},
            {pattern: 'node_modules/@nimiq/core-web/worker-wasm.js', included: false},
            {pattern: 'node_modules/@nimiq/core-web/worker.js', included: false},
            'src/lib/*.js', // Force load of lib files before components and common.js
            'src/request/TopLevelApi.js', // Force load of TopLevelApi before BitcoinEnabledTopLevelApi
            'src/lib/bitcoin/*.js',
            'node_modules/ethers/dist/ethers.umd.js',
            'src/**/*.js',
            'tests/**/*.spec.js',
        ],

        // avoid calling runKeyguard and redirect page, only include local config
        exclude: [
            'src/request/**/index.js',
            'src/redirect.js',
            'src/config/config.!(local).js',
        ],


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'], //, 'coverage'],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            //'src/**/*.js': ['coverage']
        },


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['FirefoxHeadless', 'ChromeHeadless'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: 2,
    });
};
