var gulp = require('gulp'),
	watch = require('..')(gulp);

gulp.task('change', function () {
	console.log('File Changed');
})

gulp.task('default', function () {
	watch(['src/*.css'], 'change');
});
