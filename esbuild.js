/*eslint-disable @typescript-eslint/no-var-requires */
const pkg = require("./package.json");
const { NodeGlobalsPolyfillPlugin } = require("@esbuild-plugins/node-globals-polyfill");
const { NodeModulesPolyfillPlugin } = require("@esbuild-plugins/node-modules-polyfill");
const esbuild = require("esbuild");
const GlobalsPlugin = require("esbuild-plugin-globals");


esbuild.build({
    entryPoints: ["dist/index.js"],
    bundle: true,
    outfile: pkg.browser,
    globalName: "TournamentAssistantClient",
    platform: "browser",
    define: {
        global: "window"
    },
    target: ["chrome60", "edge18", "firefox60", "safari11"],
    plugins: [
        GlobalsPlugin({
            ws: "WebSocket",
        }),
        NodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
    ],
});