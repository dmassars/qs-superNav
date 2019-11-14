const webpack = require('webpack')
const WebpackCleanPlugin = require('clean-webpack-plugin')
const WebpackCopyPlugin = require('copy-webpack-plugin')
const WebpackZipPlugin = require('zip-webpack-plugin')
const WebpackDiskPlugin = require('webpack-disk-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const path = require('path')


const axios = require("axios");
const https = require('https')
const fs = require('fs')

const {last} = require('lodash')
const watch = require('node-watch');
_err = null;


// node --inspect ".\node_modules\webpack-dev-server\bin\webpack-dev-server.js" --env.PORT=8086 --env.development --env.build_output=build --progress

module.exports = (env = {}) => {

    const NAME = 'superNav'//path.basename(__dirname);
    const CWD = process.cwd()
    const BUILD_OUTPUT = env.build_output || 'build';
    const BUILD_DIR = path.resolve(BUILD_OUTPUT) // || path.resolve(CWD, 'build')
    const SRC_DIR = path.resolve(CWD, 'src')

    const PRODUCTION = env.production === true 
    const ENV = PRODUCTION ? 'production' : 'development'
    const ZIP_FILE = `${NAME}.zip`
    const PORT = 8086


    let config = {
        target: 'web',
        context: SRC_DIR,
        cache: true,
        mode: ENV,
        entry: {
            polyfill: 'babel-polyfill',
            [`${NAME}`]: ['./index.js']
        },
        output: {
            path: BUILD_DIR,
            filename: '[name].js',
            libraryTarget: 'amd',
            publicPath: `https://localhost:${PORT}/build/`
        },
        devtool: !PRODUCTION ? 'inline-source-map' : false,
        module: {
            rules: [
                // {
                //     test: /\.js$/,
                //     enforce: 'pre',
                //     loader: 'eslint-loader',
                //     options: {
                //       emitWarning: false,
                //     },
                // },
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                    // query: {
                    //     presets:    [ "es2015" ]
                    // }
                },
                {
                    test: /\.css$/,
                    use:  [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader',
                            options: { modules: false },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => ([
                                require('autoprefixer'),
                                require('precss'),
                                ]),
                            },
                        },
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: "style-loader",  // creates style nodes from JS strings
                            options: {
                                insertAt: 'top'
                            }
                        },
                        {
                            loader: 'css-loader', // translates CSS into CommonJS
                            options: {
                                sourceMap: false
                            }
                        },
                        "sass-loader" // compiles Sass to CSS
                    ]
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }]
                },
                {
                    test: /\.(png|jpg|gif)$/,
                    use: [
                        {
                          loader: 'file-loader',
                          options: {}
                        }
                      ]
                  },
                {
                    test: /\.html$/,
                    loader: 'raw-loader'
                },
            ]
        },
        resolve: {
            extensions: ['.js']
        },
        externals: [
            'qlik',
            'js/qlik',
            'jquery',
            'underscore',
            'ng!$q'
        ],
        plugins: [
            new webpack.optimize.ModuleConcatenationPlugin(),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(ENV)
            }),
            new WebpackCopyPlugin([{
                from: 'template.qext',
                to: path.resolve(BUILD_DIR, `${NAME}.qext`)
            }]),
        ],
        devServer: {
            contentBase: [`https://localhost:${PORT}/build/`],
            hot: true,
            https: true,
            historyApiFallback: true,
            hotOnly: true,
            port: PORT,
            headers: {
                "Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
            },
            overlay: {
                errors: true,
                warnings: false,
            },
        }
    }

    config.plugins.push(
        new WebpackZipPlugin({
            filename: ZIP_FILE,
        })
    )

    if(PRODUCTION) {

        config.plugins.unshift(
            new WebpackCleanPlugin([BUILD_DIR, ZIP_FILE])
        )
        config.optimization = {
            minimizer: [
                new UglifyJsPlugin()
            ]
        }

        config.devtool = false

    } else {
        // Development mode
        config.plugins.push(

            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
            new WebpackDiskPlugin({
                output: {
                    path: BUILD_OUTPUT
                },
                files: [
                    {
                        asset: /[name]/,
                        output: { 
                            filename: function(assetname) {
                                // excludes hot-updates from writing to disk to new file every time
                                const matches = assetname.match(/(hot-update\.(js|json))$/)
                                if(matches && matches.length > 0) {
                                    return matches[0];
                                }

                                return assetname;
                            }
                        }
                    }
                ]
            })
        );
    }

    return config;
}
