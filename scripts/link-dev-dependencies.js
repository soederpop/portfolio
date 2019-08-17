const runtime = require('@skypager/node')

main()

async function main() {

  // i think we can remove the copy / vendor package.json as they're not needed with our new deployment system
  const projectRoots = await runtime.fsx.readdirAsync(
    runtime.resolve('apps')
  )

  const linkDep = name =>
    Promise.all(
      projectRoots.map(subfolder =>
        runtime.fsx
          .ensureSymlinkAsync(
            // this could be dynamic and we can add a list of dev dependencies to link
            runtime.resolve('node_modules', '.bin', name),
            runtime.resolve('apps', subfolder, 'node_modules', '.bin', name)
          )
          .catch(error => {})
      )
    )

  //  await linkDep('serve')
  await linkDep('webpack')
  await linkDep('webpack-dev-server')
  await linkDep('skypager')
  await linkDep('mocha-webpack')
  await linkDep('mocha')
  await linkDep('babel')
}
