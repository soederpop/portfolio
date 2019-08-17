export const requireContexts = {
  callToActions: require.context('./blocks', true, /call-to-actions.*[0-9].*index\.js$/),
  contacts: require.context('./blocks', true, /contacts.*[0-9].*index\.js$/),
  contents: require.context('./blocks', true, /contents.*[0-9].*index\.js$/),
  features: require.context('./blocks', true, /features.*[0-9].*index\.js$/),
  footers: require.context('./blocks', true, /footers.*[0-9].*index\.js$/),
  forms: require.context('./blocks', true, /forms.*[0-9].*index\.js$/),
  headers: require.context('./blocks', true, /headers.*[0-9].*index\.js$/),
  navigations: require.context('./blocks', true, /navigations.*[0-9].*index\.js$/),
  pricingTables: require.context('./blocks', true, /pricing-tables.*[0-9].*index\.js$/),
  showcases: require.context('./blocks', true, /showcases.*[0-9].*index\.js$/),
  teams: require.context('./blocks', true, /teams.*[0-9].*index\.js$/),
  testimonials: require.context('./blocks', true, /testimonials.*[0-9].*index\.js$/),
  ecommerces: require.context('./blocks', true, /ecommerces.*[0-9].*index\.js$/),
}

export default requireContexts
