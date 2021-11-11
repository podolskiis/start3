const { src, dest, watch, series, parallel } = require('gulp'),
  plumber = require('gulp-plumber'),
  sass = require('gulp-sass'),
  sassGlob = require('gulp-sass-glob'),
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
  del = require('del'),
  pug = require('gulp-pug'),
  fs = require('fs'),
  cached = require('gulp-cached'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  rsync = require('gulp-rsync'),
  gutil = require('gulp-util'),
  ftp = require('vinyl-ftp'),
  rev = require('gulp-rev-append'),
  formatHtml = require('gulp-format-html'),
  prettyHtml = require('gulp-pretty-html');

let
  laravel = false,
  project = 'start',
  date    = '2020/02',
  hostUrl = 'sergeypodolsky.ru/public_html/work/' + date + '/' + project,
  pathApp = 'src/',
  pathBld = 'dist/',
  assets  = 'assets/',
  paths   = {
    node_js: [
      'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      'node_modules/bootstrap-select/dist/js/bootstrap-select.min.js',
      'node_modules/@fancyapps/ui/dist/fancybox.umd.js',
    ],
    node_css: [
      'node_modules/bootstrap/dist/css/bootstrap.min.css',
      'node_modules/bootstrap-select/dist/css/bootstrap-select.min.css',
      'node_modules/@fancyapps/ui/dist/fancybox.css',
    ],
    node_map: {
      js: [
        'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js.map',
        'node_modules/bootstrap-select/dist/js/bootstrap-select.min.js.map',
      ],
      css: [
        'node_modules/bootstrap/dist/css/bootstrap.min.css.map',
      ],
    },
    html: laravel ? 'resources/views/' : pathApp + '*.html',
    script: laravel ? 'public/app/js/' : pathApp + assets + 'js/',
    style: {
      src: laravel ? 'resources/sass/theme/' : pathApp + 'sass/theme/',
      dest: laravel ? 'public/app/css/' : pathApp + assets + 'css/',
    },
    svg: {
      src: laravel ? 'public/app/images/icons/svg/' : pathApp + assets + 'images/icons/svg/',
      dest: laravel ? 'public/app/images/icons/' : pathApp + assets + 'images/icons/',
    },
    img: {
      src: pathApp + assets + 'images/',
      dest: pathBld + assets + 'images/',
    },
    template: {
      src: pathApp + 'pug/',
      dest: pathApp,
      json: pathApp + 'pug/_base/_data.json',
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
    proxy: laravel && project,
    server: !laravel && pathApp,
    notify: false,
  });
  done();
}

// Vendor files
function vendor(done) {
  lodash(paths).forEach(function (item, type) {

    if (type == 'node_js' && item.length) {
      return src(item)
        .pipe(concat('vendor.min.js'))
        .pipe(dest(paths.script))
    } else {
      del([paths.script + 'vendor.min.js']);
    }

    if (type == 'node_css' && item.length) {
      return src(item)
        .pipe(concat('vendor.min.css'))
        .pipe(dest(paths.style.dest))
    } else {
      del([paths.style.dest + 'vendor.min.css']);
    }

    if (type == 'node_map') {
      lodash(item).forEach(function (item, type) {
        if (type == 'js') {
          del([paths.script + '*.js.map']);
          lodash(item).forEach(function (item) {
            return src(item).pipe(dest(paths.script))
          })
        }
        if (type == 'css') {
          del([paths.style.dest + '*.css.map']);
          lodash(item).forEach(function (item) {
            return src(item).pipe(dest(paths.style.dest))
          })
        }
      })
    }

  })
  done();
}

// Sass
function style() {
  return src(paths.style.src + '*.+(scss|sass)')
    .pipe(plumber())
    .pipe(sassGlob())
    .pipe(sass({
      includePaths: ['node_modules/']
    }))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 8 versions'] }))
    .pipe(gcmq())
    .pipe(csso())
    .pipe(rename({ basename: 'theme', suffix: '.min' }))
    .pipe(dest(paths.style.dest))
    .pipe(server.stream())
}

// Svg
function svg() {
  return src(paths.svg.src + '**/*.svg')
    .pipe(plumber())
    .pipe(svgmin({
      multipass: true,
      full: true,
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
  watch(paths.style.src + '**/*', parallel(style));
  watch(paths.svg.src + '**/*', series(svg, parallel(reload)));
  watch(paths.script + '**/*', reload);
  laravel ? watch(paths.html + '**/*.php', reload) : watch(paths.template.src + '**/*.pug', parallel(template));
}

// Tasks
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
  return del([pathBld]);
}

// Import (html)
function html() {
  return src(pathApp + '*.html')
    .pipe(rev())
    .pipe(formatHtml())
    .pipe(prettyHtml({
      unformatted: ['code', 'pre', 'em', 'strong', 'i', 'b', 'br']
    }))
    .pipe(dest(pathBld));
}

// Import assets files
function files() {
  return src([pathApp + assets + '**/*', '!**/images/**'])
    .pipe(dest(pathBld + assets)); // без "assets" - убрать "+ assets"
}

// Images
function images() {
  return src(paths.img.src + '**/*')
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
    .pipe(dest(paths.img.dest));
}

// Tasks
const build = series(
  clean,
  parallel(html, files, images)
)
exports.bld = build;
exports.html = html;
exports.img = images;


/* DEPLOY PROCESSING
********************************************************/

function sync() {
  return src(pathBld + '**/*')
    .pipe(rsync({
      root: pathBld,
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

  return src(pathBld + '**/*', { buffer: false })
    .pipe(conn.dest(hostUrl));
}

// Tasks
exports.sync = sync;
exports.http = http;
exports.bs = series(build, sync);
exports.bf = series(build, http);
