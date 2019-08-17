const runtime = require('@skypager/node')
  .use(require('@skypager/helpers-document'))
  .use((next) => {
    runtime.scripts.discover().then(() => next())
  })

async function main() {
  await runtime.start()
  const blocks = runtime.scripts.allInstances().filter(({ name }) => name.startsWith('src/blocks'))

  const withForms = blocks.filter(({ content }) => String(content).match(/form-handler\.php/))
  
  
  if (runtime.argv.interactive) {
    await Promise.all(
      withForms.map(s => s.parse())
    )
    await runtime.repl('interactive').launch({ runtime, withForms })
    return
  } else {
    console.log(`Out of ${blocks.length} total block components:`)
    console.log(`  Found ${withForms.length} with a form-handler`)

    await Promise.all(withForms.map(transformForm))
  }
}

async function transformForm(script) {
  await script.parse()

  const formNodes = script.findNodes({ type: 'JSXElement', }).filter(({ node }) => node.openingElement.name.name === 'form') 
  console.log(`Found ${formNodes.length} form node(s) in ${script.name}`)

  formNodes.forEach(({ node }) => {
    const actionAttribute = node.openingElement.attributes.find((attr) => attr.name && attr.name.name && attr.name.name === 'action')

    if (actionAttribute) {
      actionAttribute.value.value = '/api/handle-form'
    }
  })

  const newCode = await script.generateCode({ prettify: true })
  
  console.log(`  Modifying ${script.name}`)
  await runtime.fsx.writeFileAsync(
    script.file.path,
    newCode,
    'utf8'
  )
}

main()