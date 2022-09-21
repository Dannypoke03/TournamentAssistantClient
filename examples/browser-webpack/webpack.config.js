const path = require("path");

module.exports = {
    resolve: {
        extensions: ['*', '.js'],
    },
    entry: "./index.js",
    // Webpack now produces builds that are incompatible with IE11:
    // https://webpack.js.org/migrate/5/#turn-off-es2015-syntax-in-runtime-code-if-necessary
    target: ['web', 'es5'],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    mode: 'production',
};