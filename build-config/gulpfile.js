/* import necessary npm packages */
var gulp                    = require('gulp'),
    rtlcss                  = require('gulp-rtlcss'),
    sass                    = require('gulp-sass'),
    uglify                  = require('gulp-uglify'),
    cleancss                = require('gulp-clean-css'),
    concat                  = require('gulp-concat'),
    sourcemaps              = require('gulp-sourcemaps'),
    browserSync             = require('browser-sync').create(),
    autoPrefixer            = require('gulp-autoprefixer'),
    gulpInject              = require('gulp-inject'),
    series                  = require("stream-series"),
    merge                   = require('merge-stream'),
    rename                  = require('gulp-rename'),
    nunjucks                = require('gulp-nunjucks-render'),
    tidyHtml                = require('gulp-htmltidy'),
    formatHtml              = require('gulp-html-beautify'),
    /*imagemin                = require('gulp-imagemin'),
    imageminJpegRecompress  = require('imagemin-jpeg-recompress'),
    pngquant                = require('imagemin-pngquant'),
    gulpfilter              = require('gulp-filter'),*/
    del                     = require('gulp-clean');


// Assets sources
var vendor = './src/assets/vendor_assets',
    theme = './src/assets/theme_assets',
    vendorAssets = gulp.src(
        [
            vendor+'/css/bootstrap/*.css',
            vendor+'/css/*.css',
            vendor+'/js/jquery/*.js',
            vendor+'/js/bootstrap/popper.js',
            vendor+'/js/bootstrap/bootstrap.min.js',
            vendor+'/js/*.js'
        ], {read: true}),

    themeAssets = gulp.src(
        [
            'src/style.css',
            theme+'/js/*.js'
        ], {read: true});

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

/* scss to css compilation */
function sassCompiler(src, dest) {
    return function (done) {
        gulp.src(src)
            .pipe(sourcemaps.init())
            .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
            .pipe(sourcemaps.write('maps'))
            .pipe(gulp.dest(dest))
            .pipe(browserSync.reload({
                stream: true
            }));
        done();
    }
}

// bootstrap sass compiler
gulp.task('scss:bs', sassCompiler('./src/assets/vendor_assets/css/bootstrap/bootstrap.scss', './src/assets/vendor_assets/css/bootstrap/'));

// themes sass compiler
gulp.task('scss:theme', sassCompiler('./src/assets/theme_assets/sass/style.scss', './src'));

/* gulp asset injection */
gulp.task('inject', function (done) {
    gulp.src('./src/*.html')
        .pipe(gulpInject(series(vendorAssets, themeAssets), { relative: true }))
        .pipe(gulp.dest('./src/'))
    done();
});

/* gulp serve content in browser */
gulp.task('serve', function(done) {
    browserSync.init({
        server: {
            baseDir: './src'
        },
        port: 3010
    })
    done();
});

// default gulp task
gulp.task('default', gulp.series('scss:theme', 'inject', 'serve', function () {
    gulp.watch('./src/assets/theme_assets/sass/**/*', gulp.series('scss:theme'));
    gulp.watch('./src/assets/vendor_assets/css/bootstrap/*.scss', gulp.series('scss:bs'));
    gulp.watch('./src/**/*.js', browserSync.reload);
}));

// gulp build task: generate an upladable version of the template
var filesToMove = [
    vendor+'/**',
    '!src/assets/vendor_assets/css/**/!(*.css)',
    theme+'/**',
    '!src/assets/theme_assets/{sass,sass/**}',
    './src/*.html', './src/*.css',
    './src/img/**'
];
gulp.task('move', function(done){
    gulp.src(filesToMove, {base: './src'})
        .pipe(gulp.dest('build'));
    done();
});

gulp.task('build', gulp.series('scss:bs','scss:theme', 'move'));

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

//'imgoptimize'
gulp.task('build:optimize', gulp.series('distAssets', function (done) {
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
