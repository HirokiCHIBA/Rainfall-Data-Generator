'use strict';

import gulp from 'gulp';
import { copy as config } from '../config';

gulp.task('copy', () => {
    gulp.src(config.src)
        .pipe(gulp.dest(config.dest));
});