require('babel-plugin-require-context-hook/register')()

const runtime = require('@skypager/node')
const framework = runtime.argv.dev ? require('./src') : require('./lib')
const blocksBundle = runtime.argv.dev
  ? require('./src/blocks').requireContexts
  : require('./lib/blocks').requireContexts

module.exports = runtime.use(framework).use(require('@skypager/helpers-document'))

runtime.blocks.import(blocksBundle)

runtime.use(async function registerDocs(next) {
  await Promise.all([
    runtime.sites.discover(),
    runtime.frameworks.discover(),
    runtime.mdxDocs.discover()
  ])
  next()
})
