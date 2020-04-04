/* import necessary npm packages */
var gulp                    = require('gulp'),
    rtlcss                  = require('gulp-rtlcss'),
    sass                    = require('gulp-sass'),
    uglify                  = require('gulp-uglify'),
    cleancss                = require('gulp-clean-css'),
    gutil                   = require('gulp-util'),
    plumber                 = require('gulp-plumber'),
    concat                  = require('gulp-concat'),
    sourcemaps              = require('gulp-sourcemaps'),
    browserSync             = require('browser-sync').create(),
    autoPrefixer            = require('gulp-autoprefixer'),
    gulpInject              = require('gulp-inject'),
    series                  = require("stream-series"),
    merge                   = require('merge-stream'),
    rename                  = require('gulp-rename'),
    nunjucks                = require('gulp-nunjucks-render'),
    tidyHtml                = require('gulp-remove-empty-lines'),
    formatHtml              = require('gulp-html-beautify'),
    gulpfilter              = require('gulp-filter'),
    /*imagemin                = require('gulp-imagemin'),
    imageminJpegRecompress  = require('imagemin-jpeg-recompress'),
    pngquant                = require('imagemin-pngquant'),*/
    projectName             = require('./package.json').name;

// Assets sources
var vendor = './src/assets/vendor_assets',
    theme = './src/assets/theme_assets',
    vendorAssets = gulp.src(
        [
            vendor + '/css/bootstrap/*.css',
            vendor + '/css/*.css',
            vendor + '/js/jquery/*.js',
            vendor + '/js/bootstrap/popper.js',
            vendor + '/js/bootstrap/bootstrap.min.js',
            vendor + '/js/*.js'
        ], {read: true}),

    themeAssets = gulp.src(
        [
            'src/style.css',
            theme + '/js/*.js'
        ], {read: true});


/* scss to css compilation */
function sassCompiler(src, dest) {
    return async function () {
        gulp.src(src)
            .pipe(sourcemaps.init())
            .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
            .pipe(autoPrefixer('last 10 versions'))
            .pipe(sourcemaps.write('maps'))
            .pipe(gulp.dest(dest))
            .pipe(browserSync.reload({
                stream: true
            }));
    }
}

// bootstrap sass compiler
gulp.task('sass:bs', sassCompiler('./src/assets/vendor_assets/css/bootstrap/bootstrap.scss', './src/assets/vendor_assets/css/bootstrap/'));

// themes sass compiler
gulp.task('sass:theme', sassCompiler('./src/assets/theme_assets/sass/style.scss', './src'));

/* gulp asset injection */
gulp.task('inject', function (done) {
    return gulp.src('./src/structure/*.njk')
        .pipe(gulpInject(series(vendorAssets, themeAssets), {relative: true}))
        .pipe(gulp.dest('./src/structure'))
    done();
});

/* gulp serve content browser */
gulp.task('serve', function (done) {
    browserSync.init({
        server: {
            baseDir: './src'
        },
        port: 3010
    })
    done();
});

// Nunjucks Compiler
gulp.task('compile-nunjucks', function (done) {
    return gulp.src('./src/pages/*.njk')
        .pipe(plumber(function (error) {
            gutil.log(error.message);
            this.emit('end');
        }))
        .pipe(nunjucks({
            path: ['./src/structure', './src/pages']
        }))
        .pipe(gulp.dest('./src/'))
        .pipe(browserSync.reload({stream: true}));
    done();
});


// Image minifier - compresses images
/*gulp.task('minIMG', function() {
    var svgFilter = gulpfilter(['**!/!*.svg'], {restore: true});
    return gulp.src('./src/img/!**')
        .pipe(svgFilter)
        .pipe(cleancss())
        .pipe(gulp.dest('dist/img/svg'))
        .pipe(svgFilter.restore)
        .pipe(cache(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imageminJpegRecompress({
                loops: 5,
                min: 65,
                max: 70,
                quality:'medium'
            }),
            imagemin.svgo(),
            imagemin.optipng({optimizationLevel: 3}),
            pngquant({quality: '65-70', speed: 5})
        ],{
            verbose: true
        })))
        .pipe(gulp.dest('./dist/img'));
});*/

