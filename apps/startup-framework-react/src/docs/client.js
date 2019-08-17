export const interfaceMethods = ['processSnippet', 'processMdx', 'listFiles', 'loadSite', 'loadPage', 'updatePage']

export function getBaseUrl() {
  return `https://doc-helper.skypager.io`
}

export async function updatePage({ siteId, pageId, ...data }) {
  return this.client.put(`/api/pages/${siteId}/${pageId}`, data)
    .then(r => r.data)
}

export async function loadSite(siteId) {
  return this.client.get(`/api/sites/${siteId}`).then(r => r.data)
}

export async function loadPage({ siteId, pageId }) {
  return this.client.get(`/api/pages/${siteId}/${pageId}`).then(r => r.data)
}

export function processSnippet(options = {}) {
  return this.client.post(`/vm`, options).then(r => r.data)
}

export async function processMdx(options = {}) {
  if (options.file && !options.content) {
    await this.listFiles(options.file).then(({ path, content }) => {
      options.content = content
      options.filename = path
    })
  }

  return this.client.post(`/mdx`, options).then(r => r.data)
}

export function listFiles(pathId = '') {
  pathId = pathId.length ? `/${pathId}`.replace(/\/\//g, '/') : ''

  return this.client.get(`/api/file-manager${pathId}`).then(r => r.data)
}
