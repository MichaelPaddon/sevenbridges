dojo.provide("sevenbridges.ForceDirectedLayout");

dojo.require("sevenbridges.AnimatedLayout");

dojo.declare("sevenbridges.ForceDirectedLayout", sevenbridges.AnimatedLayout, {
	// summary:
	//		A ForceDirectedLayout lays out the graph by simulating
	//		electostatic repulsion between vertices and treating edges
	//		as stretched springs. These forces are damped so that the
	//		system can find an equilibrium state.

	// electrostaticConstant: Number
	//		The magnitude of the inverse square repulsive force
	//		between vertices.
	electrostaticConstant: 110,

	// springConstant: Number
	//		The magnitude of the linear attracting force
	//		along edges.
	springConstant: 0.01,

	// frictionConstant: Number
	//		The magnitude of the constant of friction
	//		which slows the vertices down.
	frictionConstant: 0.5,

	// energyThreshold: Number
	//		When the kinetic energy of the system drops below
	//		this threshold, the layout thread exits.
	energyThreshold: 1,

	onTick: function(/*sevenbridges.Thread*/ thread){
		// summary:
		//		Perform layout iteration.

		// total system energy
		var energy = 0;

		// update vertex velocities
		var graph = thread.__graph;
		var vertexStates = thread.__vertexStates;
		var z = {ex:0, ey:0, sx:0, sy:0};
		for (var vertexId in graph.vertices){
			// get vertex state
			var state = vertexStates[vertexId];
			if (!state){
				state = vertexStates[vertexId] = {dx: 0, dy: 0, persist: true};
			}

			// vertex grabbed or pinned?
			var vertex = graph.vertices[vertexId];
			if (vertex.grabbed || vertex.pinned){
				state.dx = 0;
				state.dy = 0;
				state.x = vertex.x;
				state.y = vertex.y;
			}
			else {
				// calculate force vectors acting on vertex
				var fe = this.sumElectrostaticForces(graph, vertex);
				var fs = this.sumSpringForces(vertex);

				z.ex += fe.x;
				z.ey += fe.y;
				z.sx += fs.x;
				z.sy += fs.y;

				// accelerate vertex
				state.dx += fe.x + fs.x;
				state.dy += fe.y + fs.y;

				// frictional damping
				state.dx += -state.dx * this.frictionConstant;
				state.dy += -state.dy * this.frictionConstant;

				// set target coordinates
				state.x = vertex.x + state.dx;
				state.y = vertex.y + state.dy;

				// accumulate kinetic energy
				energy += (state.dx * state.dx + state.dy * state.dy);
			}
		}

		// perform animation
		this.inherited(arguments);

		// system energy below our threshold?
		if (energy < this.energyThreshold){
			// terminate thread
			thread.deferred.resolve();
		}
	},

	sumElectrostaticForces: function(/*sevenbridges.Graph*/ graph,
		/*sevenbridges.Vertex*/ vertex){
		// summary:
		//		Sum the respulsive forces acting on vertex.

		// sum force across all vertices in graph
		var sum = {x: 0, y: 0};
		for (var otherVertexId in graph.vertices){
			// are we looking at a distinct vertex?
			var otherVertex = graph.vertices[otherVertexId];
			if (otherVertex !== vertex){
				var f = this.electrostaticForce(1, vertex.x, vertex.y,
					1, otherVertex.x, otherVertex.y);
				sum.x += f.x;
				sum.y += f.y;
			}
		}
		return sum; // Object
	},

	sumSpringForces: function(/*sevenbridges.Vertex*/ vertex){
		// summary:
		//		Sum the spring forces acting on vertex.

		// sum forces along all connected edges
		var sum = {x: 0, y: 0};
		for (var edgeId in vertex.edges){
			// edge complete?
			var edge = vertex.edges[edgeId];
			if (edge.source && edge.target){
				var otherVertex = (edge.source === vertex)
					? edge.target : edge.source;
				var f = this.springForce(vertex.x, vertex.y,
					otherVertex.x, otherVertex.y);
				sum.x += f.x;
				sum.y += f.y;
			}
		}
		return sum; // Object
	},

	electrostaticForce: function(q1, x1, y1, q2, x2, y2){
		// summary:
		//		Calculate the electrostatic force between two point charges.

		// calculate the distance between the points
		var dx = x1 - x2;
		var dy = y1 - y2;

		// perturb away zero distance
		while (dx == 0 && dy == 0){
			dx = Math.random() - 0.5;
			dy = Math.random() - 0.5;
		}

		// apply Coulomb's Law
		var k = this.electrostaticConstant;
		var q = q1 * q2;
		var r = Math.sqrt(dx * dx + dy * dy);
		var r3 = r * r * r;
		return {x: (k * q * dx / r3), y: (k * q * dy / r3)}; // Object
	},

	springForce: function(x1, y1, x2, y2){
		// summary:
		//		Calculate the spring force between two points.

		// calculate the distance between the points
		var dx = x2 - x1;
		var dy = y2 - y1;

		// apply Hooke's law
		var k = this.springConstant;
		return {x: (k * dx), y: (k * dy)}; // Object
	}
});
