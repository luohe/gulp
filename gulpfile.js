var gulp = require('gulp'),
    os = require('os'),
    gutil = require('gulp-util'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),
    gulpOpen = require('gulp-open'),
    uglify = require('gulp-uglify'),
    cssmin = require('gulp-cssmin'),
    md5 = require('gulp-md5-plus'),
    fileinclude = require('gulp-file-include'),
    clean = require('gulp-clean'),
    spriter = require('gulp-css-spriter'),
    base64 = require('gulp-css-base64'),
    webpack = require('webpack'),
    webpackConfig = require('./webpack.config.js'),
    connect = require('gulp-connect'),
    colors = require('colors');

 //命令行着色
colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

 var  iptable={},
      ifaces=os.networkInterfaces();
for (var dev in ifaces) {
  ifaces[dev].forEach(function(details,alias){
    if (details.family=='IPv4') {
      iptable[dev+(alias?':'+alias:'')]=details.address;
    }
  });
  var vip = iptable[Object.keys(iptable)[0]];
}

var host = {
    path: 'dist/',
    port: 3000,
    html: 'index.html'
};


//mac chrome: "Google chrome", 
var browser = os.platform() === 'linux' ? 'Google chrome' : (
  os.platform() === 'darwin' ? 'Google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox'));
var pkg = require('./package.json');

gulp.task('copy:images', function (done) {
    gulp.src(['src/images/**/*'])
      .pipe(gulp.dest('dist/images'))
      .on('end', done)
      .pipe(connect.reload());
});

gulp.task('lessmin', function (done) {
    gulp.src(['src/css/main.less', 'src/css/*.css'])
        .pipe(less())
        .pipe(spriter({}))
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/css/'))
        .on('end', done)
      .pipe(connect.reload());
});

gulp.task('md5:js', ['build-js'], function (done) {
  gulp.src([
      'dist/js/*.js',
      '!dist/js/*_??????????.js'
    ])
    .pipe(md5(6, 'dist/app/*.html'))
    .pipe(gulp.dest('dist/js'))
    .on('end', done)
});

gulp.task('md5:css', ['sprite'], function (done) {
    gulp.src('dist/css/*.css')
        .pipe(md5(6, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/css'))
        .on('end', done)
});

gulp.task('fileinclude', function (done) {
    gulp.src(['src/app/*.html'])
        .pipe(fileinclude({
          prefix: '@@',
          basepath: '@file'
        }))
        .pipe(gulp.dest('dist/app'))
        .on('end', done)
        .pipe(connect.reload())
});

gulp.task('sprite', ['copy:images', 'lessmin'], function (done) {
    var timestamp = +new Date();
    gulp.src('dist/css/style.min.css')
        .pipe(spriter({
            spriteSheet: 'dist/images/spritesheet' + timestamp + '.png',
            pathToSpriteSheetFromCSS: '../images/spritesheet' + timestamp + '.png',
            spritesmithOptions: {
                padding: 10
            }
        }))
        .pipe(base64())
        .pipe(cssmin())
        .pipe(gulp.dest('dist/css'))
        .on('end', done)
      .pipe(connect.reload());
});

gulp.task('clean', function (done) {
    gulp.src(['dist'])
        .pipe(clean())
        .on('end', done);
});

gulp.task('watch', function (done) {
    gulp.watch('src/app/*', [ 'fileinclude'])
        .on('end', done)
});
gulp.task('watch', function (done) {
  gulp.watch('src/css/*', ['lessmin'])
    .on('end', done)
});
gulp.task('watch', function (done) {
  gulp.watch('src/js/*', ['build-js'])
    .on('end', done)
});


gulp.task('connect', function () {
    console.log("--------------------------------");
    console.log(("http://"+vip+":"+host.port+"/app/"+host.html).error);
    console.log("--------------------------------");
  connect.server({
        root: host.path,
        port: host.port,
        livereload: true
    });
});

gulp.task('open', function (done) {
    gulp.src('')
        .pipe(gulpOpen({
            app: browser,
            uri: 'http://localhost:3000/app'
        }))
        .on('end', done)
});

var myDevConfig = Object.create(webpackConfig);

var devCompiler = webpack(myDevConfig);

gulp.task("build-js", ['fileinclude'], function(callback) {
    devCompiler.run(function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:build-js", err);
        gutil.log("[webpack:build-js]", stats.toString({
            colors: true
        }));
        callback();
    });
});

//发布
gulp.task('default',['connect', 'fileinclude', 'md5:css', 'md5:js', 'open']);

//开发
gulp.task('dev', ['connect', 'copy:images', 'fileinclude', 'lessmin', 'build-js', 'watch', 'open']);