/* import necessary npm packages */
const gulp = require('gulp');
const rtlcss = require('gulp-rtlcss');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify-es').default;
const cleancss = require('gulp-clean-css');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const autoPrefixer = require('gulp-autoprefixer');
const gulpInject = require('gulp-inject');
const series = require('stream-series');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const nunjucks = require('gulp-nunjucks-render');
const formatHtml = require('gulp-html-beautify');
const gulpfilter = require('gulp-filter');
const mergeMQ = require('gulp-merge-media-queries');
const projectName = require('./package.json').name;
const dom  = require('gulp-dom');

// Assets sources
const vendor = './src/assets/vendor_assets';
const theme = './src/assets/theme_assets';
const vendorAssets = gulp.src(
        [
                `${vendor}/css/bootstrap/*.css`,
                `${vendor}/css/*.css`,
                `${vendor}/js/jquery/*.js`,
                `${vendor}/js/bootstrap/popper.js`,
                `${vendor}/js/bootstrap/bootstrap.min.js`,
                `${vendor}/js/moment/moment.min.js`,
                `${vendor}/js/*.js`,
        ],
        { read: true }
);
const themeAssets = gulp.src(['src/style.css', `${theme}/js/*.js`], { read: true });

/* scss to css compilation */
function sassCompiler(src, dest) {
        return async function(done) {
                gulp.src(src)
                        .pipe(sourcemaps.init())
                        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
                        .pipe(autoPrefixer('last 10 versions'))
                        .pipe(mergeMQ())
                        .pipe(sourcemaps.write('maps'))
                        .pipe(gulp.dest(dest))
                        .pipe(
                                browserSync.reload({
                                        stream: true,
                                })
                        );

                        done();
        };
}

// bootstrap sass compiler
gulp.task(
        'sass:bs',
        sassCompiler(
                './src/assets/vendor_assets/css/bootstrap/bootstrap.scss',
                './src/assets/vendor_assets/css/bootstrap/'
        )
);

// themes sass compiler
gulp.task('sass:theme', sassCompiler('./src/assets/theme_assets/sass/style.scss', './src'));

/* gulp asset injection */
gulp.task('inject', function(done) {
        return gulp
                .src('./src/structure/*.njk')
                .pipe(gulpInject(series(vendorAssets, themeAssets), { relative: true }))
                .pipe(gulp.dest('./src/structure'));
        done();
});

/* gulp serve content browser */
gulp.task('serve', function(done) {
        browserSync.init({
                server: {
                        baseDir: './src',
                },
                port: 3010,
        });
        done();
});

// Nunjucks Compiler
gulp.task('compile-nunjucks', function(done) {
        return gulp
                .src('./src/pages/*.njk')
                .pipe(
                        plumber(function(error) {
                                gutil.log(error.message);
                                this.emit('end');
                        })
                )
                .pipe(
                        nunjucks({
                                path: ['./src/structure', './src/pages'],
                        })
                )
                .pipe(
                        formatHtml({
                                indentSize: 4,
                        })
                )
                .pipe(gulp.dest('./src/'))
                .pipe(browserSync.reload({ stream: true }));
        done();
});

// default gulp task
gulp.task(
        'default',
        gulp.series('sass:theme', 'inject', 'compile-nunjucks', 'serve', function(done) {
                gulp.watch('./src/assets/theme_assets/sass/**/*', gulp.series('sass:theme'));
                gulp.watch('./src/assets/vendor_assets/css/bootstrap/*.scss', gulp.series('sass:bs'));
                gulp.watch(['./src/structure/**/*', './src/pages/**'], gulp.series('compile-nunjucks'));
                gulp.watch('./src/**/*.js', browserSync.reload);
                done();
        })
);

/* CFBS ejection script beta */
const filesToMove = [`${vendor}/**`, `${theme}/**`, './src/img/**/*.*'];

// move files
gulp.task('move:files', function(done) {
        gulp.src(filesToMove, { base: './src' }).pipe(gulp.dest(`${projectName}/src`));
        done();
});

// compile for tf
gulp.task('compileStyleForTf', sassCompiler('./src/assets/theme_assets/sass/style.scss', `${projectName}/src`));

