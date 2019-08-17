/** 
 * This script will update the main repository README with auto-generated sections.
*/

const runtime = require('skypager')
  .use(require('@skypager/helpers-document'))
  .use((next) => runtime.mainScript.whenReady().then(() => next()))

const { clear, randomBanner, print } = runtime.cli

async function main() {
  clear()
  randomBanner('soederpop')

  await runtime.start()
  await runtime.mainScript.whenReady()
  await updateProjectsSection()
}

async function updateProjectsSection() {

  const statusDocs = await runtime.select('docs/route', 'apps/:name/STATUS')

  const projectsContent = statusDocs.map(doc => {
    const title = doc.title
    const link = doc.name.replace('/STATUS', '')
    const statusNode = doc.select('blockquote')
    const status = statusNode.length
      ? doc.stringify(statusNode[0])
      : 'In Development'

    const headings = doc.headingNodes

    let description = ''

    if (headings.length === 1) {
      description = doc.body.filter(({ type }) => type === 'paragraph').map(doc.stringify).join("\n")
    } else {
      const endHeading = headings[1] 
      description = doc.body
        .filter(({ type, position }) => type === 'paragraph' && position.start.line < endHeading.position.start.line).map(doc.stringify).join("\n")
    }

    console.log({ status })
    return [`### [${title}](${link})`, `> ${status}\n`, description].join("\n")
  }) 

  const readme = runtime.mdxDoc("README");
  await readme.process();

  const existingProjectsHeading = readme.headingNodes.find((node) => readme.stringify(node) === 'Projects')
  const endHeading = readme.findAllNodesAfter(existingProjectsHeading).find((node) => node.depth === 2)
  const currentLines = readme.content.split("\n")
  const startIndex = existingProjectsHeading.position.start.line - 1
  const endIndex = endHeading.position.start.line - 1
  // subtract 1 to not replace the next heading
  const distance = endIndex - startIndex - 1

  currentLines.splice(startIndex + 1, distance, ...projectsContent)

  await runtime.fsx.writeFileAsync(
    runtime.resolve('README.md'),
    currentLines.join("\n"),
    "utf8"
  )
}

main()