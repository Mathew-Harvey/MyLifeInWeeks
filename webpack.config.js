const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const dotenv = require('dotenv');

module.exports = () => {
    const env = dotenv.config().parsed;
    const envKeys = Object.keys(env).reduce((prev, next) => {
        prev[`process.env.${next}`] = JSON.stringify(env[next]);
        return prev;
    }, {});

    return {
        entry: './src/index.js', // Point this to your main JavaScript file
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'bundle.js'
        },
        plugins: [
            new webpack.DefinePlugin(envKeys),
            new HtmlWebpackPlugin({
                template: './docs/index.html' // Path to your HTML file
            })
        ],
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                    },
                },
            ],
        },
        // Add other configurations like devServer, etc.
    };
};
