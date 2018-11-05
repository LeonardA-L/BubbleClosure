/**
* A minimalistic hash function to pinpoint elements in the grid based on coordinates
*/
function hash(_col, _row) {
  return _row + '-' + _col;
}

/**
* Manages a hex grid of generic elements.
* Elements are placed with a horizontal convention.
*/
exports = Class(Object, function() {
  this.map = {};

  /**
  * Allows to register an element to the grid with a position
  * @arg {object} [_element]
  * @arg {int} [_col]
  * @arg {int} [_row]
  */
  this.register = function(_element, _col, _row) {
    this.map[hash(_col, _row)] = _element;
  };

  /**
  * Unregisters the element present at coordinates and returns it
  * @arg {int} [_col]
  * @arg {int} [_row]
  */
  this.unregister = function(_col, _row) {
    const element = this.get(_col, _row);
    if(!element)
      return null;

    this.map[hash(_col, _row)] = undefined;
    return element;
  };

  /**
  * Gets the element at coordinates. Returns undefined if no element exists
  * @arg {int} [_col]
  * @arg {int} [_row]
  */
  this.get = function(_col, _row) {
    return this.map[hash(_col, _row)];
  };

  /**
  * Finds all neighbours of a cell on the grid
  * @arg {int} [_col]
  * @arg {int} [_row]
  */
  this.neighbours = function(_col, _row) {
    var neigh = [];

    // Common neighbour cells
    neigh.push(this.get(_col, _row - 1));
    neigh.push(this.get(_col - 1, _row));
    neigh.push(this.get(_col + 1, _row));
    neigh.push(this.get(_col, _row + 1));

    // Cells that vary based on row position
    if(_row % 2 === 0) {
      neigh.push(this.get(_col - 1, _row - 1));
      neigh.push(this.get(_col - 1, _row + 1));
    } else {    
      neigh.push(this.get(_col + 1, _row - 1));
      neigh.push(this.get(_col + 1, _row + 1));
    }

    // Filter out null values
    return neigh.filter(function (_el) {
      return !!_el;
    });
  };

  /**
  * Simple flood fill algorithm to find, using neighbours, all the cells in a group of cells.
  * Caller can provide a filter function to define rules for belonging to a cluster, for instance
  * having a specific type.
  * @arg {array} [_startPoints] the elements to start the cluster analysis on
  * @arg {function} [_testFn] filter function
  * /!\ This function assumes the elements in _startPoints have `col` and `row` properties
  * This algorithm has a O(n) complexity. It will process a node at most once.
  */
  this.getCluster = function(_startPoints, _testFn) {
    var testFn = _testFn || (e => true);

    var neighbours = [..._startPoints];  // List of nodes to inspect
    var inspected = {};                  // Map of inspected node. It is a map for performance issues
                                         // If it was a regular array, complexity would be O(n²)
    var cluster = [];                    // Final list of nodes in the cluster

    while(neighbours.length) {
      // Find the next neighbour to inspect
      var neighbour = neighbours.pop();
      // If the neighbour passes the test and hasn't been inspected
      if(testFn(neighbour) && !inspected[hash(neighbour.col, neighbour.row)])
      {
      	// then it is part of the cluster
        cluster.push(neighbour);
        // And we can push its children on the list of nodes to be inspected
        var childNeighbours = this.neighbours(neighbour.col, neighbour.row);
        neighbours.push(...childNeighbours);
      }
      // Flag the current node as inspected
      inspected[hash(neighbour.col, neighbour.row)] = true;
    }
    // Filter duplicates out of the cluster
    cluster = [...new Set(cluster)];

    return cluster;
  };
});