// default gulp task
gulp.task('default', gulp.series('sass:theme', 'inject', 'compile-nunjucks', 'serve', function (done) {
    gulp.watch('./src/assets/theme_assets/sass/**/*', gulp.series('sass:theme'));
    gulp.watch('./src/assets/vendor_assets/css/bootstrap/*.scss', gulp.series('sass:bs'));
    gulp.watch(['./src/structure/**/*', './src/pages/**'], gulp.series('compile-nunjucks'));
    gulp.watch('./src/**/*.js', browserSync.reload);
    done();
}));


/* CFBS ejection script beta */
var filesToMove = [
    vendor + '/**',
    theme + '/**',
    './src/img/**/*.*'
];

// move files
gulp.task('move:files', function (done) {
    gulp.src(filesToMove, {base: './src'})
        .pipe(gulp.dest(projectName+'/src'));
    done();
});

//compile for tf
gulp.task('compileStyleForTf', sassCompiler('./src/assets/theme_assets/sass/style.scss', projectName+'/src'));

// eject themeforrest version
gulp.task("eject:tf", gulp.series('move:files', 'compileStyleForTf', function (done) {
    gulp.src('./src/*.html')
        .pipe(tidyHtml())
        .pipe(formatHtml(
            {
                indentSize: 4
            }
        ))
        .pipe(gulp.dest(projectName+'/src'));

    gulp.src('./build-config/**')
        .pipe(gulp.dest('./'+projectName));

    done();
}));

// eject optimized  version for demo
gulp.task('distAssets', function (done) {
    var jsFilter = gulpfilter(['**/*.js'], {restore: true}),
        cssFilter = gulpfilter(['**/*css'], {restore: true}),
        thmis = gulpfilter(['**/*.js'], {restore: true});

    var va = vendorAssets
        .pipe(jsFilter)
        .pipe(uglify())
        .on('error', function (e) {
            console.log(e);
        })
        .pipe(concat('plugins.min.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(cleancss(
            {
                compatibility: 'ie8',
                rebase: false
            }))
        .pipe(concat('plugin.min.css'))
        .pipe(gulp.dest('./dist/css'));

    var ta = themeAssets
        .pipe(thmis)
        .pipe(uglify())
        .on('error', function (e) {
            console.log(e);
        })
        .pipe(concat('script.min.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(thmis.restore)
        .pipe(gulpfilter(['**/*.css']))
        .pipe(cleancss({compatibility: 'ie8'}))
        .pipe(concat('style.css'))
        .pipe(gulp.dest('./dist'));

    var fonts = gulp.src('./src/assets/vendor_assets/fonts/**')
        .pipe(gulp.dest('dist/fonts'));

    var moveHtml = gulp.src('src/*.html')
        .pipe(gulp.dest('dist'));

    return merge(va, ta, fonts, moveHtml);

    done();
});

// eject demo
gulp.task('eject:demo', gulp.series('distAssets', function (done) {
    gulp.src('dist/*.html')
        .pipe(gulpInject(
            gulp.src(['dist/css/*.css', 'dist/js/*.js', 'dist/*.css']),
            {relative: true}
        ))
        .pipe(gulp.dest('dist'));
    done();
}));

//rtl css generator
gulp.task('rtl', function (done) {
    var bootstrap = gulpfilter('**/bootstrap.css', {restore: true}),
        style = gulpfilter('**/style.css', {restore: true});

    gulp.src(['./src/assets/vendor_assets/css/bootstrap/bootstrap.css', './src/style.css'])
        .pipe(rtlcss({
            'stringMap': [
                {
                    'name': 'left-right',
                    'priority': 100,
                    'search': ['left', 'Left', 'LEFT'],
                    'replace': ['right', 'Right', 'RIGHT'],
                    'options': {
                        'scope': '*',
                        'ignoreCase': false
                    }
                },
                {
                    'name': 'ltr-rtl',
                    'priority': 100,
                    'search': ['ltr', 'Ltr', 'LTR'],
                    'replace': ['rtl', 'Rtl', 'RTL'],
                    'options': {
                        'scope': '*',
                        'ignoreCase': false
                    }
                }
            ]
        }))
        .pipe(bootstrap)
        .pipe(rename({suffix: '-rtl', extname: '.css'}))
        .pipe(gulp.dest('./src/assets/vendor_assets/css/bootstrap/'))
        .pipe(bootstrap.restore)
        .pipe(style)
        .pipe(rename({suffix: '-rtl', extname: '.css'}))
        .pipe(gulp.dest('./src'));
    done();
});
