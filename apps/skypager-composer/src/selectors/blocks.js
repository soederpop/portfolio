export default async function selectBlocks(chain, options = {}) {
  const { frameworkId = "startup" } = options

  return chain
    .get('mdxDocs.available', [])
    .filter(id => id.startsWith(frameworkId) && id.match(/s\//))
    .groupBy(id => id.split('/')[1]) 
}