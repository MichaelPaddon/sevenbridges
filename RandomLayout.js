dojo.provide("sevenbridges.RandomLayout");

dojo.require("sevenbridges.AnimatedLayout");

dojo.declare("sevenbridges.RandomLayout", sevenbridges.AnimatedLayout, {
	// summary:
	//		Layout the nodes in the graph randomly.

	// xmin: Number
	//		Minimum x value (default 0).
	xmin: 0,

	// ymin: Number
	//		Minimum y value (default 0).
	ymin: 0,

	// xmax: Number
	//		Maximum x value (default 0).
	xmax: 0,

	// ymax: Number
	//		Maximum y value (default 0).
	ymax: 0,

	onStart: function(/*sevenbridges.Thread*/ thread){
		// summary:
		//		Generate random targets each vertex.

		this.inherited(arguments);

		// get bounding box
		var xmin = this.xmin;
		var ymin = this.ymin;
		var xmax = this.xmax;
		var ymax = this.ymax;
		var graph = thread.__graph;
		if (xmin == 0 && ymin == 0 && xmax == 0 && ymax == 0){
			xmin = -graph.domNode.parentNode.clientWidth / 3;
			ymin = -graph.domNode.parentNode.clientHeight / 3;
			xmax = -xmin;
			ymax = -ymin;
		}

		// calculate extents
		xextent = xmax - xmin;
		yextent = ymax - ymin;

		// generate a target coordinate for each node
		var vertexStates = thread.__vertexStates;
		for (var vertexId in graph.vertices){
			// determine random coordinates for vertices
			var vertex = graph.vertices[vertexId];
			vertexStates[vertexId] = {
				x: xmin + Math.random() * xextent,
				y: ymin + Math.random() * yextent
			}
		}
	}
});
