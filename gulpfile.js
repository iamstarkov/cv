var gulp = require('gulp');
var bem = require('gulp-bem');
var concat = require('gulp-concat');
var del = require('del');
var jade = require('gulp-jade');
var pack = require('gulp-bem-pack');
var autoprefixer = require('gulp-autoprefixer');
var buildBranch = require('buildbranch');
var watch = require('gulp-watch');
var debug = require('gulp-debug');

var levels = [
    'libs/bootstrap/levels/*',
    'blocks',
    'pages'
];

var tree;

gulp.task('tree', function () {
    tree = bem.objects(levels).pipe(bem.deps()).pipe(bem.tree());
});

gulp.task('css', ['tree'], function () {
    function buildCSS(page) {
        return tree.deps('pages/' + page.id)
            .pipe(bem.src('{bem}.css'))
            .pipe(concat('index.css'))
            .pipe(autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            }))
            .pipe(gulp.dest('dist' +
                (page.id === 'en' ? '' : '/' + page.id)
            ));
    }

    return bem.objects('pages').map(buildCSS);
});

gulp.task('html', ['tree'], function () {
    function buildHtml(page) {
        return tree.deps('pages/' + page.id)
            .pipe(bem.src('{bem}.jade'))
            .pipe(concat({
                path: page.path + '/index.jade',
                base: page.path
            }))
            .pipe(jade({ pretty: true }))
            .pipe(gulp.dest('dist' +
                (page.id === 'en' ? '' : '/' + page.id)
            ));
    }

    return bem.objects('pages').map(buildHtml);
});

gulp.task('assets', function () {
    return gulp.src('assets/**').pipe(gulp.dest('dist'));
});

gulp.task('clean', function (cb) {
    del(['dist'], cb);
});

gulp.task('build', ['html', 'css', 'assets']);

gulp.task('production', ['build']);

gulp.task('gh', ['production'], function(done) {
    buildBranch({ folder: 'dist', ignore: ['libs'] }, done);
});

gulp.task('express', function() {
    var express = require('express');
    var app = express();
    app.use(express.static('dist'));
    app.listen(4000);
    console.log('Server is running on http://localhost:4000/');
});

gulp.task('watch', ['express', 'build'], function() {
    watch('{blocks,pages}/**/*.deps.js',  function () { gulp.start('build'); });
    watch('{blocks,pages}/**/*.css',  function () { gulp.start('css'); });
    watch('{blocks,pages}/**/*.jade', function () { gulp.start('html'); });
    watch('*.md', function () { gulp.start('html'); });
    watch('*.js', function () { gulp.start('build'); });
});

gulp.task('default', ['watch']);
