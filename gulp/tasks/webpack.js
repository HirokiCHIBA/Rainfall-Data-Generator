'use strict';

import gulp from 'gulp';
import gulpif from 'gulp-if';
import uglify from 'gulp-uglify';
import webpack from 'gulp-webpack';
import config from '../config';

gulp.task('webpack', () => {
    gulp.src(config.webpack.entry)
        .pipe(webpack(config.webpack))
        .pipe(gulpif(config.js.uglify, uglify()))
        .pipe(gulp.dest(config.js.dest));
});