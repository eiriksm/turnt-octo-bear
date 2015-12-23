'use strict';
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var rename = require('gulp-rename');

gulp.task('scripts', function() {
  browserify('./static/app.js')
    .bundle()
    .pipe(source('out.js'))
    .pipe(gulp.dest('./static'));
});

gulp.task('watch', function() {
  gulp.watch(['static/**/*.js', '!static/out.js'], ['scripts']);
});

gulp.task('watch2', function() {
  gulp.watch(['static/scss/**/*'], ['scss']);
});

gulp.task('scss', function() {
  return gulp.src('./static/scss/main.scss')
    .pipe(sass({
      errLogToConsole: true,
      error: function(err) {
        throw new Error(err);
      }
    }))
    .pipe(prefix('last 1 version', '> 1%', 'ie 8', 'ie 7'))
    .pipe(rename('css.min.css'))
    //.pipe(source('css.min.css'))
    .pipe(gulp.dest('static/build'));
});


gulp.task('default', ['scripts']);
