var chokidar = require('chokidar'),
	PluginError = require('gulp-util').PluginError,
	globule = require('globule'),
	EE = require('events').EventEmitter,
	log = require('./lib/log');



function getTaskFn(task, gulp) {
	var fn;

	if(task) {
		if(gulp) {
			if(gulp.parallel) {
				fn = gulp.parallel(task);
			} else if(gulp.start) {
				fn = function () {
					gulp.start(task);
				};
			}
		} else if(typeof task === 'function') {
			fn = task;
		}
	}

	if( ! task || ! gulp && typeof task !== 'function') {
		fn = function () {};
	}


	return fn;
}


function watch(globs, opts, task) {

	if ( ! globs) {
		throw new PluginError('gulp-chokidar', 'glob argument required');
	}

	if (typeof opts === 'function' || typeof opts === 'string' || Array.isArray(opts)) {
		task = opts;
		opts = {};
	}


	opts.ready = !! opts.ready;
	task = getTaskFn(task, this.gulp);


	var out = new EE;

    var chokidarOpts = {
      persistent: true,
      ignoreInitial: true
    }

    Object.keys(opts).forEach(function(key){
      if(key == "ready") return; // Return early to not add this key
      chokidarOpts[key] = opts[key]
    })

	var watcher = chokidar.watch(globs, chokidarOpts)
	.on('change', log.bind(module, 'change'))
	.on('add', log.bind(module, 'add'))
	.on('unlink', log.bind(module, 'delete'))
	.on('error', log.bind(module, 'error'))
	
	.on('ready', function () {
		opts.ready && task.call(out);
	})
	.on('add', task.bind(out))
	.on('change', task.bind(out))
	.on('unlink', task.bind(out))

	.on('all', out.emit.bind(out, 'all'))
	.on('ready', out.emit.bind(out, 'ready'))
	.on('add', out.emit.bind(out, 'add'))
	.on('change', out.emit.bind(out, 'change'))
	.on('unlink', out.emit.bind(out, 'delete'))
	.on('error', out.emit.bind(out, 'error'))


	return out;
};


module.exports = function () {

	if( ! arguments[0] || arguments[0].Gulp) {
		module.gulp = arguments[0];
		return function () {
			return watch.apply(module, arguments);
		}
	} else {
		return watch.apply(module, arguments);
	}

};
