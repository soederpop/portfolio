let BUILD_ENV = process.env.BUILD_ENV || process.env.NODE_ENV
let NODE_ENV = process.env.NODE_ENV || 'development'
let REQUIRE_CONTEXT_HOOK = process.env.REQUIRE_CONTEXT_HOOK

// not sure why it isn't picking it up from the package.json
if (!BUILD_ENV) {
  if (process.env.npm_lifecycle_event === "build:lib" || process.argv.indexOf('--dev') > -1) {
    BUILD_ENV = 'build'
  }
}

if (!REQUIRE_CONTEXT_HOOK) {
  if (['build:blocks', '_build:site', 'build:webapp'].indexOf(process.env.npm_lifecycle_event) > -1) {
    REQUIRE_CONTEXT_HOOK = 'false'
  }
}

const isESBuild = BUILD_ENV === 'build-es'
const isUMDBuild = BUILD_ENV === 'build-umd'
const isLibBuild = BUILD_ENV === 'build' || isESBuild || isUMDBuild || NODE_ENV === 'test'
const isDocsBuild = NODE_ENV === 'development' || NODE_ENV === 'production'

const browsers = [
  'last 8 versions',
  'safari > 8',
  'firefox > 23',
  'chrome > 24',
  'opera > 15',
  'not ie < 11',
  'not ie_mob <= 11',
]

const plugins = [
  REQUIRE_CONTEXT_HOOK !== 'false' && !isUMDBuild && isLibBuild && 'babel-plugin-require-context-hook',
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-export-namespace-from',
  '@babel/plugin-proposal-export-default-from',
  '@babel/plugin-proposal-object-rest-spread',
  [
    '@babel/plugin-transform-runtime',
    {
      regenerator: isDocsBuild,
    },
  ],

  /*
  // Plugins that allow to reduce the target bundle size
  'lodash',
  'transform-react-handled-props',
  [
    'transform-react-remove-prop-types',
    {
      mode: isUMDBuild ? 'remove' : 'wrap',
      removeImport: isUMDBuild,
    },
  ],
  // A plugin for react-static
  isDocsBuild && [
    'universal-import',
    {
      disableWarnings: true,
    },
  ],
  // A plugin for removal of debug in production builds
  isLibBuild && [
    'filter-imports',
    {
      imports: {
        './makeDebugger': ['default'],
        '../../lib': ['makeDebugger'],
      },
    },
  ],
  */
].filter(Boolean)

module.exports = () => ({
  compact: false,
  presets: [
    [
      '@babel/env',
      {
        modules: isESBuild || isUMDBuild ? false : 'commonjs',
        targets: {
          ...(isLibBuild && { node: '8.0.0' }),
          browsers,
        },
      },
    ],
    '@babel/react',
  ],
  plugins,
  /*
  env: {
    development: {
      plugins: ['react-hot-loader/babel'],
    },
    test: {
      plugins: [['istanbul', { include: ['src'] }]],
    },
  },
  */
})
