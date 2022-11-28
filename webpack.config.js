const path = require('path');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const dotenv = require('dotenv').config({
  path: 'ui/.env'
})

const isDevelopment = process.env.NODE_ENV !== 'production';

const outputDir = 'ui/dist';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: {
    main: './ui/src/index.tsx',
  },
  output: {
    path: path.join(__dirname, outputDir),
    filename: 'pibu.bundle.js?t=' + new Date().getTime(),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.graphql$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      },
      {
        test: /\.(tsx|ts)?$/,
        include: path.join(__dirname, 'ui/src'),
        use: [
          isDevelopment && {
            loader: 'babel-loader',
            options: { plugins: ['react-refresh/babel'] },
          },
          {
            loader: 'ts-loader',
            options: { 
              transpileOnly: true,
              configFile: "tsconfig.ui.json",
            },
          },
        ].filter(Boolean),
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      },
    ],
  },
  plugins: [
    isDevelopment && new ReactRefreshPlugin(),
    // isDevelopment && new webpack.HotModuleReplacementPlugin(),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: 'tsconfig.ui.json'
      }
    }),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './ui/public/index.html',
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(dotenv.parsed)
    }),
  ].filter(Boolean),
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  devServer: {
    port: 3001,
    host: '0.0.0.0',
    hot: true,
    https: true,
    cert: "./nginx/certs/bundle.crt",
    key: "./nginx/certs/bundle.key",
    disableHostCheck: true, // for local /etc/hosts file
    historyApiFallback: true
  },
  devtool: 'inline-source-map',
};
