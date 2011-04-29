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
    //templateString: "<g xmlns='http://www.w3.org/2000/svg'><line class='sevenbridges_edge_line' x1='0' y1='0' x2='0' y2='0'/><polygon class='sevenbridges_edge_arrow' points='0,-3 -3,3 3,3'/></g>",
    templateString: '<path xmlns="http://www.w3.org/2000/svg" class="edge"/>',

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

		var source = this.getSource();
		var target = this.getTarget();
		var path = "M 0 0";
		if (source && target){
			if (this._congruent.edges.length < 2){
				// a straight line between vertices
				path = dojo.string.substitute("M ${0} ${1} L ${2} ${3}",
					[source.x, source.y, target.x, target.y]);
			}
			else {
				// use source vertex as our origin...
				// calculate distance to target
				var tx = target.x - source.x;
				var ty = target.y - source.y;
				var td = Math.sqrt(tx * tx + ty * ty);
				if (td > 0){
					// calculate elevation of target
					var theta = Math.asin(ty / td);
					if (tx < 0){
						theta = Math.PI - theta;
					}

					// control point is a units perpendicular to the midpoint
					// of the source-target line.
					var ca = Math.floor((this._congruent.index + 2) / 2)
						* (this._congruent.index % 2 ? 50 : -50);
					var cb = td / 2;
					var cd = Math.sqrt(ca * ca + cb * cb);

					// add elevation of control point
					theta += Math.asin(ca / cd);

					// calculate control point coordinates
					var cx = Math.cos(theta) * cd;
					var cy = Math.sin(theta) * cd;

					// quadratic bezier curve
					path = dojo.string.substitute(
						"M ${0} ${1} q ${2} ${3} ${4} ${5}",
						[source.x, source.y, cx, cy, tx, ty]);
				}
			}
		}

		// redraw path
		this.domNode.setAttributeNS(null, "d", path);
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
				// remove any existing tooltip
				if (this._tooltip){
					this._tooltip.destroyRecursive();
					this._tooltip = null;
				}

				// create new tooltip if required
				if (newValue){
					this._tooltip = new dijit.Tooltip({
						connectId: [this.domNode],
						label: newValue
					});
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
