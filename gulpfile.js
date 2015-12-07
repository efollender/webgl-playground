var gulp = require('gulp'),
  stylus = require('gulp-stylus'),
  connect = require('gulp-connect'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer'),
  browserify = require('browserify'),
  watchify = require('watchify'),
  babel = require('babelify'),
  path = require('path'),
  fs = require('fs');

gulp.task('es6', function(){
  var extensions = ['.js','.json','.es6'];
  return browserify({ debug: true, extensions:extensions })
    .transform(babelify.configure({
      extensions: extensions
    }))
    .require("./app/index.js", { entry: true })
    .bundle()
    .on("error", function (err) { console.log("Error : " + err.message); })
    .pipe(fs.createWriteStream("./app/build/bundle.js"))
});

gulp.task('compile', function() {
  var bundler = watchify(browserify('./app/index.js', { debug: true })
      .transform(
        babel.configure({
          sourceMapRelative: path.resolve(__dirname, 'app'),
          presets: ['stage-0'],
          sourceType: 'module'
        })
      ));

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('build.js'))
      .pipe(buffer())
      .pipe(gulp.dest('./app/build'));
  }

  bundler.on('update', function() {
    console.log('-> bundling...');
    rebundle();
  });

  rebundle();
});
 
gulp.task('connectDev', function () {
  connect.server({
    root: ['app'],
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
  gulp.src('./app/*.html')
    .pipe(connect.reload());
});
 
gulp.task('stylus', function () {
  gulp.src('./app/assets/stylus/*.styl')
    .pipe(stylus())
    .pipe(gulp.dest('./app/build'))
    .pipe(connect.reload());
});
 
gulp.task('watch', function () {
  gulp.watch(['./app/*.html'], ['html']);
  gulp.watch(['./app/assets/stylus/*.styl'], ['stylus']);
  gulp.watch(['./app/assets/**/*.js'], ['compile'] );
});
 
gulp.task('default', ['connectDist', 'connectDev', 'watch']);