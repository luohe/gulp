/**
 Gulpfile for gulp-webpack-demo
 created by fwon
 */
var gulp = require('gulp'),
  os = require('os'),
  browserSync = require('browser-sync').create(),
  reload = browserSync.reload,
  less = require('gulp-less'),
  sourcemaps = require('gulp-sourcemaps'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  cssmin = require('gulp-cssmin'),
  md5 = require('gulp-md5-plus'),
  fileInclude = require('gulp-file-include'),
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

/*
 * 开发环境
 * * 图片发布
 * * less和css文件的压缩、预编译、发布，less以main.less为入口文件
 * * * * 开启sprite  --inline（base64）  --sprite (css sprite) 功能
 * * html文件的预编译、发布
 * * js调用webpack预编译、发布
 * * * * source-map功能、ES6预编译、调用ES6的module功能实现模块化
 * * 浏览器同步测试
 * */


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
    .pipe(sourcemaps.init())
    .pipe(less())
    .on('error',handleError)
    .pipe(sourcemaps.write())
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'Android >= 4.0'],
      cascade: true,                                           // 是否美化属性值 默认：true 像这样：
      remove:true                                              // 是否去掉不必要的前缀 默认：true
    }))
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('dist/css/'))
    .on('end', done)
    .pipe(reload({stream:true}))
});
gulp.task('fileInclude', function (done) {
  gulp.src(['src/app/*.html'])
    .pipe(fileInclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('dist/app'))
    .on('end', done)
    .pipe(reload({stream:true}))
});
var myDevConfig = Object.create(webpackConfig);
var devCompiler = webpack(myDevConfig);

gulp.task("build-js", function(callback) {
  return gulp.src('src/js/*.js')
    .pipe(named())
    // .pipe(sourcemaps.init())
    .pipe(webpackS(webpackConfig))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js/'))
    .pipe(reload({stream:true}));
});

//静态服务器+监听less/html 文件
gulp.task('serve',['lessmin'],function(){
  browserSync.init({
    server:"./dist/"
  });
  
  gulp.watch('src/**/*', ['lessmin', 'fileInclude'])
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

/*
 * 生产环境
 * 对发布的js、css、images加md5版本号、压缩
 * */
gulp.task('md5:css', ['sprite'], function (done) {
  gulp.src('dist/css/*.css')
    .pipe(md5(6, 'dist/app/*.html'))
    .pipe(gulp.dest('dist/css'))
    .on('end', done)
    .pipe(reload({stream:true}))
});

gulp.task('md5:js', ['build-js'], function (done){
  gulp.src([
      'dist/js/*.js',
      '!dist/js/*_??????????.js'
    ])
    .pipe(md5(6,'dist/app/*.html'))
    .pipe(gulp.dest('dist/js'))
    .on('end', done)
    .pipe(reload({stream:true}))
});

gulp.task('md5:image', ['build-js'], function (done){
  gulp.src([
      'dist/images/*',
      '!dist/js/*_??????????'
    ])
    .pipe(md5(6,['dist/css/*.css','dist/app/*.html']))
    .pipe(gulp.dest('dist/images'))
    .on('end', done)
    .pipe(reload({stream:true}))
});

gulp.task('clean', function (done) {
  gulp.src(['dist'])
    .pipe(clean())
    .on('end', done);
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

//发布
gulp.task('default',[ 'fileInclude', 'md5:css', 'md5:js','md5:image', 'serve']);
//开发
gulp.task('dev', ['copy:images','fileInclude' , 'lessmin','build-js', 'serve']);