var gulp  = require('gulp'),
    gutil = require('gulp-util')
    browserSync = require('browser-sync').create()

    jshint     = require('gulp-jshint'),
    concat     = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),

    input  = {
      'sass': 'source/scss/**/*.scss',
      'javascript': 'source/javascript/**/*.js',
      'vendorjs': 'build/assets/javascript/vendor/**/*.js',
      'html': 'source/*.html'
    },

    output = {
      'stylesheets': 'build/assets/stylesheets',
      'javascript': 'build/assets/javascript',
      'html': 'build'
    };

/* run javascript through jshint */
gulp.task('jshint', function() {
  return gulp.src(input.javascript)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

/* compile scss files */
gulp.task('build-css', function() {
  return gulp.src('source/scss/**/*.scss')
    .pipe(sourcemaps.init())
      .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(output.stylesheets));
});

/* copy html files  */
gulp.task('build-html', function(){
    return gulp.src(input.html)
        .pipe(gulp.dest(output.html));
});

/* concat javascript files, minify if --type production */
gulp.task('build-js', function() {
  return gulp.src(input.javascript)
    .pipe(sourcemaps.init())
      .pipe(concat('bundle.js'))
      //only uglify if gulp is ran with '--type production'
      .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop()) 
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(output.javascript));
});

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "build"
        }
    });
});

/* Watch these files for changes and run the task on update */
gulp.task('watch', function() {
  gulp.watch(input.javascript, ['jshint', 'build-js']);
  gulp.watch(input.sass, ['build-css']);
  gulp.watch(input.html, ['build-html']);
});

/* run the watch task when gulp is called without arguments */
gulp.task('default', ['browser-sync', 'watch']);
