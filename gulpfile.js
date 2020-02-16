"use strict";
const
  date = '2020/02',
  domain = 'start',
  laravel = false, // laravel: true, false
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
  pug = require('gulp-pug'),
  fs = require('fs'),
  cached = require('gulp-cached'),
  del = require('del'),
  cache = require('gulp-cache'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  rsync = require('gulp-rsync'),
  rev = require('gulp-rev-append'),
  formatHtml = require('gulp-format-html'),
  prettyHtml = require('gulp-pretty-html'),
  paths = {
    js: [
      'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      'node_modules/bootstrap-select/dist/js/bootstrap-select.min.js',
      'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.js',
      'node_modules/owl.carousel/dist/owl.carousel.min.js',
    ],
    css: [
      'node_modules/bootstrap-select/dist/css/bootstrap-select.min.css',
      'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.css',
      'node_modules/owl.carousel/dist/assets/owl.carousel.min.css',
    ],
    html: laravel ? 'resources/views/**/*' : 'app/*.html',
    script: laravel ? 'public/app/js' : 'app/js',
    style: {
      src: laravel ? 'resources/sass/_theme' : 'app/sass/_theme',
      dest: laravel ? 'public/app/css' : 'app/css',
    },
    template: {
      src: 'app/pug',
      dest: 'app',
      json: 'app/pug/_base/_data.json',
    },
    import: {
      fonts: {
        src: 'app/fonts/**',
        dest: 'www/fonts',
      },
      css: {
        src: 'app/css/**',
        dest: 'www/css',
      },
      js: {
        src: 'app/js/**',
        dest: 'www/js',
      },
      video: {
        src: 'app/video/**',
        dest: 'www/video',
      }
    }
  };


/* DEV PROCESSING
 ********************************************************/

// browser-sync
function reload(done) {
  server.reload();
  done();
}

function serve(done) {
  server.init({
    proxy: laravel && domain + '.loc',
    server: !laravel && 'app',
    notify: false,
  });
  done();
}

// sass
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

// pug
function template() {
  return src(paths.template.src + '/*.pug')
    .pipe(plumber())
    .pipe(pug({
      pretty: '\t',
      locals: JSON.parse(fs.readFileSync(paths.template.json, 'utf-8'))
    }))
    .pipe(plumber.stop())
    .pipe(cached('pug'))
    .pipe(dest(paths.template.dest))
    .pipe(server.stream())
}

// concatenate vendor files
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

// watch for changes
function watcher(done) {
  watch(paths.style.src + '/**/*', parallel(style));
  !laravel && watch(paths.template.src + '/**/*', parallel(template));
  watch(paths.script + '/**/*', reload);
  watch(paths.html, reload);
  done();
}

const dev = series(
  vendor, style, template,
  parallel(watcher, serve)
)


/* BUILD
 ********************************************************/

// Clean (dir)
function clean() {
  return del(['www']);
}

// Import (images)
function images() {
  return src('app/images/**')
    .pipe(cache(imagemin({
      interlaced: true,
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      use: [pngquant()]
    })))
    .pipe(dest('www/images'));
}

// Import (html)
function html() {
  return src('app/*.html')
    .pipe(rev())
    .pipe(formatHtml())
    .pipe(prettyHtml({
      unformatted: ['code', 'pre', 'em', 'strong', 'i', 'b', 'br']
    }))
    .pipe(dest('www'));
};

// Import other files
function files(done) {
  lodash(paths).forEach(function (dist, type) {
    if (type == 'import') {
      lodash(dist).forEach(function (val, key) {
        return src(val.src)
          .pipe(dest(val.dest))
      })
    }
  });
  done();
}

const build = series(
  clean,
  parallel(html, images, files)
)


/* PROCESSING SYNC
********************************************************/

function sync() {
  return src('www/**/*')
    .pipe(rsync({
      root: 'www',
      hostname: 'podolskiis@vh54.timeweb.ru',
      destination: 'sergeypodolsky.ru/public_html/work/' + date + '/' + domain,
      archive: true,
      silent: false,
      compress: true
    }));
}

const bs = series(
  build,
  parallel(sync)
)


/* EXPORT TASKS
 ********************************************************/
exports.default = dev;
exports.build = build;
exports.bs = bs;
