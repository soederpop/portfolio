const loadSource = !!(
    process.env.NODE_ENV === 'test' ||
    process.argv.indexOf('console') > -1 ||
    process.argv.indexOf('--dev') > -1
)

const runtime = require('@skypager/node')

if (loadSource) {
  require('@babel/register')()
  require('babel-plugin-require-context-hook/register')()
}

const framework = loadSource
  ? require('./server')
  : require('./lib')

module.exports = runtime.use(framework)
