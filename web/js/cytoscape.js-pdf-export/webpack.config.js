const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// most of the config is for pdfkit (https://github.com/foliojs/pdfkit/tree/master/examples/webpack)

const baseConfig = {
  entry: path.resolve(__dirname, 'src/pdf-export.js'),
  plugins: [
    // new HtmlWebpackPlugin({
    //   template: path.resolve(__dirname, 'src/index.html')
    // }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ],
  resolve: {
    alias: {
      // maps fs to a virtual one allowing to register file content dynamically
      fs: 'pdfkit/js/virtual-fs.js',
      // iconv-lite is used to load cid less fonts (not spec compliant)
      'iconv-lite': false
    },
    fallback: {
      // crypto module is not necessary at browser
      crypto: false,
      // fallbacks for native node libraries
      buffer: require.resolve('buffer/'),
      stream: require.resolve('readable-stream'),
      zlib: require.resolve('browserify-zlib'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/')
    }
  },
  module: {
    rules: [
      // bundle and load afm files verbatim
      { test: /\.afm$/, type: 'asset/source' },
      // convert to base64 and include inline file system binary files used by fontkit and linebreak
      {
        enforce: 'post',
        test: /fontkit[/\\]index.js$/,
        loader: 'transform-loader',
        options: {
          brfs: {}
        }
      },
      {
        enforce: 'post',
        test: /linebreak[/\\]src[/\\]linebreaker.js/,
        loader: 'transform-loader',
        options: {
          brfs: {}
        }
      }
    ]
  }
};

const normal = {
  ...baseConfig,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: pkg.name + '.js',
  },
};

const commonjs = {
  ...baseConfig,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: pkg.name + '-cjs.js',
    libraryTarget: 'commonjs-module',
  },
};

module.exports = [normal, commonjs];