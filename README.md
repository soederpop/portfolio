# Soederpop Portfolio

This is a portfolio of projects that I work on.

Most of these projects use [Skypager](https://github.com/skypager/skypager) since it is great for managing a bunch of JavaScript projects,
and great for building any app from reusable components.

## Projects
### [Football Coaching Helper](apps/football-coaching)
> Early Stages, in Development

I coach my son's football team, which has an equal play rule that allows every team member an opportunity to play every position at least once in the season.
This app generates player charts for each game to ensure that everyone has had the chance to throw a winning touchdown pass.
It also helps me manage player -> parent communication to keep them up to date on how their child is doing, and to manage scheduling and availability in case
adjustments need to be made on game day. Shuffling around the player charts for the following weeks, if need be, to ensure we can allow that child to make up
their chance to play a certain position.
### [Poker Solver](apps/poker-solver)
> Prototype Built

The poker solver project has evolved into a full blown situation analyzer for poker games.
It supports the idea of ranges, and can calculate the equity of one range vs another, either preflop
or on any board. You can visualize how boards impact a range.
### [Startup Framework Site Builder](apps/skypager-composer)
> Stable, Planned changes under development

This app automates creating static marketing websites using the Startup Framework by Designmodo.
### [Startup Framework Site Builder](apps/startup-framework-react)
> Stable, Planned changes under development

This app automates creating static marketing websites using the Startup Framework by Designmodo.
## Working on this project

### Cloning the project

1. Clone the repo
2. cd soederpop-portfolio
3. yarn

### Updating the README automatically

In every app folder, we should have a STATUS.md file that describes what the project is about and what state it is in, where you can see it, etc.

This information can be condensed and put into the projects section of this document automatically by running

```javascript
$ skypager update-readme
```
