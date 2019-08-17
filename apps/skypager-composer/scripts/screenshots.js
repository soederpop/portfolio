require('babel-plugin-require-context-hook/register')()

const runtime = require('@skypager/node')
const puppeteer = require('puppeteer')

const framework = runtime.argv.dev ? require('../src') : require('../lib')
const blocksBundle = runtime.argv.dev
  ? require('../src/blocks').requireContexts
  : require('../lib/blocks').requireContexts

const { singularize, camelCase, upperFirst } = runtime.stringUtils

runtime.use(framework)
runtime.blocks.import(blocksBundle)

let browser, page

const only = runtime.lodash.castArray(runtime.argv.only).filter(v => v && v.length)
main()

async function main() {
  browser = await puppeteer.launch({ 
    headless: false ,
    args: [`--window-size=1440,900`],
    defaultViewport: null,
    devtools: !!runtime.argv.devtools 
  })

  page = await browser.newPage()

  const captureBlocks = runtime.blocks.available
    .filter(id => !only.length || only.find(p => id.startsWith(p)))

  for(let blockId of captureBlocks) {
    await screenshotBlock(blockId)
  }

  await browser.close() 
}

async function screenshotBlock(blockId) {
  const [group, number] = blockId.split('/')
  const folderName = `${upperFirst(camelCase(singularize(group)))}${number}`
  const folder = runtime.resolve('src', 'blocks', group, folderName)

  await page.goto(`http://localhost:3001/preview/${blockId}`, { waitFor: 'networkidle2' })
  if (runtime.argv.scale) {
    await page.setViewport({
      scale: 1.5,
      height: 900,
      width: 1440
    })
  }
  
  const el = await page.$('body *:first-child')

  await new Promise((res) => setTimeout(res, 2200))

  await el.screenshot({
    path: runtime.resolve(folder, 'screenshot.png'),
    type: 'png'
  })

  await new Promise((res) => setTimeout(res, 300))
}
