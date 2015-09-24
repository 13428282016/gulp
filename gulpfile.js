var gulp=require('gulp'),
   uglify=require('gulp-uglify'),
    plugins=require('gulp-load-plugins')(),
    combiner=require('stream-combiner2'),
    del=require('del'),
    vinylPaths=require('vinyl-paths'),
    stripDebug=require('gulp-strip-debug'),
    minifyCss=require('gulp-minify-css'),
    jshint=require('gulp-jshint'),
    autoprefixer=require('gulp-autoprefixer'),
    sourceMaps=require('gulp-sourcemaps'),
    sass=require('gulp-sass'),
    less=require('gulp-less'),
    rename=require('gulp-rename'),
    notify=require('gulp-notify'),
    minifyImg=require('gulp-imagemin'),
    livereload=require('gulp-livereload'),
    connect=require('gulp-connect');

gulp.task('minify:js',function(){

   gulp.src('misc/v1/**/*.js')
       .pipe(plugins.uglify())
       .pipe(notify('minify js ok!'))
       .pipe(gulp.dest('build'));
});
gulp.task('concat:js',function(){

    gulp.src(['build/v1/js/common/*.js'])
        .pipe(plugins.concat('app.js'))
        .pipe(gulp.dest('build/v1/js'));
});
gulp.task('jshint',function(){
    gulp.src(['misc/v1/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
})
gulp.task('debug',function(){

    //stream-combiner2 把多个 stream 合并为一个，也就是说只需要添加一个错误监听
     var combined=combiner.obj([
         gulp.src('414234234js/*423*/*.js'),
         uglify(),
         function(){
           throw  "2323"
         },
         gulp.dest('ddd')
     ]);
    combined.on('error',console.error.bind(console));
    return combined;
});

gulp.task('del:test',function(){
    gulp.src('build/v1/js/lib/*form*.js')
        .pipe(vinylPaths(del))
        .pipe(stripDebug())
        .pipe(gulp.dest('dist'));

});

gulp.task('minify:css',function(){
  gulp.src(['misc/v1/**/*.css'])
      .pipe(minifyCss())
      .pipe(gulp.dest('build/v1'));
});
gulp.task('concat:css',function(){
    gulp.src(['build/v1/**/*.css'])
        .pipe(plugins.concat('app.css'))
        .pipe(gulp.dest('build/v1/css'));
});
gulp.task('autoprefixer',function(){
    gulp.src(['build/v1/**/*.css'])
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'));
});
gulp.task('sourcemaps',function(){
    gulp.src(['build/v1/**/*.js'])
        .pipe(sourceMaps.init())
        .pipe(sourceMaps.write('./js/maps'))
        .pipe(gulp.dest('build/v1'));
});
gulp.task('sass',function(){
    gulp.src(['misc/v1/sass/bootstrap.scss'])
        .pipe(sass())
        .pipe(gulp.dest('build/v1/css'))
});
gulp.task('less',function(){

    gulp.src(['misc/v1/less/bootstrap.less'])
        .pipe(less())
        .pipe((rename({
            dirname:'',
            basename: "all",
            prefix: "bootstrap-",
            suffix: "-less",
            extname: ".css"
        })))
        .pipe(notify('less to css ok!'))
        .pipe(gulp.dest('build/v1/css'));


})
gulp.task('minify:img',function(){
    gulp.src(['misc/v1/**/*.jpg','misc/v1/**/*.png'])
        .pipe(minifyImg())
        .pipe(gulp.dest('build/v1'));
})

gulp.task('livereload',function(){
     livereload.listen({port:8080,start:true,host:'localhost',basePath:'misc/v1'})
    gulp.watch(['misc/v1/test.html'],function(file){
             livereload.reload(file);
    })
});
gulp.task('connect',function(){
    connect.server({
        root:'misc/v1',
        livereload:true,
        port:8000,
        host:'localhost',

    })
    gulp.watch(['misc/**/*.html'],function(){
        gulp.src(['misc/**/*.html'])
            .pipe(connect.reload())
    });
});
