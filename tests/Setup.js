// The ServiceWorker is not built for the tests. Without this, its registration in common.js fails with a 404, which
// newer Jasmine versions report as an unhandled promise rejection, failing the test run.
Object.defineProperty(navigator, 'serviceWorker', { value: undefined });
