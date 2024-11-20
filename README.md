# Modero - An Idle RPG Game

## Play: [Modero](https://myzbai.github.io/Modero)

### Create Your Own Game Module

-   Create a new branch from main
-   Create a \*.module.json file in [public](public/) (.module.json extension enables schema).
-   Include your module at [src/game/gameModule/moduleList.json](src/game/gameModule/moduleList.json) (use local path)
-   When done, commit and push to origin
-   You're now ready to publish your game module

### Publish Your Game Module

-   Create a new branch from main
-   Include your module at [src/game/gameModule/moduleList.json](src/game/gameModule/moduleList.json) _(url should point to your fork's raw file. e.g. `raw.githubusercontent.com/<username>/<repository>/raw/<branch>/path/to/module.json`)_
-   Commit and push to origin
-   Go to [https://github.com/{{site.github.repository_owner}}/{{site.github.repository_name}}/pulls]() Pull requests and click on 'New pull request'
-   Select the branch that contains your commits from the `compare: main` dropdown
-   Click 'Create pull request'

After being marged, your module will be available for others to use.
