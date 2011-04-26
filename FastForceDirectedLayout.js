dojo.provide("sevenbridges.FastForceDirectedLayout");

dojo.require("sevenbridges.ForceDirectedLayout");

dojo.declare("sevenbridges.FastForceDirectedLayout",
	sevenbridges.ForceDirectedLayout, {
	// summary:
	//		A FastForceDirectedLayout provides a similar layout
	//		to ForceDirectedLayout.

	quadTree: null,

	onTick: function(/*sevenbridges.Thread*/ thread){
		// calculate bounding box of graph
		var graph = thread.__graph;
		var vertices = [];
		var xmin = null;
		var ymin = null;
		var xmax = null;
		var ymax = null;
		for (var vertexId in graph.vertices){
			var vertex = graph.vertices[vertexId];
			vertices.push(vertex);
			if (xmin == null){
				xmin = xmax = vertex.x;
				ymin = ymax = vertex.y;
			}
			else {
				xmin = Math.min(xmin, vertex.x);
				ymin = Math.min(ymin, vertex.y);
				xmax = Math.max(xmax, vertex.x);
				ymax = Math.max(ymax, vertex.y);
			}
		}

		// build quadtree
		if (vertices.length > 0){
			this.quadTree = new this.QuadTree(
				null, xmin, ymin, xmax, ymax, vertices);
		}

		// handle tick the same as base class
		this.inherited(arguments);
	},

	sumElectrostaticForces: function(/*sevenbridges.Graph*/ graph,
		/*sevenbridges.Vertex*/ vertex){
		// summary:
		//		Sum the respulsive forces acting on vertex into f.

		// find nearby vertices
		var sum = {x: 0, y: 0};
		var quadTree = this.quadTree.leafByVertex[vertex.id];
		dojo.forEach(quadTree.vertices, function(otherVertex){
			// are we looking at a distinct vertex?
			if (otherVertex !== vertex){
				var f = this.electrostaticForce(1, vertex.x, vertex.y,
					1, otherVertex.x, otherVertex.y);
				sum.x += f.x;
				sum.y += f.y;
			}
		}, this);

		// deal with distant vertices
		while (quadTree.owner != null){
			dojo.forEach(quadTree.owner.children, function(sibling){
				if (sibling != quadTree && sibling.vertices.length > 0){
					var f = this.electrostaticForce(1, vertex.x, vertex.y,
						sibling.vertices.length, sibling.xmean, sibling.ymean);
					sum.x += f.x;
					sum.y += f.y;
				}
			}, this);

			quadTree = quadTree.owner;
		}

		return sum; // Object
	},

	QuadTree: function(/*_QuadTree*/ owner,
		/*Number*/ xmin, /*Number*/ ymin, /*Number*/ xmax, /*Number*/ ymax,
		/*sevenbridges.Vertex[]*/ vertices){

		// initialize object
		this.owner = owner;
		this.xmin = xmin;
		this.ymin = ymin;
		this.xmax = xmax;
		this.ymax = ymax;
		this.vertices = vertices;
		this.leafByVertex = (owner == null) ? {} : owner.leafByVertex;

		var sum = {x: 0, y: 0};
		dojo.forEach(vertices, function(vertex){
			sum.x += vertex.x
			sum.y += vertex.y
		});
		this.xmean = sum.x / vertices.length;
		this.ymean = sum.y / vertices.length;

		// calculate center of bounding box
		var width = (xmax - xmin);
		var height = (ymax - ymin);
		var cx = xmin + width / 2;
		var cy = ymin + height / 2;

		// need to subpartition?
		if (vertices.length > 1 && width * height > 10){
			// divide vertices into four equal quadrants
			var quadrants = [[], [], [], []];
			dojo.forEach(vertices, function(vertex){
				if (vertex.x < cx){
					quadrants[vertex.y < cy ? 0 : 1].push(vertex);
				}
				else {
					quadrants[vertex.y < cy ? 2 : 3].push(vertex);
				}
			});

			// create children quadtrees
			this.children = [
				new this.constructor(this, xmin, ymin, cx, cy, quadrants[0]),
				new this.constructor(this, xmin, cy, cx, ymax, quadrants[1]),
				new this.constructor(this, cx, ymin, xmax, cy, quadrants[2]),
				new this.constructor(this, cx, cy, xmax, ymax, quadrants[3])
			];
		}
		else {
			// update leaf by vertex index
			dojo.forEach(vertices, function(vertex){
				this.leafByVertex[vertex.id] = this;
			}, this);

			// no children
			this.children = null;
		}
	}
});
