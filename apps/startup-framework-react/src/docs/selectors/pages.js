export default async function selectPage(chain, options = {}) {
  const { pageId, siteId } = options

  if (pageId && siteId) {
    const siteChain = chain.get('sites.all').get(siteId)  
    const data = await this.appClient.loadSite(siteId)
    const page = await this.appClient.loadPage({ siteId, pageId })
    
    return siteChain.merge(data).thru((site) => ({
      site,
      page
    }))
  }
}