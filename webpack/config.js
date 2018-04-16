const wp = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const { resolve, normalize } = require('path');
const sharp = require('sharp');
const pkg = require('../package.json');

const isProduction = process.env.NODE_ENV === 'production';
const zipFileName = `${pkg.name}-${pkg.version}.zip`;
const iconSizes = [16, 32, 48, 64];
/** @import webpack as wp */
/** @type {wp.Configuration} */
const defaultConfig = {
    mode: process.env.NODE_ENV || 'development',
    context: resolve(__dirname, '../src'),
    entry: {
        background: ['babel-polyfill', './background/index.js'],
        options: './options/index.js',
    },
    output: {
        path: resolve(__dirname, '../bin'),
        filename: 'script/[name].b.js',
    },
    plugins: [
        new CleanWebpackPlugin(['bin'], {
            verbose: true,
            root: resolve(__dirname, '..'),
        }),
        new HtmlWebpackPlugin({
            chunks: ['options'],
            inject: 'body',
            template: '../src/options/index.hbs',
            filename: 'options_page.html',
            pkg,
        }),
        new HtmlWebpackPlugin({
            template: '!!handlebars-loader!./src/manifest.template.hbs',
            filename: 'manifest.json',
            inject: false,
            minify: false,
            pkg,
        }),
        new CopyWebpackPlugin(iconSizes.map(size => ({
            from: 'assets/github-main.png',
            to: `assets/github-${size}x${size}.png`,
            cache: !isProduction,
            transform: (content, path) => {
                return sharp(content)
                    .resize(size, size)
                    .png()
                    .toBuffer()
            }
        }))),
        ...( isProduction ? [
            new ZipWebpackPlugin({
                path: '../release',
                filename: `${zipFileName}`,
            }),
        ] : []),
    ],
    module: {
        rules: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
        }, {
            test: /\.hbs$/,
            loader: 'handlebars-loader',
        }, {
            test: /\.gql$/,
            loader: 'graphql-tag/loader',
        }, {
            test: /\.(scss|sass)$/,
            use: [{
                loader: 'style-loader',
            }, {
                loader: 'css-loader',
            }, {
                loader: 'sass-loader',
            }]
        }]
    },
    devtool: !isProduction ? 'cheap-source-map' : '',
};

module.exports = defaultConfig;
