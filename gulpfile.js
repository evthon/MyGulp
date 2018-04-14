var gulp           = require("gulp"),
    browserSync    = require("browser-sync"),
    uglify         = require("gulp-uglifyjs"),
    cssnano        = require("gulp-cssnano"),
    autoprefixer   = require("gulp-autoprefixer"),
    readline       = require("readline-sync"),
    imageresiza    = require("gulp-image-resize"),
    fs             = require("fs"),
    rename         = require("gulp-rename"),
    imagemon       = require("gulp-imagemin"),
    htmlmin        = require("gulp-htmlmin"),
    uncss          = require("gulp-uncss"),
    autopolyfiller = require("gulp-autopolyfiller"),
    merge          = require("event-stream").merge,
    order          = require("gulp-order"),
    concat         = require("gulp-concat"),
    imagemin       = require("gulp-imagemin"),
    image_resize   = require("gulp-image-resize"),
    watch          = require("gulp-chokidar")(gulp);

var AppFiles       = [],
    polyfills      = true,
    imageprerols   = {act: false, w: 100, h: 100};

gulp.task("StartServer", function () {
    browserSync({
        server: {
            baseDir: "../"
        },
        notify: false
    });
    watch("../*.html",browserSync.reload)
});

gulp.task("readdir", function () {
    fs.readdirSync("app/").forEach(function (file) {
        if (~file.indexOf(".html")) {
            AppFiles.push(file.split(".")[0]);
        }
    });
});

gulp.task("mov-libs", function () {
    fs.readdir("vendors", function (err, files) {
        files.forEach(function (file) {
            if (!(~file.indexOf(".js") || ~file.indexOf(".css"))) {
                fs.copyFile("vendors/" + file + "/dist/" + file + ".js", "vendors/" + file + ".js", function (err) {
                    if (err) {
                        var er = err.errno;
                    };
                    if (er == -4058) {
                        fs.copyFile("vendors/" + file + "/dist/js/" + file + ".js", "vendors/" + file + ".js", function (err) {
                            if (err) {
                                console.log("Not js in " + file + " libs");
                            };
                        });
                    }
                });
                fs.copyFile("vendors/" + file + "/dist/" + file + ".css", "app/scss/" + file + ".lib.scss", function (err) {
                    if (err) {
                        var er = err.errno;
                    };
                    if (er == -4058) {
                        fs.copyFile("vendors/" + file + "/dist/css/" + file + ".css", "app/scss/" + file + ".lib.scss", function (err) {
                            if (err) {
                                console.log("Not css in " + file + " libs");
                            };
                        });
                    }
                });
            };
        });
    });
});

gulp.task("html", ["readdir"], function () {
    AppFiles.forEach(function (file) {
        return gulp.src("app/" + file + ".html")
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest("../"));
    });
});

gulp.task("css", function () {
    AppFiles.forEach(function (file) {
        var file_chil;
        
        file == "index"? file_chil = "main" : file_chil = file;
        return gulp.src("app/css/" + file_chil + ".css")
        .pipe(autoprefixer("last 2 version", "safari 5", "ie 8", "ie 9", "opera 12.1", "ios 6", "android 4"))
        .pipe(uncss({
            html: ["app/" + file + ".html"]
        }))
        .pipe(cssnano())
        .pipe(gulp.dest("../css/"));
    });
});

gulp.task("js", function () {
    AppFiles.forEach(function (file) {
        var file_chil;
        file == "index"? file_chil = "main" : file_chil = file;
        
        switch (polyfills) {
            case false:
                return gulp.src("app/js/" + file_chil + ".js")
                .pipe(uglify())
                .pipe(gulp.dest("../js/"));
                break;
            case true:
                var fl = gulp.src("app/js/" + file_chil + ".js");
                var pol = fl.pipe(autopolyfiller("polyfills.js"));
                return merge(fl, pol)
                .pipe(order(["polyfills.js", "app/js/" + file_chil + ".js"]))
                .pipe(concat(file_chil + ".js"))
                .pipe(uglify())
                .pipe(gulp.dest("../js/"));
                break;
        }
    });
});

gulp.task("js-libs", function () {
    AppFiles.forEach(function (file) {
        var file_chil, data, start_index, end_index, arr_libs;
        
        file == "index"? file_chil = "main" : file_chil = file;
        
        data = fs.readFileSync("app/js/" + "main.js");
        data? data = data.toString() : data = "";
        start_index = data.indexOf("//-require ");
        end_index = data.indexOf(" require-//");
        arr_libs;
        if (~start_index && ~end_index) {
            arr_libs = data.slice(start_index + 11, end_index).replace(/,\s/g, ',').split(",");
            for (i = 0; i < arr_libs.length; i++) {
                arr_libs[i] = "vendors/" + arr_libs[i] + ".js";
            }
            arr_libs.push("app/js/" + file_chil + ".js");
            console.log(arr_libs);
            gulp.src(arr_libs)
                .pipe(concat(file_chil + ".js"))
                .pipe(gulp.dest("app/js/"));
        }
    });
    setTimeout(function () {
        gulp.start("js");
    }, 100);
});

gulp.task("img", function () {
    fs.readdir("app/img/", function (err, files) {
        if (files) {
            files.forEach(function (file) {
                var imfile = gulp.src("app/img/" + file);
                var imp = imageprerols.act;
                if (~file.indexOf(".svg")) imp = false;
                switch (imp) {
                    case true:
                        imfile
                            .pipe(image_resize({
                                width: imageprerols.w,
                                height: imageprerols.h,
                                crop: true,
                                upscale: false
                            }))
                            .pipe(gulp.dest("../img/pre-rolls/"))
                    case false:
                        imfile
                            .pipe(imagemin())
                            .pipe(gulp.dest("../img/"));
                        break;
                }
            });
        }
        
    });
});

gulp.task("fonts", function () {
    return gulp.src("app/fonts/**/*.{ttf,otf}")
    .pipe(gulp.dest("../fonts/"));
});

gulp.task("watcher", function () {
    watch("app/*.html","html");
    watch("app/css/*.css","css");
    watch("app/js/*.js","js-libs");
    watch("vendors/**/*.{js, css}","mov-libs");
    watch("app/img/*.{jpeg, png, svg, jpg}","img");
    watch("app/fonts/**/*{ttf,otf}","fonts");
});

gulp.task("default", ["html", "css", "js", "mov-libs", "img", "fonts", "watcher"]);