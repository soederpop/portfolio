# Startup Framework as React Components

The Startup Framework is Copyright by [DesignModo](https://designmodo.com). You need a license to the app to use the project.  

[Buy one here](https://designmodo.com/startup) it is money well spent!

This downloads all of the different blocks from their app generator, and dumps them as HTML. It then converts those to React Components.

You can use this project scaffolding to generate many static websites.

## Current Status

This project will convert all of the blocks and download all of the assets.  You can edit each block as a React component by hand.

You can create any number of sites, which are collections of pages.  A page is a collection of blocks.

You can then render that entire site as a static html website, powered by jquery and bootstrap.  No react or anything else is required to use it.

My plan is to convert each block to use react-i18n.

You can build sites by declaring pages as collections of blocks, as usual.

Based on which blocks get selected, i18n definition files will be generated. 

Editing these i18n files will dynamically control the block content, while leveraging the already thought out beautiful design of this design library.

This will allow you to reuse blocks without editing them, when all you need to do is control the content.

## Downloading the Blocks

Once you've purchased your license to the startup framework, this project will use puppeteer to download all of the blocks, and store
them in categorized folders that match what the startup framework provides.

- headers
- footers
- contents
- call-to-actions
- etc, etc

It will then convert these HTML blocks to React components, and download the assets.

## Changing your theme

A theme is a just a set of less variables that can be used to generate a startup framework css file from their sass source files.

## Generating an HTML page

```shell
$ yarn build:page --name contact-us headers/1 contents/1 contents/2 contents/3 forms/1 footers/1
```

## Creating a Site 

```shell
$ yarn create:site my-site
```

## Development

This uses puppeteer to download the latest framework components and assets

1. Download the blocks. Passing the --download-assets will also download a zip export of one section, to get the static assets, images, etc

```shell
$ skypager download-blocks --download-assets --username $username --password $password
```

You can download the assets export only, which is useful for getting the needed images that come by default:

```shell
$ skypager download-blocks --no-download-html --download-assets=headers
```

This will download a zip file to `downloads/headers.zip`. Extract this and move any images videos etc into the public folder.

2. Expand the combined blocks html into individual html files

```shell
$ skypager expand-blocks
```

3. Generate React Components

```shell
$ skypager generate-components
```
