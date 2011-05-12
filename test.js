dojo.provide("sevenbridges.test");

(function(){
	sevenbridges.test.randomGraph = function(
		/*Number*/ vertices, /*Number*/ edges,
		/*Array?*/ vertexClasses, /*Array?*/ edgeClasses){
		// summary:
		//		Generate a random graph represented as a JSON object.
		//
		// vertices:
		//		Number of vertices to generate.
		//
		// edges:
		//		Number of edges to generate.
		//
		// vertexClasses:
		//		Each vertex is assigned a class chosen randomly from this array.
		//
		// edgeClasses:
		//		Each edge is assigned a class chosen randomly from this array.

		// JSON object
		var graph = {
			identifier: "id",
			label: "label",
			items : []
		};

		// generate vertices
		for (var i = 0; i < vertices; i++){
			// create a vertex
			var id = dojo.string.substitute("vertex${0}", [i]);
			var vertex = {
				id: id,
				type: "vertex",
				label: id
			};

			// randomly choose a class
			if (vertexClasses && vertexClasses.length > 0){
				vertex["class"] = vertexClasses[
					Math.floor(Math.random() * vertexClasses.length)];
			}

			graph.items.push(vertex);
		}

		// generate edges
		if (vertices > 0){
			for (var i = 0; i < edges; i++){
				// create an edge
				var id = dojo.string.substitute("edge${0}", [i]);
				var edge = {
					id: id,
					type: "edge",
					label: id,
					source: dojo.string.substitute("vertex${0}", [
						Math.floor(Math.random() * vertices)]),
					target: dojo.string.substitute("vertex${0}", [
						Math.floor(Math.random() * vertices)]),
				};

				// randomly choose a class
				if (edgeClasses && edgeClasses.length > 0){
					edge["class"] = edgeClasses[
						Math.floor(Math.random() * edgeClasses.length)];
				}

				graph.items.push(edge);
			}
		}

		return graph; // Object
	};
})();