// eject themeforrest version
gulp.task(
        'eject:tf',
        gulp.series('move:files', 'compileStyleForTf', function(done) {
                gulp.src('./src/*.html')
                        .pipe(
                                formatHtml({
                                        indentSize: 4,
                                })
                        )
                        .pipe(gulp.dest(`${projectName}/src`));

                gulp.src('./build-config/**').pipe(gulp.dest(`./${projectName}`));

                done();
        })
);

// eject optimized  version for demo
gulp.task('distAssets', function(done) {
        const jsFilter = gulpfilter(['**/*.js'], { restore: true });
        const cssFilter = gulpfilter(['**/*css'], { restore: true });
        const thmis = gulpfilter(['**/*.js'], { restore: true });

        const va = vendorAssets
                .pipe(jsFilter)
                .pipe(uglify())
                .on('error', function(e) {
                        console.log(e);
                })
                .pipe(concat('plugins.min.js'))
                .pipe(gulp.dest('dist/js'))
                .pipe(jsFilter.restore)
                .pipe(cssFilter)
                .pipe(
                        cleancss({
                                compatibility: 'ie8',
                                rebase: false,
                        })
                )
                .pipe(concat('plugin.min.css'))
                .pipe(gulp.dest('./dist/css'));

        const ta = themeAssets
                .pipe(thmis)
                .pipe(uglify())
                .on('error', function(e) {
                        console.log(e);
                })
                .pipe(concat('script.min.js'))
                .pipe(gulp.dest('dist/js'))
                .pipe(thmis.restore)
                .pipe(gulpfilter(['**/*.css']))
                .pipe(cleancss({ compatibility: 'ie8' }))
                .pipe(concat('style.css'))
                .pipe(gulp.dest('./dist'));

        const fonts = gulp.src('./src/assets/vendor_assets/fonts/**').pipe(gulp.dest('dist/fonts'));

        const moveHtml = gulp.src('src/*.html').pipe(gulp.dest('dist'));

        return merge(va, ta, fonts, moveHtml);

        done();
});

// eject demo
gulp.task(
        'eject:demo',
        gulp.series('distAssets', function(done) {
                gulp.src('dist/*.html')
                        .pipe(
                                gulpInject(gulp.src(['dist/css/*.css', 'dist/js/*.js', 'dist/*.css']), {
                                        relative: true,
                                })
                        )
                        .pipe(gulp.dest('dist'));
                done();
        })
);

// rtl css generator
gulp.task('rtl', function(done) {
        const bootstrap = gulpfilter('**/bootstrap.css', { restore: true });
        const style = gulpfilter('**/style.css', { restore: true });

        gulp.src(['./src/assets/vendor_assets/css/bootstrap/bootstrap.css', './src/style.css'])
                .pipe(
                        rtlcss({
                                stringMap: [
                                        {
                                                name: 'left-right',
                                                priority: 100,
                                                search: ['left', 'Left', 'LEFT'],
                                                replace: ['right', 'Right', 'RIGHT'],
                                                options: {
                                                        scope: '*',
                                                        ignoreCase: false,
                                                },
                                        },
                                        {
                                                name: 'ltr-rtl',
                                                priority: 100,
                                                search: ['ltr', 'Ltr', 'LTR'],
                                                replace: ['rtl', 'Rtl', 'RTL'],
                                                options: {
                                                        scope: '*',
                                                        ignoreCase: false,
                                                },
                                        },
                                ],
                        })
                )
                .pipe(bootstrap)
                .pipe(rename({ suffix: '-rtl', extname: '.css' }))
                .pipe(gulp.dest('./src/assets/vendor_assets/css/bootstrap/'))
                .pipe(bootstrap.restore)
                .pipe(style)
                .pipe(rename({ suffix: '-rtl', extname: '.css' }))
                .pipe(gulp.dest('./src'));

                gulp.src('./src/*.html')
                .pipe(dom(function(){
                        return this.querySelectorAll('html')[0].setAttribute('dir', 'rtl');
                }))
                .pipe(gulp.dest('./src'));
        done();
});
