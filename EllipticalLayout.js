dojo.provide("sevenbridges.EllipticalLayout");

dojo.require("sevenbridges.AnimatedLayout");

dojo.declare("sevenbridges.EllipticalLayout", sevenbridges.AnimatedLayout, {
	// summary:
	//		Layout the vertices around an ellipse.

	// cx: Number
	//		X coordinate of center (default 0).
	cx: 0,

	// cy: Number
	//		Y coordinate of center (default 0).
	cy: 0,

	// xradius: Number (default 0).
	//		Radius of x axis
	xradius: 0,

	// yradius: Number (default 0).
	//		Radius of x axis
	yradius: 0,

	onStart: function(/*sevenbridges.Thread*/ thread){
		// summary:
		//		Generate vertex locations along ellipse.

		this.inherited(arguments);

		// get radii and vertex count
		var graph = thread.__graph
		var xradius = this.xradius;
		var yradius = this.yradius;
		if (xradius == 0 && yradius == 0){
			xradius = graph.domNode.parentNode.clientWidth / 3;
			yradius = graph.domNode.parentNode.clientHeight / 3;
		}

		// count the vertices
		var vertexCount = 0;
		for (var vertexId in graph.vertices){
			// ignore grabbed and pinned vertices
			var vertex = graph.vertices[vertexId];
			if (vertex.grabbed || vertex.pinned){
				continue;
			}
			vertexCount++;
		}

		if (vertexCount > 0){
			// lay vertices along ellipse perimeter
			var theta = 0;
			var step = (2 * Math.PI) / vertexCount;
			var vertexStates = thread.__vertexStates;
			for (var vertexId in graph.vertices){
				// ignore grabbed and pinned vertices
				var vertex = graph.vertices[vertexId];
				if (vertex.grabbed || vertex.pinned){
					continue;
				}

				// place vertex at next position along ellipse
				vertexStates[vertexId] = {
					x: xradius * Math.cos(theta),
					y: yradius * Math.sin(theta)
				}
				theta += step;
			}
		}
	}
});
