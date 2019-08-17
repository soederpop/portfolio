const runtime = require('@skypager/node')

async function main() {
  const { _: args = [], boilerplate = 'startup-framework-site' } = runtime.argv
  const name = args[0]

  if (!name || !name.length) {
    console.error('Must specify a name')
    process.exit(0)
  }

  const siteName = runtime.stringUtils.kebabCase(name.toLowerCase())
  const sitesFolder = runtime.argv.siteFolder || runtime.resolve('src', 'sites')
  const siteFolder = runtime.resolve(sitesFolder, name)

  const exists = await runtime.fsx.existsAsync(siteFolder)

  if (exists) {
    console.error('A site with this name already exists.')
    process.exit(1)
  }

  const boilerplateLocation = runtime.resolve('src', 'boilerplates', boilerplate)
  const tempDest = runtime.resolve(sitesFolder, boilerplate)

  console.log({ boilerplateLocation, tempDest, boilerplate, siteFolder, sitesFolder })

  await runtime.fsx.copyAsync(
    boilerplateLocation,
    tempDest
  )

  await runtime.fsx.moveAsync(
    tempDest,
    siteFolder
  )

  const manifest = runtime.resolve(siteFolder, 'package.json')
  const pkg = await runtime.fsx.readJsonAsync(manifest)

  pkg.name = `@soederpop/websites-${siteName}`
  pkg.homepage = runtime.argv.homepage || `https://sf-${siteName}.soederpop.com`

  await runtime.fsx.writeFileAsync(manifest, JSON.stringify(pkg, null, 2))
}

main()