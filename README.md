ES2015-PostCSS-Skeleton
===
This is a skeleton project of frontend development for my personal use.

Usage
---
This project uses Gulp as a task runner. So you should install a gulp command first.

```sh
npm install -g gulp
```

Tasks
---
This project contains the following tasks. These are able to use from shell with command `gulp [TASK]`.

- **webpack**: Compile ES2015 (the results will be outputed to /build)
- **css**: Compile PostCSS (the results will be outputed to /build)
- **copy**: Copy static files to /build.
- **build**: Run all above tasks.
- **watch**: Run above task automatically when source files updated.