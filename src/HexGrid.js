function hash(_col, _row) {
	return _row+'-'+_col;
}

exports = Class(Object, function() {
	this.map = {};

	this.register = function(_element, _col, _row) {
		this.map[hash(_col, _row)] = _element;
	}

	this.unregister = function(_col, _row) {
		const element = this.get(_col, _row);
		if(!element)
			return null;

		this.map[hash(_col, _row)] = undefined;
		return element;
	}

	this.get = function(_col, _row) {
		return this.map[hash(_col, _row)];
	}

	this.neighbours = function(_col, _row) {
		var neigh = [];

		neigh.push(this.get(_col, _row - 1));
		neigh.push(this.get(_col - 1, _row));
		neigh.push(this.get(_col + 1, _row));
		neigh.push(this.get(_col, _row + 1));

		if(_row % 2 === 0) {
			neigh.push(this.get(_col - 1, _row - 1));
			neigh.push(this.get(_col - 1, _row + 1));
		} else {		
			neigh.push(this.get(_col + 1, _row - 1));
			neigh.push(this.get(_col + 1, _row + 1));
		}

		return neigh.filter(function (_el) {
		  return _el != undefined;
		});
	}

	this.getCluster = function(_startPoints, _testFn) {
		var testFn = _testFn || ((e) => true);

		var neighbours = [..._startPoints];
	    var inspected = {};
	    //inspected[_bubble.row + '-' + _bubble.col] = true;
	    var cluster = [];

	    while(neighbours.length) {
	      var neighbour = neighbours.pop();
	      if(!testFn || testFn(neighbour))
	      {
	        cluster.push(neighbour);
	        var childNeighbours = this.neighbours(neighbour.col, neighbour.row);
	        for(var i = 0; i < childNeighbours.length; i++) {
	          if(!inspected[childNeighbours[i].row + '-' + childNeighbours[i].col]) {
	            neighbours.push(childNeighbours[i]);
	          }
	        }
	      }
	      inspected[neighbour.row + '-' + neighbour.col] = true;
	    }
	    cluster = [...new Set(cluster)];
	    return cluster;
	}
});