'use strict';

import gulp from 'gulp';
import watch from 'gulp-watch';
import { watch as config } from '../config.js';

gulp.task('watch', () => {
    watch(config.js, () => {
        gulp.start(['webpack']);
    });
    watch(config.css, () => {
        gulp.start(['webpack']);
    });
    watch(config.www, () => {
        gulp.start(['copy']);
    });
});