export default async function selectFrameworks(chain, options = {}) {
  const docs = this.mdxDocs.available.filter(id => id.startsWith('frameworks/'))

  return chain.plant(docs)
    .map((id) => this.mdxDoc(id))
    .keyBy((v) => v.name.split('/').pop())
}