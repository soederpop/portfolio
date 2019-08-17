const runtime = require('@skypager/node')
const request = require('request-promise')
const puppeteer = require('puppeteer')
const { blocks } = require('../config')

let browser, page

main()

async function main() {
  browser = await puppeteer.launch({ 
    headless: false ,
    args: [`--window-size=1440,900`],
    defaultViewport: null,
    devtools: true
  })
  page = await browser.newPage()

  await loginToSite({
    username: runtime.argv.username,
    password: runtime.argv.password 
  })

  const pages = runtime.argv._

  const structure = pages.map(pageId => {
    const [group, number] = pageId.split('/') 
    const config = blocks[group] || blocks[runtime.stringUtils.camelCase(group)]

    const [id] = config

    return `${id}:${parseInt(number,10) - 1}`
  }).join(',')

  await runtime.argv.edit
    ? openBuild(structure)
    : openPreview(structure)
}

function sleep(delay = 1000) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function openBuild(structure) {
  const url = `https://designmodo.com/startup/app/#structure=${structure}&subset=latin&fH=Poppins&fHW=700&fM=Poppins&fMW=400&CA1=25DAC5&CA2=482BE7&CA3=E93A7D&CB1=1E0E62&CB2=919DAB&CB3=ffffff&CB4=EBEAED&CBg1=2F1893&CBg2=ffffff&anim=on&animSpeed=6&animStyle=FadeDown`
  await page.goto(url, { waitFor: 'networkidle2' })

}

async function openPreview(structure) {
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