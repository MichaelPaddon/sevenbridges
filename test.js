dojo.provide("sevenbridges.test");

(function(){
	sevenbridges.test.randomNumbers = function(
		/*Number*/ count, /*Number*/ min, /*Number*/ max){
		// summary:
		//		Generate an array of random numbers.
		//
		// count:
		//		Count of random numbers required.
		//
		// min:
		//		Lower bound of random numbers.
		//
		// max:
		//		Upper bound of random numbers.

		var numbers = [];
		var range = Math.max(max - min, 0);
		for (var i = 0; i < count; i++){
			numbers.push(min + range * Math.random());
		}

		return numbers; // Array
	};

	sevenbridges.test.randomGraph = function(
		/*Number*/ vertices, /*Number*/ edges,
		/*Array?*/ vertexWeights, /*Array?*/ edgeWeights,
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
		// vertexWeights:
		//		Each vertex is assigned a weight randomly from this array.
		//
		// edgeWeights:
		//		Each edge is assigned a weight randomly from this array.
		//
		// vertexClasses:
		//		Each vertex is assigned a class randomly from this array.
		//
		// edgeClasses:
		//		Each edge is assigned a class randomly from this array.

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

			// randomly choose a weight
			if (vertexWeights && vertexWeights.length > 0){
				vertex.weight = vertexWeights[
					Math.floor(Math.random() * vertexWeights.length)];
			}

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

				// randomly choose a weight
				if (edgeWeights && edgeWeights.length > 0){
					edge.weight = edgeWeights[
						Math.floor(Math.random() * edgeWeights.length)];
				}

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
