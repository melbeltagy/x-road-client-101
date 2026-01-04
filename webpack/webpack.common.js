const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { hashElement } = require('folder-hash');
const MergeJsonWebpackPlugin = require('merge-jsons-webpack-plugin');
const utils = require('./utils.js');
const environment = require('./environment');

const getTsLoaderRule = () => {
  return [
    {
      loader: 'thread-loader',
      options: {
        // There should be 1 cpu for the fork-ts-checker-webpack-plugin.
        // The value may need to be adjusted (e.g. to 1) in some CI environments,
        // as cpus() may report more cores than what are available to the build.
        workers: require('os').cpus().length - 1,
      },
    },
    {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        happyPackMode: true,
      },
    },
  ];
};

module.exports = async options => {
  const development = options.env === 'development';
  const languagesHash = await hashElement(path.resolve(__dirname, '../src/main/webapp/i18n'), {
    algo: 'md5',
    encoding: 'hex',
    files: { include: ['*.json'] },
  });

  return merge({
    cache: {
      // 1. Set cache type to filesystem
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '../build/webpack'),
      buildDependencies: {
        // 2. Add your config as buildDependency to get cache invalidation on config change
        config: [
          __filename,
          path.resolve(__dirname, `webpack.${development ? 'dev' : 'prod'}.js`),
          path.resolve(__dirname, 'environment.js'),
          path.resolve(__dirname, 'utils.js'),
          path.resolve(__dirname, '../postcss.config.js'),
          path.resolve(__dirname, '../tsconfig.json'),
        ],
      },
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      modules: ['node_modules'],
      alias: utils.mapTypescriptAliasToWebpackAlias(),
      fallback: {
        path: require.resolve('path-browserify'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: getTsLoaderRule(options.env),
          include: [utils.root('./src/main/webapp/app')],
          exclude: [utils.root('node_modules')],
        },
      ],
    },
    stats: {
      children: false,
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        LOG_LEVEL: development ? 'info' : 'error',
      }),
      new webpack.DefinePlugin({
        I18N_HASH: JSON.stringify(languagesHash.hash),
        DEVELOPMENT: JSON.stringify(development),
        VERSION: JSON.stringify(environment.VERSION),
        SERVER_API_URL: JSON.stringify(environment.SERVER_API_URL),
      }),
      new ESLintPlugin({
        configType: 'flat',
        extensions: ['ts', 'tsx'],
      }),
      new ForkTsCheckerWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: './src/main/webapp/content/', to: 'content/' },
          { from: './src/main/webapp/favicon.ico', to: 'favicon.ico' },
          { from: './src/main/webapp/manifest.webapp', to: 'manifest.webapp' },
          { from: './src/main/webapp/robots.txt', to: 'robots.txt' },
        ],
      }),
      new HtmlWebpackPlugin({
        template: './src/main/webapp/index.html',
        chunksSortMode: 'auto',
        inject: 'body',
        base: '/',
      }),
      new MergeJsonWebpackPlugin({
        output: {
          groupBy: [
            { pattern: './src/main/webapp/i18n/en/*.json', fileName: './i18n/en.json' },
            { pattern: './src/main/webapp/i18n/fr/*.json', fileName: './i18n/fr.json' },
            { pattern: './src/main/webapp/i18n/et/*.json', fileName: './i18n/et.json' },
            { pattern: './src/main/webapp/i18n/de/*.json', fileName: './i18n/de.json' },
            { pattern: './src/main/webapp/i18n/fi/*.json', fileName: './i18n/fi.json' },
          ],
        },
      }),
    ],
  });
};
