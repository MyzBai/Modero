# Idle Ascension

Play the game [here](https://myzbai.github.io/IdleAscension)

#### Note

The game is initialized with a _GameModule_ file.
A _GameModule_ file is a json file containing properties and values used in the game.
It controls anything from balancing to features available.

## Creating your own _GameModule_ with NodeJS and Git

#### Contributing

-   Fork this repository
-   Clone the forked repository

-   Run `npm install`
-   Run `npm run build`

#### Game Module Development

-   Create a new branch
-   Create a new json file and add `"$schema": "<filepath>/src/gameModule/gameModule.schema.json"`
-   Include file at [src/gameModule/moduleList.json](src/gameModule/moduleList.json) _(use local url during development)_
-   Run `npm run build` or `npm run build-watch` see [package.json](package.json) for scripts

### Game Module Publish

-   Create a new branch
-   Include file at [src/gameModule/moduleList.json](src/gameModule/moduleList.json) _(url should point to your fork's raw file. e.g. `github.com/<username>/<repository>/raw/<branch>/path/to/file.json`)_
-   Go to Pull requests and click on 'New pull request'
-   Select the branch that contains your commits from the `compare: main` dropdown
-   Click 'Create pull request'
