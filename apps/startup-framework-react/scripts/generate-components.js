const runtime = require("@skypager/node").use(require('@skypager/features-browser-vm'));
const HTML = require('html2jsx').default

const { blocks } = require("../config");
const only = runtime.lodash.castArray(runtime.argv.only).filter(v => v && v.length)

const baseOutputFolder = runtime.resolve('src', 'blocks')

main()

let docs = []

async function main() {
  await runtime.fsx.mkdirpAsync(baseOutputFolder)
  await runtime.fileManager.startAsync()
  const captureSections = Object.keys(blocks).filter(groupName => !only.length || only.indexOf(groupName) > -1)

  for(let section of captureSections) {
    await generateComponents(section)
  }
}

async function generateDocs({ sourceContent, section, folderName, componentName }) {
  docs.push(`runtime.mdxDocs.register("${folderName}/${componentName}", () => require("../blocks/${folderName}/${componentName}/README.md"))`)

  const codeBlock = [
    "```javascript",
    sourceContent.trim().split("\n").filter(line => !line.match('<!--')).join("\n"),
    "```"
  ].join("\n")

  return `
---
section: ${section}
folder: ${folderName}
---
# ${componentName}

## Preview

![Desktop Screenshot](./screenshot.png)

## HTML Source

${codeBlock}
  
  `.trim()
}

async function generateComponents(section) {
  console.log(`Generating Components for ${section}`)
  const folderName = runtime.stringUtils.kebabCase(section).toLowerCase()
  const inputs = runtime.fileManager.chains.patterns(`blocks/${folderName}/*.html`).mapValues('path').entries().value()

  const outputFolder = runtime.resolve(baseOutputFolder, folderName)
  await runtime.fsx.mkdirpAsync(
    outputFolder
  )

  const results = []

  for(let input of inputs) {
    const [sourceInput, sourcePath] = input
    const componentName = runtime.stringUtils.upperFirst(runtime.stringUtils.camelCase(sourceInput.split('/').pop().replace('.html', '')))
    
    const sourceContent = await runtime.fsx.readFileAsync(sourcePath).then(b => String(b))
    const content = await wrap(sourceContent, { name: componentName })

    results.push({ componentName, sourcePath })

    if (runtime.argv.folders !== false) {
      await runtime.fsx.mkdirpAsync(
        runtime.resolve(outputFolder, componentName)
      )
     
      const docs = await generateDocs({ sourceContent, componentName, section, folderName })
        
      await runtime.fsx.writeFileAsync(
        runtime.resolve(outputFolder, componentName, 'README.md'),
        `${docs}\n`,
        'utf8'
      )

      await runtime.fsx.writeFileAsync(
        runtime.resolve(outputFolder, componentName, 'index.js'),
        content,
        'utf8'
      )     
    } else {
      await runtime.fsx.writeFileAsync(
        runtime.resolve(outputFolder, `${componentName}.js`),
        content,
        'utf8'
      )
    }
  }

  return runtime.lodash.uniqBy(results, 'componentName')
}

async function wrap(sourceContent, options = {}) {
  const { transform, name } = options

  sourceContent = sourceContent
    .replace( /src="i\//g, 'src="/i/' )
    .replace( /srcset="i\//g, 'srcset="/i/' )

  const { default: html2jsx } = require('html2jsx')

  const dom = runtime.browserVm.createMockDOM({ domContent: `<html><body>${sourceContent}</body></html>` })

  if (typeof transform === 'function') {
    sourceContent = await transform({ dom, sourceContent, name, options })    
  }

  global.window = dom.window
  global.document = dom.window.document
  
  const functionHeading = `function ${name}({ aos = {}, ...props }) {\n  const { duration = 150, animation = 'fade-down' } = aos\n`; 

  let es6 = `
import React from 'react'
import types from 'prop-types'

export ${html2jsx(sourceContent, { name })}

${name}.propTypes = {
  aos: types.shape({
    duration: types.number,
    animation: types.string
  })
}

export default ${name}
  `.trim()


  es6 = es6.replace(`function ${name} () {`, functionHeading)

  es6 = es6
    .replace(/\<head\>/g,'&lt;head&rt;')
    .replace(/\<\/head\>/g, '&lt;/head&gt;')
    .replace(/data-aos-init"=""/g, 'data-aos-init=""')
    .replace(/data-aos="fade-down"/g, 'data-aos={ animation }')
    .replace(/data-aos-duration="0"/g, 'data-aos-duration={ duration * 0 }')
    .replace(/data-aos-duration="150"/g, 'data-aos-duration={ duration }')
    .replace(/data-aos-duration="300"/g, 'data-aos-duration={ duration * 2 }')
    .replace(/data-aos-duration="450"/g, 'data-aos-duration={ duration * 3 }')
    .replace(/data-aos-duration="600"/g, 'data-aos-duration={ duration * 4 }')
    .replace(/data-aos-duration="750"/g, 'data-aos-duration={ duration * 5 }')
    .replace(/data-aos-duration="900"/g, 'data-aos-duration={ duration * 6 }')
    .replace(/data-aos-duration="1050"/g, 'data-aos-duration={ duration * 7 }')
    .replace(/data-aos-duration="1200"/g, 'data-aos-duration={ duration * 9 }')
    .replace(/data-aos-delay="0"/g, 'data-aos-delay={ duration * 0 }')
    .replace(/data-aos-delay="150"/g, 'data-aos-delay={ duration }')
    .replace(/data-aos-delay="300"/g, 'data-aos-delay={ duration * 2 }')
    .replace(/data-aos-delay="450"/g, 'data-aos-delay={ duration * 3 }')
    .replace(/data-aos-delay="600"/g, 'data-aos-delay={ duration * 4 }')
    .replace(/data-aos-delay="750"/g, 'data-aos-delay={ duration * 5 }')
    .replace(/data-aos-delay="900"/g, 'data-aos-delay={ duration * 6 }')
    .replace(/data-aos-delay="1050"/g, 'data-aos-delay={ duration * 7 }')
    .replace(/data-aos-delay="1200"/g, 'data-aos-delay={ duration * 9 }')

  es6 = es6.split("\n").filter(line => line.replace(/\s/g, '').trim().length > 0).join("\n")
  
  return `${es6}\n`
}