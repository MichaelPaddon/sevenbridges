dojo.provide("sevenbridges.Edge");
dojo.require("dijit.Tooltip");
dojo.require("sevenbridges._SVGWidget");

dojo.declare("sevenbridges.Edge", sevenbridges._SVGWidget, {
    // summary:
    //      An Edge is an SVG widget which provides a visualization
    //      of an item in a data store.

    // graph: [const] sevenbridges.Graph
	//		The enclosing graph.
    graph: null,

    // store: [const] dojo.data
    //      The underlying data store.
    store: null,

    // item: [const] opaque
    //      The underlying item in the data store.
    item: null,

	// identity: [const] String
	//		The item identity.
	identity: null,

	// templateString: [const] String
    //      DOM XML template.
    templateString: dojo.cache("sevenbridges", "templates/Edge.svg"),

	// _tooltip: dijit.Tooltip
	//		Edge tooltip.
	_tooltip: null,

	// _congruent: Object
	//		_congruent.edges is a list of edges with the same endpoints.
	//		_congruent.index is the index of this edge in _congruent.edges.
	_congruent: null,

	// _subscriptions: Object
	//		Subscription handles.
	_subscriptions: null,

	postCreate: function(){
        // summary:
        //		Perform post creation initialization.

        this.inherited(arguments);
		this._congruent = {edges: [this], index: 0};
		this._subscriptions = {};
		this._edge = dojo.query("path.sevenbridgesEdge", this.domNode)[0];

		// need an arrow?
		if (this.graph.directed){
			// create arrow
			this._arrow = dojo.doc.createElementNS(this.SVGNS, "polygon");
			this._arrow.setAttributeNS(null, "class", "arrow");
			this._arrow.setAttributeNS(null, "points", "3,0 -3,3 -3,-3");
			dojo.place(this._arrow, this.domNode);
		}

		// process all item attributes
        dojo.forEach(this.store.getAttributes(this.item), function(attribute){
			var values = this.store.getValues(this.item, attribute)
			this._onSet(attribute, undefined,
				values.length < 2 ? values[0] : values);
		}, this);
	},

	getSource: function(){
		// summary:
		//		Returns the source vertex, or undefined.

		var sourceId = this.store.getValue(
			this.item, this.graph.edgeSourceAttribute);
		return this.graph.vertices[sourceId]; // sevenbridges.Vertex
	},

	getTarget: function(){
		// summary:
		//		Returns the target vertex, or undefined.

		var targetId = this.store.getValue(
			this.item, this.graph.edgeTargetAttribute);
		return this.graph.vertices[targetId]; // sevenbridges.Vertex
	},

	refresh: function(){
		// summary:
		//		Render the edge.

		// get source and target vertices
		var source = this.getSource();
		var target = this.getTarget();
		if (source && target){
			// using source vertex as our origin, calculate distance of target
			var dx = target.rawX - source.rawX;
			var dy = target.rawY - source.rawY;
			var d = Math.sqrt(dx * dx + dy * dy);

			// non-degenerate edge?
			if (d > 0){
				// only one edge between source and target?
				var path;
				if (this._congruent.edges.length < 2){
					// edge is a straight line between vertices
					path = dojo.string.substitute("M ${0} ${1} L ${2} ${3}",
						[source.rawX, source.rawY, target.rawX, target.rawY]);
				}
				else {
					// calculate angle of target
					var theta = dx > 0
						? Math.asin(dy / d) : Math.PI - Math.asin(dy / d);

					// edge is a quadratic bezier curve, with a control
					// point "a" units perpendicular to the midpoint
					// of the source-target line;
					// calculate distance and angle of control point from source
					var a = Math.floor((this._congruent.index + 2) / 2)
						* (this._congruent.index % 2 ? 10 : -10);
					var b = d / 2;
					var h = Math.sqrt(a * a + b * b);
					var iota = theta + Math.asin(a / h);

					// calculate control point coordinates
					var cx = Math.cos(iota) * h;
					var cy = Math.sin(iota) * h;

					// quadratic bezier curve
					path = dojo.string.substitute(
						"M ${0} ${1} q ${2} ${3} ${4} ${5}",
						[source.rawX, source.rawY, cx, cy, dx, dy]);
				}

				// draw path
				this._edge.setAttributeNS(null, "d", path);

				// do we have an arrow?
				if (this._arrow){
					// find edge midpoint
					var length = this._edge.getTotalLength();
					var midpoint = this._edge.getPointAtLength(length/2);

					// move arrow to midpoint of edge and point towards target
					var theta = dx > 0
						? Math.asin(dy / d) : Math.PI - Math.asin(dy / d);
					var transform = dojo.string.substitute(
						"translate(${0},${1}) rotate(${2})",
						[midpoint.x, midpoint.y, theta * 180 / Math.PI]);
					this._arrow.setAttributeNS(null, "transform", transform);
				}
			}
			else {
				// no edge to render
				this._edge.setAttributeNS(null, "d", "M 0 0");
			}
		}
		else {
			// no edge to render
			this._edge.setAttributeNS(null, "d", "M 0 0");
		}
	},

    _onSet: function(/*String*/ attribute,
		/*Object*/ oldValue, /*Object*/ newValue){
		// summary:
		//		Handle a changed item attribute.

		switch(attribute){
			case this.graph.classAttribute:
				// update DOM node class
				if (oldValue){
					this.removeClass(oldValue);
				}
				if (newValue){
					this.addClass(newValue);
				}

				// apply style generator (if any) to edge
				if (this.graph.generateEdgeStyle){
					dojo.style(this.domNode,
						this.graph.generateEdgeStyle(newValue))
				}
				break;

			case this.graph.labelAttribute:
				// new label defined?
				if (newValue){
					if (this._tooltip){
						// update tooltip
						this._tooltip.attr("label", newValue);
					}
					else {
						// create tooltip
						this._tooltip = new dijit.Tooltip({
							connectId: [this.domNode],
							label: newValue
						});
					}
				}
				else if (this._tooltip){
					// destroy tooltip
					this._tooltip.destroyRecursive();
					this._tooltip = null;
				}
				break;

			case this.graph.edgeSourceAttribute:
			case this.graph.edgeTargetAttribute:
				if (oldValue){
					// unsubscribe from old vertex
					var topic = dojo.string.substitute("${0}/${1}",
						[this.graph.id, oldValue]);
					this.unsubscribe(this._subscriptions[topic]);
					delete this._subscriptions[topic];
				}

				if (newValue){
					// subscribe to new vertex
					var topic = dojo.string.substitute("${0}/${1}",
						[this.graph.id, newValue]);
					this._subscriptions[topic] = this.subscribe(topic,
						dojo.hitch(this, this.refresh));
				}

				// subscribe to congruent edges
				var sourceId = this.store.getValue(
					this.item, this.graph.edgeSourceAttribute);
				var targetId = this.store.getValue(
					this.item, this.graph.edgeTargetAttribute);
				var topic = dojo.string.substitute("${0}/${1}_${2}",
					[this.graph.id].concat([sourceId, targetId].sort()));
				if (this._subscriptions.congruent){
					this.unsubscribe(this._subscriptions.congruent);
				}
				this._subscriptions.congruent = this.subscribe(topic,
					dojo.hitch(this, function(edges){
						// add ourselves to congruent edge list
						edges.push(this);

						// update our congruency record
						this._congruent = {
							edges: edges,
							index: edges.length - 1
						};
					}));

				// recalculate congruent edges
				dojo.publish(topic, [[]]);

				// force edge refresh
				this.refresh();
				break;
		}
	}
});
