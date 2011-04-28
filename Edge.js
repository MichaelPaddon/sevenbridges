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
    //      DOM XML template
    templateString: "<g xmlns='http://www.w3.org/2000/svg'><line class='sevenbridges_edge_line' x1='0' y1='0' x2='0' y2='0'/><polygon class='sevenbridges_edge_arrow' points='0,-3 -3,3 3,3'/></g>",

	// _tooltip: dijit.Tooltip
	//		Edge tooltip
	_tooltip: null,

	// _subscriptions: Array
	//		Subscriptions to connected vertices.
	_subscriptions: null,

	postCreate: function(){
        // summary:
        //		Perform post creation initialization.

        this.inherited(arguments);
		this._subscriptions = {};

		// XXX
		this._lineNodes = dojo.query("[class=sevenbridges_edge_line]",
			this.domNode);
		this._arrowNodes = dojo.query("[class=sevenbridges_edge_arrow]",
			this.domNode);

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
		//		Refresh the edge's rendering.

		var source = this.getSource();
		var target = this.getTarget();
		if (source && target){
			dojo.forEach(this._lineNodes, dojo.hitch(this, function(lineNode){
				lineNode.setAttributeNS(null, "x1", source.x);
				lineNode.setAttributeNS(null, "y1", source.y);
				lineNode.setAttributeNS(null, "x2", target.x);
				lineNode.setAttributeNS(null, "y2", target.y);
			}));

			var angle = 0;
			var dx = target.x - source.x;
			var dy = target.y - source.y;
			var d = Math.sqrt(dx * dx + dy * dy);
			if (d > 0){
			    angle = Math.asin(dy / d) * 180 / Math.PI + 90;
			}
			var transform = dojo.string.substitute(
				"translate(${0},${1}) rotate(${2})", [
					source.x + (target.x - source.x) / 2,
					source.y + (target.y - source.y) / 2,
					dx > 0 ? angle : -angle
				]);
			dojo.forEach(this._arrowNodes, dojo.hitch(this, function(arrowNode){
				arrowNode.setAttributeNS(null, "transform", transform);
			}));
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
				// unsubscribe from old vertex channel
				if (oldValue){
					this.unsubscribe(this._subscriptions[oldValue]);
					delete this._subscriptions[oldValue];
				}

				// subscribe to new vertex channel
				if (newValue){
					var channel = dojo.string.substitute("${0}/${1}",
						[this.graph.id, newValue]);
					this._subscriptions[newValue] = this.subscribe(channel,
						dojo.hitch(this, this.refresh));
				}

				this.refresh();
				break;
		}
	}
});
