export default async function selectSites(chain, options = {}) {
  chain = chain.get('sites.all')

  const { siteId } = options

  if (siteId) {
    const siteChain = chain.get(siteId)  
    const data = await this.appClient.loadSite(siteId)
    return siteChain.merge(data)
  } else {
    return chain
  }
}