'use strict';

import path from 'path';
import BowerWebpackPlugin from 'bower-webpack-plugin';

// Output path
const dest = './build';
// Source path
const src = './src';
// Relative path
const relativeSrcPath = path.relative('.', src);

export const webpack = {
    entry: src + '/js/app.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    devtool: "source-map",
    resolve: {
        extensions: ['', '.js']
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    cacheDirectory: true,
                    presets: ['es2015']
                }
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader!postcss-loader"
            },
            {
                test: /\.(jpg|png)$/,
                loader: 'url-loader'
            }
        ]
    },
    plugins: [new BowerWebpackPlugin()],
    postcss: wpack => {
        return [
            require('postcss-import')({ addDependencyTo: wpack }),
            require('postcss-nested'),
            require('postcss-simple-vars'),
            require('precss'),
            require('autoprefixer'),
            require('cssnano')
        ];
    }
};

export const copy = {
    src: [
        src + '/www/index.html'
    ],
    dest: dest
};

export const watch = {
    js: relativeSrcPath + '/js/**',
    css: relativeSrcPath + '/css/**',
    www: relativeSrcPath + '/www/index.html'
};

export default {
    dest: dest,
    js: {
        src: src + '/js/**',
        dest: dest + '/js',
        uglify: false
    },
    webpack,
    copy,
    watch
};