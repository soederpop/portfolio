const runtime = require('@skypager/node')
  .use(require('@skypager/helpers-document'))

const { upperFirst, camelCase, kebabCase, pluralize } = runtime.stringUtils

async function main() {
  await runtime.fileManager.startAsync()
  const components = await copyFiles() 
  await adjustImageTags(components)
}

async function adjustImageTags(components) {
  await runtime.scripts.discover()

  const withImages = await Promise.all(
    Array.from(components.values()).map(({ id, ...imageTags }) => 
      runtime.script(`src/blocks/${id}/index`, { imageTags })).map(script => script.parse().then(() => script)
    )
  )

  for(let script of withImages) {
    await modifyImageTags(script)
  }
}

async function modifyImageTags(script) {
  const imageTags = script.findNodes({ type: 'JSXElement' }).filter(({ node }) => node.openingElement.name.name === 'img')

  let content = script.content
  const imageConfig = script.tryGet('imageTags')

  // console.log(imageConfig)

  for(let imageTag of imageTags) {
    const srcAttribute = imageTag.node.openingElement.attributes.find((attr) => attr.name && attr.name.name === 'src')
    const srcSetAttribute = imageTag.node.openingElement.attributes.find((attr) => attr.name && attr.name.name === 'srcSet')

    if (srcAttribute && srcAttribute.value && srcAttribute.value.value.startsWith('/i')) {
      const original = srcAttribute.value.value
      const replace = script.extractSourceFromLocations(srcAttribute.loc, srcAttribute.loc).toString()
      const newFilename = imageConfig.files.find(file => file.original === original)

      if (newFilename) {
        content = content.replace(replace, `src={require("./images/${newFilename.newFilename}")}`)
      }
    }

    if (srcSetAttribute && srcSetAttribute.value && srcSetAttribute.value.value.startsWith('/i')) {
      const [original, magnification = '2x'] = String(srcSetAttribute.value.value).split(' ')
      const replace = script.extractSourceFromLocations(srcSetAttribute.loc, srcSetAttribute.loc).toString()
      const newFilename = imageConfig.files.find(file => file.original === original)

      if (newFilename) {
        content = content.replace(replace, `srcSet={require("./images/${newFilename.newFilename}") + " ${magnification}"}`)
      }
    }

    await runtime.fsx.writeFileAsync(
      script.file.path,
      content,
      'utf8'
    )
  }
} 


async function copyFiles() {
  const images = runtime.fileManager.fileObjects.filter(({ relative, ext }) => relative.startsWith('public') && ext.match(/(jpg|png|gif|mp4|svg)/))

  const components = new Map() 

  for(let file of images) {
    const parts = file.name.match(/^(.*_\d+)_(.*)/)

    if (parts && parts.length) {
      const componentId = upperFirst(camelCase(parts[1]))  
      const newFilename = parts[2].replace(/_/g,'-') + file.ext

      const group = pluralize(parts[1].split("_").reverse().slice(1).reverse().join("-"))
      const folder = runtime.resolve(
        'src',
        'blocks',
        group,
        componentId,
        'images'
      )

      const existing = components.get(`${group}/${componentId}`) || {
        id: `${group}/${componentId}`,
        imageFolder: folder,
        group,
        componentId, 
        files: []
      }

      components.set(`${group}/${componentId}`, {
        ...existing,
        id: `${group}/${componentId}`,
        imageFolder: folder,
        group,
        componentId,
        files: existing.files.concat([ { newFilename, original: `/i/${file.path.split('/').pop()}` } ]) 
      })

      await runtime.fsx.mkdirpAsync(folder)
      await runtime.fsx.copyAsync(
        file.path,
        runtime.resolve(folder, newFilename)
      )
    }
  }

  return components
}

main()