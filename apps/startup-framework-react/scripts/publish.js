const runtime = require('@skypager/node')

async function main() {
  const site = runtime.argv._[0] || 'bundles'

  const availableSites = await runtime.fsx.readdirAsync(
    runtime.resolve('dist')
  )

  if (site === 'bundles') {
    await publishBundles()
    process.exit(0)
  } else if (availableSites.indexOf(site) !== -1) {
    const url = await publishSite(site)

    if (runtime.argv.open) {
      console.log('Opening', url)
      await runtime.opener.openInBrowser(`https://${url}`)  
    }
  } else {
    console.error('Specify a site:')
    console.log(availableSites.join("\n"))
  }
}

async function publishSite(siteName) {
  const availableSourceSites = await runtime.fsx.readdirAsync(runtime.resolve('src', 'sites'))

  let url
  if (availableSourceSites.indexOf(siteName) === -1) {
    url = await publishStaticSite(siteName)
  } else {
    if (runtime.argv.build) {
      await runtime.proc.async.spawn('skypager', ['render-site', siteName], {
        stdio: 'inherit'
      })
    }
    const manifest = await runtime.fsx.readJsonAsync(
      runtime.resolve('src', 'sites', siteName, 'site.json')
    )
    const { name, homepage = `${name.split('/').pop()}.soederpop.com`, skypager = {} } = manifest
    url = await publishStaticSite(siteName, skypager.domain || homepage.replace('https://', ''))
  }

  return url
}

async function publishStaticSite(siteName, domain = `${siteName}.soederpop.com`) {
  await runtime.fsx.writeJsonAsync(runtime.resolve('dist', siteName, 'now.json'), {
    version: 1,
    name: `sf-${siteName}`,
    alias: domain,
  })

  await runtime.proc.async.spawn('now', ['--static'], {
    cwd: runtime.resolve('dist', siteName),
    stdio: 'inherit',
  })

  await runtime.proc.async.spawn('now', ['alias'], {
    cwd: runtime.resolve('dist', siteName),
    stdio: 'inherit',
  })

  return domain
}

async function publishBundles() {
  await Promise.all(['i','js','css','video'].map(folder => runtime.fsx.copyAsync(
    runtime.resolve('public', folder),
    runtime.resolve('dist', 'bundles', folder)
  )))
  await runtime.fsx.writeJsonAsync(
    runtime.resolve('dist', 'bundles', 'now.json'), {
      version: 1,
      name: "sf-bundles.soederpop.com",
      alias: "sf-bundles.soederpop.com"
    }
  )

  await runtime.proc.async.spawn('now', ['--static', '--name', 'sf-bundles.soederpop.com'], {
    cwd: runtime.resolve('dist', 'bundles'),
    stdio: 'inherit'
  })

  await runtime.proc.async.spawn('now', ['alias'], {
    cwd: runtime.resolve('dist', 'bundles'),
    stdio: 'inherit'
  })   
}

main()