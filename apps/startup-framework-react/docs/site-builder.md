# Site Builder 

## Create a New Site

Creating a new site will generate a source code skeleton in [../src/sites]

```shell
$ skypager create-site example-one
```

By default, it will use one of the [boilerplates](../src/boilerplates/startup-framework-site).  

You can specify another if you had one in src/boilerplates:

```shell
$ skypager create-site example-one --boilerplate something-else
```

## Adding a new page to a site

A Site is just a collection of pages, which are named collections of startup framework blocks that we expect to be accessible from a particular URL or `route`

```shell
$ skypager create-page --site example-one --name our-team headers/1 contents/1 contents/2 teams/2 teams/3 
$ skypager create-page --site example-one --name our-leaders headers/1 contents/1 contents/2 teams/2 teams/3 
```

This will create two pages, they will be served at `/our-team` and `/our-leaders`

## Publishing a site

Publish one of your sites to a domain, and open it in the browser

```shell
$ skypager publish example-one --open
```

