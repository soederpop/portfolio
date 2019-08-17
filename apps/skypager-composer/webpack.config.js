module.exports = {
  ...process.env.SITE_BUILD ? {
    target: 'node',
    node: {
      __filename: false,
      __dirname: false,
      process: false,
      global: false,
    }
  } : {
    target: 'web',
    externals: [{
      '@skypager/web': 'global skypager',
      '@skypager/runtime': 'global skypager',
      '@skypager/helpers-document/lib/skypager-document-editor': 'global SkypagerEditor',
      'react': 'global React',
      'react-dom': 'global ReactDOM'
    }]
  }
}
