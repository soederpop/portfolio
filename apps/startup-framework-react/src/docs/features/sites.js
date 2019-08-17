import { Feature } from '@skypager/runtime'

export default class SitesManager extends Feature {
  static shortcut = 'sites'
  static isCacheable = true
  static isObservable = true

  site(id) {
    return this.chain.get('all').values().find(({ name }) => name === id ).value()
  }

  get all() {
    return this.sitesRegistry.allMembers()
  }

  afterInitialize() {
    this.sitesRegistry = Feature.createContextRegistry('sites', {
      context: require.context('../../sites', true, /site.json/),
      formatId: (id) => id.replace('/site', ''),
      wrapper: (mod, siteId) => ({
        ...mod,
        siteId
      })
    })
  }
}
