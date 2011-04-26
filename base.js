dojo.provide("sevenbridges.base");

(function(){
	sevenbridges.str2tokens = function(/*String|Array*/strOrArray,
		/*String|Regex?*/delim){
		// summary:
		//		Split a string into an array of tokens.
		//
		// strOrArray:
		//		The string to split, or an array.
		//		If an array is supplied, it is returned unchanged.
		//
		// delim:
		//		A string or regular expression iused to delimit tokens.
	
		if(dojo.isString(strOrArray)){
			// zero length string?
			if (!strOrArray){
				return []; // Array
			}

			// default delimiter is whitespace
			if (delim == undefined){
				delim = /\s+/;
			}

			// split string into tokens
			return dojo.filter(strOrArray.split(delim), // Array
				function(x){return x});
		}
		// assume already tokenized array
		return strOrArray; // Array
	};

	sevenbridges.hasClass = function(/*DomNode|String*/node,
		/*String*/className){
		// summary:
		//		Does the node have the specified class?
		//		Handles non-HTML nodes gracefully.
		//
		// node:
		//		The node id or reference.
		//
		// className:
		//		The name of the class.

		node = dojo.byId(node);

		// get the classes currently applied to the node
		var nodeClasses = sevenbridges.str2tokens(
			node.getAttributeNS(null, "class"));

		// is the specified class applied to the node?
		return dojo.indexOf(sevenbridges.str2tokens(nodeClasses), // Boolean
			className) >= 0;
	};

	sevenbridges.addClass = function(/*DomNode|String*/node,
		/*String|Array*/classes){
		// summary:
		// 		Adds the classes to the end of the class list on the node,
		// 		avoiding duplication. Handles non-HTML nodes gracefully.
		//
		// node:
		//		A node id or reference.
		//
		// classes:
		//		A whitespace delimited string of class names or an array of
		//		class names.

		node = dojo.byId(node);
		var classes = sevenbridges.str2tokens(classes);

		// get the classes currently applied to the node
		var nodeClasses = sevenbridges.str2tokens(
			node.getAttributeNS(null, "class"));

		// process each specified class
		dojo.forEach(classes, function(className){
			// is the class not yet applied to the node?
			if (dojo.indexOf(nodeClasses, className) < 0){
				// append the class
				nodeClasses.push(className);
			}
		});

		// apply updated class list to node
		node.setAttributeNS(null, "class", nodeClasses.join(" "));
	};

	sevenbridges.removeClass = function(/*DomNode|String*/node,
		/*String|Array*/classes){
		// summary:
		// 		Removes the classes from the class list on the node,
		// 		if they exist. Handles non-HTML nodes gracefully.
		//
		// node:
		//		A node id or reference.
		//
		// classes:
		//		A whitespace delimited string of class names or an array of
		//		class names.

		node = dojo.byId(node);
		var classes = sevenbridges.str2tokens(classes);

		// get the classes currently applied to the node
		var nodeClasses = sevenbridges.str2tokens(
			node.getAttributeNS(null, "class"));

		// process each specified class
		dojo.forEach(classes, function(className){
			// is the class applied to the node?
			var index = dojo.indexOf(nodeClasses, className);
			if (index >= 0){
				// remove the class
				nodeClasses[index] = null;
			}
		});

		// filter out null (removed) entries
		nodeClasses = dojo.filter(nodeClasses, function(x){return x});

		// apply updated class list to node
		node.setAttributeNS(null, "class", nodeClasses.join(" "));
	};

	sevenbridges.toggleClass = function(/*DomNode|String*/node,
		/*String|Array*/classes){
		// summary:
		// 		Toggles the classes on the node, adding them if they
		//		don't exist or removing them if they do.
		// 		Handles non-HTML nodes gracefully.
		//
		// node:
		//		A node id or reference.
		//
		// classes:
		//		A whitespace delimited string of class names or an array of
		//		class names.

		node = dojo.byId(node);
		var classes = sevenbridges.str2tokens(classes);

		// get the classes currently applied to the node
		var nodeClasses = sevenbridges.str2tokens(
			node.getAttributeNS(null, "class"));

		// process each specified class
		dojo.forEach(classes, function(className){
			// is the class already applied to the node?
			var index = dojo.indexOf(nodeClasses, className);
			if (index >= 0){
				// remove the class
				nodeClasses[index] = null;
			}
			else {
				// append the class
				nodeClasses.push(className);
			}
		});

		// filter out null (removed) entries
		nodeClasses = dojo.filter(nodeClasses, function(x){return x});

		// apply updated class list to node
		node.setAttributeNS(null, "class", nodeClasses.join(" "));
	};

	sevenbridges.getBBox = function(/*SVGLocatable*/node, 
		/*SVGElement?*/referenceNode){
		// summary:
		//		Get the bounding box of a SVG node transformed to
		//		the coordinates of a reference node.
		//
		// node:
		//		The target SVG node.
		//
		// referenceNode:
		//		The reference SVG node whose coordinate system will be used.
		//		If not defined, then the bbox is returned in the
		//		coordinate system of the target node.

		// get the bbox
		var bbox = node.getBBox();

		// need to transform?
		if (referenceNode){
			// get transform matrix
			var matrix = node.getTransformToElement(referenceNode);

			// p is one corner of the transformed bbox
			var svgNode = node.ownerSVGElement;
			var p = svgNode.createSVGPoint();
			p.x = bbox.x;
			p.y = bbox.y;
			p = p.matrixTransform(matrix);

			// q is the other corner of the transformed bbox
			var q = svgNode.createSVGPoint();
			q.x = bbox.x + bbox.width;
			q.y = bbox.y + bbox.width;
			q = q.matrixTransform(matrix);

			// build new bbox
			bbox = svgNode.createSVGRect();
			bbox.x = Math.min(p.x, q.x);
			bbox.y = Math.min(p.y, q.y);
			bbox.width = Math.max(p.x, q.x) - bbox.x;
			bbox.height = Math.max(p.y, q.y) - bbox.y;
		}

		return bbox; // SVGRect
	};
})();
