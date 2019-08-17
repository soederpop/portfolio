skypager.selectors.register('docs/route', () => selectDocsByRoute)

module.exports = {
  async start(runtime) {
    const runtime = this
    runtime.use(
      require(runtime.packageFinder.attemptResolve('@skypager/helpers-document'))
    )
    console.log('starting doc')
    await runtime.mdxDocs.discover()
  }
}

async function selectDocsByRoute(chain, route) {
  if (!this.currentState.mdxDocsLoaded) {
    await this.mdxDocs.discover()
    this.state.set('mdxDocsLoaded', true)
  }  

  route = String(route).match(/\.md$/)
    ? route
    : `${route}.md`

  const matches = this.fileManager.chains
    .route(route)
    .map((file) => this.mdxDoc(file.relative.replace('.md', '')))
    .value()

  await Promise.all(matches.map(m => m.process()))

  return chain.plant(matches)
}