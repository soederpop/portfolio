const runtime = require('@skypager/node')

const { upperFirst, camelCase, kebabCase, singularize } = runtime.stringUtils
const { uniq } = runtime.lodash

async function main() {
  const { name, site } = runtime.argv
  const components = runtime.argv._

  if (!components.length) {
    console.error('Must specify components')
    process.exit(1)
  }
  
  if (!name || !name.length) {
    console.error('Must specify a name via the --name flag')
    process.exit(1)
  }

  if (!site || !site.length) {
    console.error('Must specify a site name using the --site flag')
    process.exit(1)
  }
  
  const siteName = kebabCase(site.toLowerCase())
  const siteFolder = runtime.resolve('src', 'sites', siteName)

  await runtime.fsx.mkdirpAsync(siteFolder)

  await runtime.fsx.mkdirpAsync(
    runtime.resolve(siteFolder, 'pages')
  ) 

  let pageName = upperFirst(camelCase(kebabCase(name)))

  if (!pageName.endsWith('Page')) {
    pageName = `${pageName}Page`
  }
  
  const pagePath = runtime.resolve(siteFolder, 'pages', `${pageName}.js`)

  const pageImports = uniq(components.map(c => `import ${cName(c)} from '${cPath(c)}'`)).join("\n")
  const pageElements = components.map(c => `      <${cName(c)} />`).join("\n")
  const pageRoute = runtime.argv.route || runtime.argv.path || `/${runtime.stringUtils.kebabCase(pageName.replace(/Page$/,''))}`

  const pageContent = `
import React, { Fragment } from 'react'

${pageImports}

export const path = '${pageRoute}'

export const exact = true

export default function ${pageName}(props = {}) {
  return (
    <Fragment>
${pageElements}
    </Fragment>
  )
} 
  ` 

  console.log(`Generating page ${pagePath}`)
  await runtime.fsx.writeFileAsync(
    pagePath,
    pageContent
  )

  if (runtime.argv.rebuild !== false && runtime.argv.build !== false) {
    await runtime.proc.async.spawn('skypager', ['render-site', siteName, '--build'], {
      stdio: 'inherit',
    })    
  }
}

function cName(componentId) {
  const [groupName, number] = componentId.split('/')  
  return `${upperFirst(camelCase(singularize(groupName)))}${number}`
}

function cPath(componentId) {
  const [groupName, number] = componentId.split('/')  
  return `../../../blocks/${groupName}/${upperFirst(camelCase(singularize(groupName)))}${number}` 
}

main()