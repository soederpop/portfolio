const runtime = require('@skypager/node')

async function main() {
  const theme = runtime.argv._[0]

  await runtime.proc.async.spawn('skypager',
    ['build', '--project-type', 'library', '--no-framework', '--app-entry', `src/themes/${theme}/index.js`, '--app-name', `themes/${theme}`, '--css-filename', '[name].css', '--no-minify-js', '--force', '--no-clean'], {
      stdio: 'inherit'
    }
  ).catch((error) => {
    console.error('Error building theme')
    process.exit(1)
  })

}

main()