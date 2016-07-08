Rainfall Data Generator
===
Tool for generating simple rainfall data formatted to tsv.

Build
---
Before using this application, you should build source files with following commands.
```sh
npm install -g gulp
npm install
gulp build
```

Then compiled files will be put in `build` folder.
To use this application, open `build/index.html` in your web browser.

Usage
---
You can drow some B-Spline curves as trajectories of rain clouds on the map.
- `click`: Add a new control point for B-Spline curve.
- `drop`: Move the control point.
- `shift` + `click`: Remove the control point.
- `cmd` + `click`: Add a new trajectory.
