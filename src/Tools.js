// Shims
Array.prototype.diff = function(a) {
	return this.filter(function(i) {return a.indexOf(i) < 0;});
};

exports = {
	randomProperty: function (obj) {
		const keys = Object.keys(obj);
		return obj[keys[ keys.length * Math.random() << 0]];
	}
}