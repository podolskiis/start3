"use strict";
const
  { src, dest, watch, series, parallel } = require('gulp'),
  plumber = require('gulp-plumber'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  csso = require('gulp-csso'),
  gcmq = require('gulp-group-css-media-queries'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  server = require('browser-sync').create(),
  pug = require('gulp-pug'),
  fs = require('fs'),
  cached = require('gulp-cached'),
  del = require('del'),
  cache = require('gulp-cache'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  rsync = require('gulp-rsync'),
  lodash = require('lodash'),
  paths = {
    js: [
      'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      'node_modules/bootstrap-select/dist/js/bootstrap-select.min.js',
      'node_modules/owl.carousel/dist/owl.carousel.min.js',
      'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.js',
    ],
    css: [
      'node_modules/bootstrap-select/dist/css/bootstrap-select.min.css',
      'node_modules/owl.carousel/dist/assets/owl.carousel.min.css',
      'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.css',
    ],
    json: 'app/pug/_base/_data.json',
    import: {
      home: {
        src: 'app/*.*',
        dest: 'www'
      },
      fonts: {
        src: 'app/fonts/**',
        dest: 'www/fonts'
      },
      css: {
        src: 'app/css/**',
        dest: 'www/css'
      },
      js: {
        src: 'app/js/**',
        dest: 'www/js'
      },
      video: {
        src: 'app/video/**',
        dest: 'www/video'
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
    server: { baseDir: 'app' },
    notify: false,
  });
  done();
}

// sass
function style() {
  return src('app/sass/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer({ overrideBrowserslist: ['last 8 versions'] }))
    .pipe(gcmq())
    .pipe(csso())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('app/css'))
    .pipe(server.stream())
}

// pug
function template() {
  return src('app/pug/*.pug')
    .pipe(plumber())
    .pipe(pug({
      pretty: '\t',
      locals: JSON.parse(fs.readFileSync(paths.json, 'utf-8'))
    }))
    .pipe(plumber.stop())
    .pipe(cached('pug'))
    .pipe(dest('app'))
    .pipe(server.stream())
}

// concatenate vendor files
function vendor(done) {
  lodash(paths).forEach(function (dist, type) {
    if (type == 'js' && dist.length) {
      return src(dist)
        .pipe(concat('vendor.min.js'))
        .pipe(dest('app/js'))
    }
    else if (type == 'css' && dist.length) {
      return src(dist)
        .pipe(concat('vendor.min.css'))
        .pipe(dest('app/css'))
    }
  })
  done();
}

// watch for changes
function watcher(done) {
  watch('app/sass/**/*', parallel(style));
  watch('app/pug/**/*', parallel(template));
  watch('app/js/**/*', reload);
  watch('app/*.html', reload);
  // watch('gulpfile.js', vendor); // npm install -g gulp gulper
  done();
}

const dev = series(
  style,
  vendor,
  template,
  parallel(watcher, serve)
)


/* BUILD
 ********************************************************/

// Clean (dir)
function clean() {
  return del(['www']);
}

// Import and compress (images)
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

// Import all files
function files(done) {
  lodash(paths).forEach(function (dist, type) {
    if (type == 'import') {
      lodash(dist).forEach(function (val) {
        return src(val.src)
          .pipe(dest(val.dest))
      })
    }
  });
  done();
}

const build = series(
  clean,
  parallel(images, files)
)


/* PROCESSING SYNC
********************************************************/

function sync() {
  return src('www/**/*')
    .pipe(rsync({
      root: 'www/',
      hostname: 'podolskiis@vh54.timeweb.ru',
      destination: 'sergeypodolsky.ru/public_html/work/2019/12/start',
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
