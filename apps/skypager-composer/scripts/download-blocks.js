const runtime = require('@skypager/node')
const request = require('request-promise')
const puppeteer = require('puppeteer')
const { blocks } = require('../config')

let browser, page

const only = runtime.lodash.castArray(
  runtime.argv.only
).filter(v => v && v.length)

main()

async function main() {
  const captureSections = Object.keys(blocks).filter(groupName => !only.length || only.indexOf(groupName) > -1)

  browser = await puppeteer.launch({ 
    headless: false ,
    args: [`--window-size=1440,900`],
    defaultViewport: null,
    devtools: true
  })
  page = await browser.newPage()

  await loginToSite({
    username: runtime.argv.username || process.env.DESIGNMODO_USERNAME,
    password: runtime.argv.password || process.env.DESIGNMODO_PASSWORD 
  })
  

  if (runtime.argv.downloadHtml !== false) {
    for(let section of captureSections) {
      await capture(section)
      await sleep(3 * 1000) 
    }
  }

  if (runtime.argv.downloadAssets) {
    await downloadExport(runtime.argv.downloadAssets === true ? 'forms' : runtime.argv.downloadAssets)
  }

  await browser.close()
}

async function capture(section) {
  const config = blocks[section]
  const [id, count] = config
  const structure = Array.from( new Array(count) ).map((k,i) => `${id}:${i}`).join(',') 

  await preview(structure)

  const content = await page.content()

  await runtime.fsx.writeFileAsync(
    runtime.resolve('blocks', 'combined', `${section}.html`),
    content
  )

  return { [section]: { config, content }}
}

function sleep(delay = 1000) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function downloadExport(section) {
  const config = blocks[section];
  const [id, count] = config;

  const structure = Array.from( new Array(count) ).map((k,i) => `${id}:${i}`).join(',') 
  const url = `https://designmodo.com/startup/app/#structure=${structure}&subset=latin&fH=Poppins&fHW=700&fM=Poppins&fMW=400&CA1=25DAC5&CA2=482BE7&CA3=E93A7D&CB1=1E0E62&CB2=919DAB&CB3=ffffff&CB4=EBEAED&CBg1=2F1893&CBg2=ffffff&anim=on&animSpeed=6&animStyle=FadeDown`

  console.log('Opening App Page')
  await page.goto(url, { waitFor: 'networkidle2', timeout: 90 * 1000  })
  console.log('Network is idle, waiting 5 sec')
  await sleep(5 * 1000)

  await page.waitFor('#export')
  console.log('Clicking Export button, waiting for zip request')
  await page.$eval('#export', (button) => button.click())
  await sleep(500)
  
  console.log('Enabling Request Interception')
  await page.setRequestInterception(true);

  console.log('Clicked it. Waiting for zip request.')
  console.log('If this stalls out, refresh the puppeteer browser yourself and click on the export button')

  const xRequest = await new Promise(resolve => {
    page.on('request', request => {
      if (request._url.match(/designmodo.*\.zip$/)) {
        request.abort();
        resolve(request);          
      } else {
        request.continue()
      }
    });
  });

  const options = {
    encoding: null,
    method: xRequest._method,
    uri: xRequest._url,
    body: xRequest._postData,
    headers: xRequest._headers
  };

  console.log('Got zip request', options.uri)

  const cookies = await page.cookies();
  options.headers.Cookie = cookies.map(ck => ck.name + '=' + ck.value).join(';');

  console.log('Making Request')

  const outputFile = runtime.argv.name || 
    (runtime.argv.downloadAssets === true ? 'assets' : runtime.argv.downloadAssets) || 'assets'

  const response = await request(options);

  await runtime.fsx.mkdirpAsync(runtime.resolve('downloads'))
  await runtime.fsx.writeFileAsync(
    runtime.resolve('downloads', `${outputFile}.zip`),
    response
  )

  console.log('Saved Assets Export')
}

async function preview(structure) {
  await page.goto(
    `https://designmodo.com/startup/app/preview.php?structure=${structure}&subset=latin&fH=Poppins&fHW=700&fM=Poppins&fMW=400&CA1=25DAC5&CA2=482BE7&CA3=E93A7D&CB1=1E0E62&CB2=919DAB&CB3=ffffff&CB4=EBEAED&CBg1=2F1893&CBg2=ffffff&anim=on&animSpeed=6&animStyle=FadeDown`,
    {
      waitFor: "networkidle2"
    }
  );
}

async function loginToSite({ username, password }) {
  const loginUrl = "https://designmodo.com/my-account/sign-in/"  
  const usernameField = 'input[name="username"]' 
  const passwordField = 'input[name="password"]' 
  const rememberMeField = 'input[name="rememberme"]'
  const acceptanceField = 'input[name="acceptance"]'
  const loginButton = 'button[name="login"]'
  const agreeButton = '.button[data-dialog-action="close"]'

  await page.goto(loginUrl, { waitUntil: 'networkidle2' })

  await page.waitFor(usernameField);
  await page.waitFor(passwordField);
  await page.waitFor(acceptanceField);
  await page.waitFor(rememberMeField);
  await page.waitFor(loginButton);
  await page.waitFor(agreeButton);

  await page.click(agreeButton)

  // await page.type('input[name=search]', 'Adenosine triphosphate');
  await page.focus(usernameField)
  await page.keyboard.type(username)

  await page.focus(passwordField)
  await page.keyboard.type(password)

  await page.$eval(acceptanceField, el => (el.checked = true) );
  await page.$eval(rememberMeField, el => (el.checked = true) );
  await page.$eval(loginButton, (button) => button.click())
}