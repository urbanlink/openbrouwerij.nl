'use strict';

var browserSync = require('browser-sync').create();
var childProcess = require('child_process');
var gutil = require('gulp-util');
var del = require('del');
var ghPages = require('gh-pages');
var gulp = require('gulp');
var path = require('path');
var sequence = require('run-sequence');
var env = require('gulp-env');

// load gulp plugins
var $ = require('gulp-load-plugins')();

var paths = {
  assets: './app/_assets/',
  modules: './node_modules/',
  dist: './dist/'
};

// Sources
var sources = {
  content: 'app/**/*.{markdown,md,html,txt,yml,yaml}',
  styles: paths.assets + 'stylesheets/**/*',
  js: [
    paths.assets + 'javascripts/**/*.js',
    paths.modules + 'bootstrap/js/dropdown.js',
    paths.modules + 'bootstrap/js/affix.js'
  ],
  images: paths.assets + 'images/**/*',
  fonts: paths.modules + 'font-awesome/fonts/**/*.*'
};

gulp.task('styles', function () {
  return gulp.src(paths.assets + 'stylesheets/index.scss')
    .pipe($.plumber())
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe($.rename('styles.css'))
    .pipe(gulp.dest(paths.dist + 'assets'))
    .pipe($.size())
    .pipe(browserSync.stream());
});

gulp.task('javascripts', function () {
  return gulp.src(sources.js)
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.concat('app.js'))
    .pipe($.sourcemaps.write('maps'))
    .pipe(gulp.dest('dist/assets'))
    .pipe($.size())
    .pipe(browserSync.stream());
});

gulp.task('images', function () {
  return gulp.src(sources.images)
    .pipe($.plumber())
    .pipe(gulp.dest(paths.dist + 'assets/images'))
    .pipe($.size())
    .pipe(browserSync.stream());
});

gulp.task('fonts', function () {
  return gulp.src(sources.fonts)
    .pipe($.plumber())
    .pipe(gulp.dest(paths.dist + '/assets/fonts'))
    .pipe($.size())
    .pipe(browserSync.stream());
});

gulp.task('jekyll', function (cb) {
  var command = 'bundle exec jekyll build --config jekyll.yml --destination ' + paths.dist;

  childProcess.exec(command, function (err, stdout, stderr) {
    gutil.log(stdout);
    gutil.log(stderr);
    cb(err);
  });
});

gulp.task('html', ['jekyll'], function () {
  return gulp.src(paths.dist + '/**/*.html')
    .pipe($.plumber())
    .pipe(gulp.dest(paths.dist))
    .pipe($.size())
    .pipe(browserSync.stream());
});

gulp.task('clean', function() {
  ghPages.clean();
  return del(['dist', '.gh-pages']);
});

gulp.task('build', ['javascripts', 'images', 'fonts'], function (cb) {
  sequence('html', 'styles', cb);
});

gulp.task('browser-sync', function () {
  browserSync.init({
    logPrefix: ' ▶ ',
    minify: false,
    notify: false,
    server: 'dist'
  });
});

gulp.task('gh-pages', function (cb) {
  var cmd = 'git rev-parse --short HEAD';

  childProcess.exec(cmd, function (err, stdout) {
    if (err) {
      cb(err);
    }

    ghPages.publish(path.join(__dirname, paths.dist), {
      message: 'Deploying ' + stdout + '(' + new Date().toISOString() + ')'
    }, cb);
  });
});

gulp.task('cloudflare', function (cb) {
  // configure cloudflare
  // env({
  //   file: '.env.js'
  // });
  //
  // var cloudflare = require('cloudflare').createClient({
  //   email: process.env.CLOUDFLARE_EMAIL,
  //   token: process.env.CLOUDFLARE_TOKEN
  // });
  //
  // cloudflare.clearCache('vooot.nl', function (err) {
  //   if (err) {
  //     gutil.log(err.message);
  //   }
  //
  //   cb();
  // });
  cb();
});

gulp.task('deploy', function (cb) {
  sequence('build', 'gh-pages', 'cloudflare', cb);
});

gulp.task('watch', function () {
  gulp.watch(sources.content, ['html']);
  gulp.watch(sources.styles, ['styles']);
  gulp.watch(sources.images, ['images']);
  gulp.watch(sources.js, ['javascripts']);
});

gulp.task('default', ['clean'], function (cb) {
  sequence('build', 'browser-sync', 'watch', cb);
});
