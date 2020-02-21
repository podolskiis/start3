"use strict";
const
  domain = 'start',
  laravel = true, // laravel: true, false
  { src, dest, watch, series, parallel } = require('gulp'),
  plumber = require('gulp-plumber'),
  sourcemaps = require('gulp-sourcemaps'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  csso = require('gulp-csso'),
  gcmq = require('gulp-group-css-media-queries'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  server = require('browser-sync').create(),
  lodash = require('lodash'),
  paths = {
    js: [
      'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      'node_modules/owl.carousel/dist/owl.carousel.min.js',
      // 'node_modules/bootstrap-select/dist/js/bootstrap-select.min.js',
      // 'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.js',
    ],
    css: [
      'node_modules/owl.carousel/dist/assets/owl.carousel.min.css',
      // 'node_modules/bootstrap-select/dist/css/bootstrap-select.min.css',
      // 'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.css',
    ],
    html: laravel ? 'resources/views/**/*' : 'app/*.html',
    script: laravel ? 'public/app/js' : 'app/js',
    style: {
      src: laravel ? 'resources/sass/_theme' : 'app/sass/_theme',
      dest: laravel ? 'public/app/css' : 'app/css',
    }
  };


/* DEV PROCESSING
 ********************************************************/

// Browser-sync
function reload(done) {
  server.reload();
  done();
}

function serve(done) {
  server.init({
    proxy: laravel && domain+'.loc',
    server: !laravel && 'app',
    notify: false,
  });
  done();
}

// Concatenate vendor files
function vendor(done) {
  lodash(paths).forEach(function (dist, type) {
    if (type == 'js' && dist.length) {
      return src(dist)
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.min.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(paths.script))
    }
    if (type == 'css' && dist.length) {
      return src(dist)
        .pipe(concat('vendor.min.css'))
        .pipe(dest(paths.style.dest))
    }
  })
  done();
}

// Sass
function style() {
  return src(paths.style.src + '/*.+(scss|sass)')
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer({ overrideBrowserslist: ['last 8 versions'] }))
    .pipe(gcmq())
    .pipe(csso())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(paths.style.dest))
    .pipe(server.stream())
}

// Svg
function svg() {
  return src('app/images/icons/svg/*.svg')
    .pipe(plumber())
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({
      run: function ($) {
        // $('[fill]').removeAttr('fill');
        // $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
        $('[class]').removeAttr('class');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "sprite.svg"
        }
      }
    }))
    .pipe(dest('app/images/icons'))
}

// Watch for changes
function watcher(done) {
  watch(paths.style.src + '/**/*', parallel(style));
  watch(paths.script + '/**/*', reload);
  watch(paths.html, reload);
  done();
}

const dev = series(
  vendor, style,
  parallel(watcher, serve)
)
exports.default = dev;
