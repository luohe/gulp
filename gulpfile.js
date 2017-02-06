/**
 Gulpfile for gulp-webpack-demo
 created by fwon
 */
var gulp = require('gulp'),
  os = require('os'),
  fs = require('fs'),
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
  colors = require('colors'),
  plumber = require('gulp-plumber'),
  //圖片壓縮模塊
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  smushit = require('gulp-smushit'),
  cache = require('gulp-cache'),
  
  watch = require("node-watch");




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
  prompt: 'gray',
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
  port: 2000,
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
  gulp.src(['src/css/*.less'])
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(less())
    // .on('error',handleError)
    .pipe(sourcemaps.write())
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'Android >= 4.0'],
      cascade: true,                                           // 是否美化属性值 默认：true 像这样：
      remove:true                                              // 是否去掉不必要的前缀 默认：true
    }))
    // .pipe(concat('style.min.css'))
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
    .pipe(gulp.dest('dist/app/'))
    .on('end', done)
    .pipe(reload({stream:true}))
});

var myDevConfig = Object.create(webpackConfig);
var devCompiler = webpack(myDevConfig);

gulp.task("build-js", function(callback) {
  return gulp.src('src/js/*.js')
    .pipe(plumber())
    .pipe(named())
    .pipe(webpackS(webpackConfig))
    .pipe(gulp.dest('dist/js/'))
    .pipe(reload({stream:true}));
});

gulp.task("lib-js",function () {
  return gulp.src("src/lib/*.js")
    .pipe(plumber())
    .pipe(gulp.dest("dist/lib/"))
    .pipe(reload({stream:true}))
  
});

//静态服务器+监听less/html/js 文件
gulp.task('serve',['lessmin'],function(){
  browserSync.init({
    port: 3007,
    server:"./dist/"
  });
  gulp.watch('src/css/*', ['lessmin'])
    .on('end', reload);
  gulp.watch("src/app/*",['fileInclude'])
    .on('end',reload);
  // gulp.watch("src/lib/*.js",['lib-js']);
  
  var watcher = watch('./src/js/', { recursive: false, followSymLinks: true });
  watcher.on('change', function(fileName) {
    var oldTime = new Date();
    gulp.src(fileName)
      .pipe(plumber())
      .pipe(named())
      .pipe(webpackS(webpackConfig))
      .pipe(gulp.dest('dist/js/'))
      .on("end",function () {
        var newTime = new Date();
        console.log("[BS]".prompt+(" 耗时："+(newTime - oldTime)+"ms").verbose);
      })
      .pipe(reload({stream:true}));
  });
  
  var watchImg = watch('./src/images/', { recursive: false, followSymLinks: true });
  watchImg.on('change',function (fileName) {
    console.log(fileName);
    var imgDir = __dirname + ("\\") + fileName;
    var imgDist = __dirname +("\\dist\\")+ imgDir.match(/images\\.{1,}?\.(png|jpg|gif)/)[0];
    if(fs.existsSync(imgDir)){
      if(!fs.existsSync(imgDist)){
        gulp.src(imgDir)
          .pipe(cache(imagemin({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true,
            multipass: true,
            use: [pngquant()]
          })))
          .pipe(gulp.dest("dist/images/"));
      }
    }else{
      if(fs.existsSync(imgDist)){
        fs.unlinkSync(imgDist);
      }
    }
  })
});


/*
 * 生产环境
 * 对发布的js、css、images加md5版本号、压缩
 * */
gulp.task('md5:css', ['sprite'], function (done) {
  gulp.src([
      'dist/css/*.css',
      '!dist/css/*_??????.css'
    ])
    .pipe(md5(6, 'dist/app/*.html'))
    .pipe(gulp.dest('dist/css'))
    .on('end', function () {
      gulp
        .src([
        'dist/css/*.css',
        '!dist/css/*_??????.css'
        ])
        .pipe(clean())
    });
});

gulp.task('md5:js', ['build-js'], function (done){
  gulp.src([
      'dist/js/*.js',
      '!dist/js/*_??????.js'
    ])
    .pipe(md5(6,'dist/app/*.html'))
    .pipe(gulp.dest('dist/js'))
    .on('end', function () {
      gulp.src([
          'dist/js/*.js',
          '!dist/js/*_??????.js'
        ])
        .pipe(clean());
      gulp.src([
        'dist/js/*.js.map',
        '!dist/js/*_??????.js.map'
      ])
        .pipe(clean())
    });
});

gulp.task('md5:image', ['build-js'], function (done){
  gulp.src([
      'dist/images/*',
      '!dist/images/*_??????.*'
    ])
    .pipe(md5(6,['dist/css/*.css','dist/app/*.html']))
    .pipe(gulp.dest('dist/images'))
    .on('end', function () {
      gulp.src([
          'dist/images/*',
          '!dist/images/*_??????.*'
        ])
        .pipe(clean())
    });
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
  gulp.src('dist/css/**.css')
    .pipe(spriter(spriteOption))
    .pipe(base64())
    .pipe(cssmin())
    .pipe(gulp.dest('./dist/css'))
    .on('end', done)
    .pipe(reload({stream:true}))
});

//发布
gulp.task('default',[ 'fileInclude', 'md5:css', 'md5:js','md5:image', 'serve',"sprite"]);
//开发
gulp.task('dev', ['copy:images','fileInclude' , 'lessmin','build-js','lib-js', 'serve']);