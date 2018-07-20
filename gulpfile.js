const gulp         = require("gulp"),
	browserSync    = require("browser-sync"),
	uglify         = require("gulp-uglifyjs"),
	cssnano        = require("gulp-cssnano"),
	autoprefixer   = require("gulp-autoprefixer"),
	fs             = require("fs"),
	htmlmin        = require("gulp-htmlmin"),
	uncss          = require("gulp-uncss"),
	autopolyfiller = require("gulp-autopolyfiller"),
	merge          = require("event-stream").merge,
	order          = require("gulp-order"),
	concat         = require("gulp-concat"),
	imagemin       = require("gulp-imagemin"),
	image_resize   = require("gulp-image-resize"),
	watch          = require("gulp-chokidar")(gulp);

let AppFiles       = [],
	polyfills      = process.env.polyfills,
	uncsstest      = process.env.uncss,
	imageprerols   = {act: false, w: 100, h: 100};

if (polyfills === "false") {
	polyfills = false;
} else if (polyfills === "true") {
	polyfills = true;
}

if (uncsstest === "false") {
	uncsstest = false;
} else if (uncsstest === "true") {
	uncsstest = true;
}

gulp.task("CreateTree", function () {
	fs.mkdir("app", function (err) {
		if (!err || err.code === "EEXIST") {

			fs.mkdir("app/css", function (err) {
				if (err && err.code !== "EEXIST") {
					console.log(err);
				}
			});
			fs.mkdir("app/fonts", function (err) {
				if (err && err.code !== "EEXIST") {
					console.log(err);
				}
			});
			fs.mkdir("app/img", function (err) {
				if (err && err.code !== "EEXIST") {
					console.log(err);
				}
			});
			fs.mkdir("app/js", function (err) {
				if (err && err.code !== "EEXIST") {
					console.log(err);
				}
			});
			fs.mkdir("app/scss", function (err) {
				if (err && err.code !== "EEXIST") {
					console.log(err);
				}
			});
		} else {
			console.log(err)
		}
	});
	fs.mkdir("vendors", function (err) {
		if (err && err.code !== "EEXIST") {
			console.log(err);
		}
	});
});

gulp.task("StartServer", function () {
	browserSync({
		server: {
			baseDir: "../" + process.env.html
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
	fs.readdirSync("vendors").forEach(function (file) {
		if (!(~file.indexOf(".js") || ~file.indexOf(".css"))) {
			fs.copyFile("vendors/" + file + "/dist/" + file + ".js", "vendors/" + file + ".js", function (err) {
				let er;
				err? er=err.errno : er = false;
				if (er === -4058) {
					fs.copyFile("vendors/" + file + "/dist/js/" + file + ".js", "vendors/" + file + ".js", function (err) {
						if (err) {
							console.log("Not js in " + file + " libs");
						}
					});
				}
			});
			fs.copyFile("vendors/" + file + "/dist/" + file + ".css", "app/scss/_" + file + ".scss", function (err) {
				let er;
				err? er=err.errno : er = false;
				if (er === -4058) {
					fs.copyFile("vendors/" + file + "/dist/css/" + file + ".css", "app/scss/_" + file + ".scss", function (err) {
						if (err) {
							console.log("Not css in " + file + " libs");
						}
					});
				}
			});
		}
	});
	 return gulp.src("./vendors/*.js")
		.pipe(concat("_libs.js"))
		.pipe(uglify())
		.pipe(gulp.dest("./app/js/"));
});

gulp.task("html", ["readdir"], function () {
	AppFiles.forEach(function (file) {
		return gulp.src("app/" + process.env.html + file + ".html")
			.pipe(htmlmin({collapseWhitespace: true}))
			.pipe(gulp.dest("../" + process.env.html));
	});
});

gulp.task("css", function () {
	if (uncsstest === true) {
		AppFiles.forEach(function (file) {
			let file_chil;

			file === "index"? file_chil = "main" : file_chil = file;
			return gulp.src("app/css/" + file_chil + ".css")
				.pipe(autoprefixer("last 2 version", "safari 5", "ie 8", "ie 9", "opera 12.1", "ios 6", "android 4"))
				.pipe(uncss({
					html: ["app/" + file + ".html"]
				}))
				.pipe(cssnano())
				.pipe(gulp.dest("../" + process.env.css + "/"));
		});
	} else {
		AppFiles.forEach(function (file) {
			let file_chil;

			file === "index"? file_chil = "main" : file_chil = file;
			return gulp.src("app/css/" + file_chil + ".css")
				.pipe(autoprefixer("last 2 version", "safari 5", "ie 8", "ie 9", "opera 12.1", "ios 6", "android 4"))
				.pipe(cssnano())
				.pipe(gulp.dest("../" + process.env.css +  "/"));
		});
	}
});

gulp.task("js", function () {
	AppFiles.forEach(function (file) {
		let file_chil;
		file === "index"? file_chil = "main" : file_chil = file;

		switch (polyfills) {
			case false:
				return gulp.src("app/js/" + file_chil + ".js")
					.pipe(uglify())
					.pipe(gulp.dest("../" + process.env.js + "/"));
				break;
			case true:
				let fl = gulp.src("app/js/" + file_chil + ".js");
				let pol = fl.pipe(autopolyfiller("polyfills.js"));
				return merge(fl, pol)
					.pipe(order(["polyfills.js", "app/js/" + file_chil + ".js"]))
					.pipe(concat(file_chil + ".js"))
					.pipe(uglify())
					.pipe(gulp.dest("../" + process.env.js + "/"));
				break;
		}
	});
	fs.copyFile("./app/js/_libs.js", "../" + process.env.js + "/_libs.js", function (err) {
		let er;
		err? er=err.errno : er = false;
		if (er === -4058) {
			fs.mkdir("../" + process.env.js, function (err) {
				fs.copyFile("./app/js/_libs.js", "../" + process.env.js + "/_libs.js", function (err) {});
			})
		}
	});
});

gulp.task("img", function () {
	fs.readdir("app/img", function (err, files) {
		if (files) {
			files.forEach(function (file) {
				let imfile = gulp.src("app/img/" + file);
				let imp = imageprerols.act;
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
							.pipe(gulp.dest("../" + process.env.img + "/pre-rolls/"))
					case false:
						imfile
							.pipe(imagemin())
							.pipe(gulp.dest("../" + process.env.img + "/"));
						break;
				}
			});
		}

	});
});

gulp.task("fonts", function () {
	return gulp.src("app/fonts/**/*.{ttf,otf}")
		.pipe(gulp.dest("../" + process.env.fonts + "/"));
});

gulp.task("watcher", function () {
	watch("app/" + process.env.html + "/*.html","html");
	watch("app/css/*.css","css");
	watch("vendors/**/*.{js, css}","mov-libs");
	watch("app/img/*.{jpeg, png, svg, jpg}","img");
	watch("app/fonts/**/*{ttf,otf}","fonts");
	watch("app/js/*.js", "js");
});



gulp.task("default", ["CreateTree", "html", "css", "mov-libs", "js", "img", "fonts", "watcher"]);