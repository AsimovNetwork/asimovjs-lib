const webpack = require('webpack');
const path = require('path');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled UglifyJSPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin
 *
 */

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

function resolve(dir) {
    return path.join(__dirname, dir)
}
module.exports = {
    entry: {
        index: './src/index.ts'
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        library: "flowjs",
        libraryTarget: "umd"
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: [resolve('node_modules')]
        }, {
            test: /\.js$/,
            include: [path.resolve(__dirname, 'src')],
            loader: 'babel-loader',
            exclude: [resolve('node_modules')]
        }]
    },

    //mode: 'production',

    // optimization: {
    //     splitChunks: {
    //         cacheGroups: {
    //             vendors: {
    //                 priority: -10,
    //                 test: /[\\/]node_modules[\\/]/
    //             }
    //         },

    //         chunks: 'async',
    //         minChunks: 1,
    //         minSize: 30000,
    //         name: true
    //     }
    // },
    node: {
        // prevent webpack from injecting useless setImmediate polyfill because Vue
        // source contains it (although only uses it if it's native).
        setImmediate: false,
        // prevent webpack from injecting mocks to Node native modules
        // that does not make sense for the client
        dgram: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty'
    }
};