"use strict";
const
  date = '2020/02',
  project = 'start',
  hostUrl = 'sergeypodolsky.ru/public_html/work/' + date + '/' + project, // './'
  laravel = false, // laravel: true, false
  { src, dest, watch, series, parallel } = require('gulp'),
  plumber = require('gulp-plumber'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  csso = require('gulp-csso'),
  gcmq = require('gulp-group-css-media-queries'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  server = require('browser-sync').create(),
  lodash = require('lodash'),
  svgmin = require('gulp-svgmin'),
  svgSprite = require('gulp-svg-sprite'),
  replace = require('gulp-replace'),
  cheerio = require('gulp-cheerio'),
  pug = require('gulp-pug'),
  fs = require('fs'),
  cached = require('gulp-cached'),
  del = require('del'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  rsync = require('gulp-rsync'),
  gutil = require('gulp-util'),
  ftp = require('vinyl-ftp'),
  rev = require('gulp-rev-append'),
  formatHtml = require('gulp-format-html'),
  prettyHtml = require('gulp-pretty-html'),
  paths = {
    js: [
      'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      'node_modules/bootstrap-select/dist/js/bootstrap-select.min.js',
    ],
    css: [
    ],
    html: laravel ? 'resources/views/**' : 'app/*.html',
    script: laravel ? 'public/app/js/' : 'app/js/',
    style: {
      src: laravel ? 'resources/sass/_theme/' : 'app/sass/_theme/',
      dest: laravel ? 'public/app/css/' : 'app/css/',
    },
    svg: {
      src: laravel ? 'public/app/images/icons/svg/**' : 'app/images/icons/svg/**/*.svg',
      dest: laravel ? 'public/app/images/icons/' : 'app/images/icons/',
    },
    template: {
      src: 'app/pug/',
      dest: 'app/',
      json: 'app/pug/_base/_data.json',
    },
    import: {
      fonts: {
        src: 'app/fonts/**',
        dest: 'www/fonts/',
      },
      css: {
        src: 'app/css/**',
        dest: 'www/css/',
      },
      js: {
        src: 'app/js/**',
        dest: 'www/js/',
      },
      video: {
        src: 'app/video/**',
        dest: 'www/video/',
      }
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
    proxy: laravel && project + '.loc',
    server: !laravel && 'app/',
    notify: false,
  });
  done();
}

// Concatenate vendor files
function vendor(done) {
  lodash(paths).forEach(function (dist, type) {
    if (type == 'js' && dist.length) {
      return src(dist)
        .pipe(concat('vendor.min.js'))
        .pipe(dest(paths.script))
    }
    if (type == 'css' && dist.length) {
      return src(dist)
        .pipe(concat('vendor.min.css'))
        .pipe(dest(paths.style.dest))
    } else {
      del([paths.style.dest + 'vendor.min.css']);
    }
  })
  done();
}

// Sass
function style() {
  return src(paths.style.src + '*.+(scss|sass)')
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
  return src(paths.svg.src)
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
    .pipe(dest(paths.svg.dest))
}

// Pug
function template() {
  return src(paths.template.src + '*.pug')
    .pipe(plumber())
    .pipe(pug({
      pretty: '\t',
      locals: JSON.parse(fs.readFileSync(paths.template.json, 'utf-8'))
    }))
    .pipe(plumber.stop())
    .pipe(cached('pug/'))
    .pipe(dest(paths.template.dest))
    .pipe(server.stream())
}

// Watch for changes
function watcher() {
  watch(paths.style.src + '**', parallel(style));
  watch(paths.svg.src, series(svg, parallel(reload)));
  watch(paths.script + '**', reload);
  laravel ? watch(paths.html, reload) : watch(paths.template.src + '**', parallel(template));
}


const devHtml = series(
  vendor, style, template, svg,
  parallel(watcher, serve)
)
const devPhp = series(
  vendor, style, svg,
  parallel(watcher, serve)
)

if (!laravel) {
  exports.default = devHtml;
} else {
  exports.default = devPhp;
}


/* BUILD PROCESSING
 ********************************************************/

// Clean (dir)
function clean() {
  return del(['www/']);
}

// Import (images)
function images() {
  return src('app/images/**')
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false },
          pngquant()
        ]
      })
    ]))
    .pipe(dest('www/images/'));
}

// Import (html)
function html() {
  return src('app/*.html')
    .pipe(rev())
    .pipe(formatHtml())
    .pipe(prettyHtml({
      unformatted: ['code', 'pre', 'em', 'strong', 'i', 'b', 'br']
    }))
    .pipe(dest('www/'));
}

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
exports.bld = build;


/* DEPLOY PROCESSING
********************************************************/

function sync() {
  return src('www/**')
    .pipe(rsync({
      root: 'www/',
      hostname: 'podolskiis@vh54.timeweb.ru',
      destination: hostUrl,
      archive: true,
      silent: false,
      compress: true
    }));
}

function http() {
  const conn = ftp.create({
    host: '92.53.96.109',
    user: 'podolskiis',
    password: '888888',
    parallel: 10,
    log: gutil.log
  });

  return src('www/**', { buffer: false })
    .pipe(conn.dest(hostUrl));
}

/* TASKS
 ********************************************************/
exports.sync = sync;
exports.http = http;
exports.bs = series(build, sync);
exports.bf = series(build, http);
