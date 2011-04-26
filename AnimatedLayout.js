dojo.provide("sevenbridges.AnimatedLayout");

dojo.require("sevenbridges.Layout");

dojo.declare("sevenbridges.AnimatedLayout", sevenbridges.Layout, {
	// summary:
	//		An AnimatedLayout determines new vertex positions and
	//		animates moving the vertices to those coordinates.

	// speed: Number
	//		The maxiumum speed of vertices in units per tick (default 10).
	//		When speed <= 0, nodes move infinitely fast.
	speed: 10,

	onStart: function(/*sevenbridges.Thread*/ thread){
		// summary:
		//		Initialize layout.

		// this is where we keep vertex state
		thread.__vertexStates = {};
	},

	onTick: function(/*sevenbridges.Thread*/ thread){
		// summary:
		//		Move vertices towards their targets.
        // detail:
		//		Each vertex being animated requires a state object
		//		stored in thread.__vertexStates and indexed by
		//		its id.
		//
		//		Each state record is an object, required to have members
		//		"x" and "y" specifying the target coordinates.
		//		
		//		Normally, when the vertex reaches its target,
		//		the state record is discarded. If set, the optional
		//		boolean  member "persist" supresses this action.
		//
		//		The thread exits when there are no more state records.

		// process all vertex states
		var speed = this.speed;
		var graph = thread.__graph;
		var vertexStates = thread.__vertexStates;
		for (var vertexId in vertexStates){
			// get vertex from graph
			var vertex = graph.vertices[vertexId];
			if (!vertex){
				// vertex must have been deleted from graph, so reap its state 
				delete vertexStates[vertexId];
				continue;
			}

			// ignore grabbed or pinned vertices
			if (vertex.grabbed || vertex.pinned){
				// reap vertex state 
				if(!state.persist){
					delete vertexStates[vertexId];
				}
				continue;
			}

			// get the target coordinates
			var state = vertexStates[vertexId];
			var x = state.x;
			var y = state.y;

			// speed limited?
			if (speed > 0){
				// calculate distance to destination
				var dx = x - vertex.x;
				var dy = y - vertex.y;
				var d = Math.sqrt(dx * dx + dy * dy);

				// too far to reach this tick?
				if (d > speed){
					// calculate speed units in target direction
					var r = speed / d;
					x = vertex.x + dx * r;
					y = vertex.y + dy * r;
				}
			}

			// move the vertex
			vertex.move(x, y);

			// have we arrived?
			if (x == state.x && y == state.y){
				// reap vertex state 
				if(!state.persist){
					delete vertexStates[vertexId];
				}
			}
		}

		// still more work to do?
		for (var vertexId in vertexStates){
			return;
		}

		// end thread
		thread.deferred.resolve();
	}
});
