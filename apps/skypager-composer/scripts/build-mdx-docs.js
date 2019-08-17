const runtime = require('../runtime') 

async function main() {
  await runtime.start()
  const allBlocks = runtime.blocks.allInstances()

  const docLines = allBlocks.map((block) => {
    const blockId = block.script.name.replace('src/blocks/', '').replace('/index.js', '')
    const filename = block.script.name.replace('src/blocks/', '../blocks/').replace('/index.js', '/README.md')
    return `  reg("${blockId}", () => require("${filename}"))`
  })

  const outputPath = runtime.resolve('src', 'docs', 'mdx-docs.js')
  await runtime.fsx.writeFileAsync(
    outputPath,
    `
export function attach(runtime) {
  const reg = (id, c) => runtime.mdx.docs.register("startup/" + id, c)
${runtime.lodash.uniq(docLines).join("\n")}
}
    `
  )  
}

main()