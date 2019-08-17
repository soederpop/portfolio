const runtime = require("@skypager/node").use(require('@skypager/features-browser-vm'));
const { blocks } = require("../config");

const { colors } = runtime.cli

const only = runtime.lodash.castArray(runtime.argv.only).filter(v => v && v.length)

main()

async function main() {
  const captureSections = Object.keys(blocks).filter(groupName => !only.length || only.indexOf(groupName) > -1)
  for(let section of captureSections) {
    await expandSection(section)
  }
}

async function expandSection(section) {
  const config = blocks[section]

  const folderName = runtime.stringUtils.kebabCase(section).toLowerCase()
  const fileNamePrefix = runtime.stringUtils.kebabCase(runtime.stringUtils.singularize(section))
  const classNamePrefix = fileNamePrefix.replace(/-/g,'_')
  
  console.log(`Expanding ${colors.bold(section)} elements`)
  console.log(`  ${colors.green(config[1])} elements total.`)
  console.log(`  class prefix: ${colors.cyan(classNamePrefix)}`)
  console.log(`  output files: ${colors.magenta(`${folderName}/${fileNamePrefix}-*.html`)}.`) 
  console.log('')

  await runtime.fsx.mkdirpAsync(
    runtime.resolve('blocks', folderName)
  )

  const content = await runtime.fsx.readFileAsync(
    runtime.resolve('blocks', 'combined', `${section}.html`)
  ).then(b => String(b))

  const dom = runtime.browserVm.createMockDOM({ domContent: content })

  const sections = Array.from(new Array(config[1])).map((k,i) => `.${classNamePrefix}_${i + 1}`)

  let index = 1
  for(let selector of sections) {
    const element = dom.window.document.querySelectorAll(selector)[0]
    const outputPath = runtime.resolve('blocks', folderName, `${fileNamePrefix}-${index}.html`)
    await runtime.fsx.writeFileAsync(outputPath, `${String(element.outerHTML).trim()}\n`)
    index = index + 1
  }
}
