var gulp = require('gulp'),
  stylus = require('gulp-stylus'),
  connect = require('gulp-connect'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer'),
  browserify = require('browserify'),
  watchify = require('watchify'),
  babel = require('babelify'),
  path = require('path'),
  normalize = require('stylus-normalize'),
  postcss      = require('gulp-postcss'),
  sourcemaps   = require('gulp-sourcemaps'),
  rupture = require('rupture'),
  nib = require('nib'),
  fs = require('fs');

gulp.task('compile', function() {
  var bundler = watchify(browserify('./new-years-2016/index.js')
      .transform(
        babel.configure({
          sourceMapRelative: path.resolve(__dirname, 'new-years-2016'),
          presets: ['es2015']
        })
      ));

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('build.js'))
      .pipe(buffer())
      .pipe(gulp.dest('./new-years-2016/build'));
  }

  bundler.on('update', function() {
    console.log('-> bundling...');
    rebundle();
  });

  rebundle();
});
 
gulp.task('connectDev', function () {
  connect.server({
    root: ['new-years-2016'],
    port: 4000,
    livereload: true
  });
});
 
gulp.task('connectDist', function () {
  connect.server({
    root: 'dist',
    port: 4001,
    livereload: true
  });
});
 
gulp.task('html', function () {
  gulp.src('./*.html')
    .pipe(connect.reload());
});
 
gulp.task('stylus', function () {
  gulp.src('./new-years-2016/assets/stylus/*.styl')
    .pipe(stylus({use: [rupture(), nib()] }))
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./new-years-2016/build'))
    .pipe(connect.reload());
});

gulp.task('watch', function () {
  gulp.watch(['./index.html'], ['html']);
  gulp.watch(['./new-years-2016/assets/stylus/*.styl'], ['stylus']);
  gulp.watch(['./new-years-2016/index.js'], ['compile'] );
});
 
gulp.task('default', ['connectDist', 'connectDev', 'watch']);