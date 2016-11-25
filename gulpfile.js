/**
 Gulpfile for gulp-webpack-demo
 created by fwon
*/
var gulp = require('gulp'),
    os = require('os'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    less = require('gulp-less'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    cssmin = require('gulp-cssmin'),
    md5 = require('gulp-md5-plus'),
    fileinclude = require('gulp-file-include'),
    clean = require('gulp-clean'),
    spriter = require('gulp-css-spriter'),
    base64 = require('gulp-css-base64'),
    gulpWebpack = require('gulp-webpack'),
    webpack = require('webpack'),
    webpackS = require('webpack-stream'),
    webpackConfig = require('./webpack.config.js'),
    connect = require('gulp-connect'),
    autoprefixer = require('gulp-autoprefixer'),
    named = require('vinyl-named'),
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

//handleError;错误处理函数
function handleError(){
  var args = Array.prototype.slice.call(arguments);
  notity.onError({
    title:'compole error',
    message:'<%=error.message%>'
  }).apply(this,args);
  this.emit()
}

gulp.task('lessmin', function (done) {
    gulp.src(['src/css/main.less', 'src/css/*.css'])
        .pipe(less())
        .on('error',handleError)
        .pipe(autoprefixer({
          browsers: ['last 2 versions', 'Android >= 4.0'],
          cascade: true,                                           //是否美化属性值 默认：true 像这样：
          remove:true                                              // -webkit-transform: rotate(45deg);
                                                                   //          transform: rotate(45deg)
                                                                   // 是否去掉不必要的前缀 默认：true
        }))
//      .pipe(spriter(spriteOption))
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/css/'))
        .on('end', done)
        .pipe(reload({stream:true}))
});

gulp.task('md5:js', ['build-js'], function (done){
  gulp.src([
      'dist/js/*.js',
      '!dist/js/*_??????????.js'
    ])
    .pipe(md5(6, 'dist/app/*.html'))
    .pipe(gulp.dest('dist/js'))
    .on('end', done)
    .pipe(reload({stream:true}))
});

gulp.task('md5:css', ['sprite'], function (done) {
    gulp.src('dist/css/*.css')
        .pipe(md5(6, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/css'))
        .on('end', done)
        .pipe(reload({stream:true}))
});

gulp.task('fileinclude', function (done) {
    gulp.src(['src/app/*.html'])
        .pipe(fileinclude({
          prefix: '@@',
          basepath: '@file'
        }))
        .pipe(gulp.dest('dist/app'))
        .on('end', done)
        .pipe(reload({stream:true}))
});

var spriteOption = {
                      spriteSheet: './dist/images/spritesheet.png',
                      pathToSpriteSheetFromCSS: '../images/spritesheet.png',
                      spritesmithOptions: {
                        padding: 10
                      }
                    };

gulp.task('sprite', ['copy:images', 'lessmin'], function (done) {
    var timestamp = +new Date();
    gulp.src('dist/css/style.min.css')
        .pipe(spriter(spriteOption))
        .pipe(base64())
        .pipe(cssmin())
        .pipe(gulp.dest('./dist/css'))
        .on('end', done)
        .pipe(reload({stream:true}))
});

gulp.task('clean', function (done) {
    gulp.src(['dist'])
        .pipe(clean())
        .on('end', done);
});

var myDevConfig = Object.create(webpackConfig);
var devCompiler = webpack(myDevConfig);

gulp.task("build-js", function(callback) {
  return gulp.src('src/js/*.js')
    .pipe(named())
    .pipe(webpackS(webpackConfig))
    .pipe(gulp.dest('dist/js/'))
    .pipe(reload({stream:true}));
});

//静态服务器+监听less/html 文件
gulp.task('serve',['lessmin'],function(){
  browserSync.init({
    server:"./dist/"
  });
  gulp.watch('src/**/*', ['lessmin', 'fileinclude'])
    .on('end', reload);
  gulp.watch("./*.html").on('change',reload);
  gulp.watch('src/**/*.js', ['build-js'])
    .on('end', reload)
});

gulp.task('browser-sync',function(){
  browserSync.init({
    server:{
      baseDir:"./dist/"
    }
  })
});

//发布
gulp.task('default',[ 'fileinclude', 'md5:css', 'md5:js', 'serve']);
//开发
gulp.task('dev', [ 'copy:images', 'fileinclude', 'lessmin', 'build-js', 'serve']);