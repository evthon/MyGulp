var util = require('gulp-util');


module.exports = function (event, path) {
	var text = null;
	path = path.replace(/\\\\/g, '/').replace(/\\/g, '/');


	switch(event) {
		case 'change':
			text = 'was changed';
			break;
		case 'add':
			text = 'was added';
			break;
		case 'delete':
			text = 'was deleted';
			break;
		case 'error':
			text = 'has an error';
			break;
	};

	if(text) {
		util.log("'" + util.colors.cyan(path) + "'", text);
	}
};
