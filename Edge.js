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

	classes: null,
	source: null,
	target: null,
	directed: false,
	_tooltip: null,
	_subscriptions: null,

	postCreate: function(){
        // summary:
        //		Perform post creation initialization.

        this.inherited(arguments);

		this.classes = [];
		this._subscriptions = {};

		//
		this._lineNodes = dojo.query("[class=sevenbridges_edge_line]",
			this.domNode);
		this._arrowNodes = dojo.query("[class=sevenbridges_edge_arrow]",
			this.domNode);

		// process all item attributes
        dojo.forEach(this.store.getAttributes(this.item), function(attribute){
			var values = this.store.getValues(this.item, attribute)
			this._onChange(attribute, undefined,
				values.length < 2 ? values[0] : values);
		}, this);
	},

	refresh: function(){
		// summary:
		//		Refresh the edge's rendering.

		var source = this.source;
		var target = this.target;
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

    _onChange: function(/*String*/ attribute,
		/*Object*/ oldValue, /*Object*/ newValue){
		// summary:
		//		Handle a changed item attribute.

		switch(attribute){
			case this.graph.classAttribute:
            case "classes": //XXX: deprecated
				// update classes applied to node
				if (oldValue){
					this.removeClass(oldValue);
				}
				if (newValue){
					this.addClass(newValue);
				}

				this.classes = sevenbridges.str2tokens(newValue);
				dojo.forEach(this.classes, dojo.hitch(this, function(className){
					this.graph.styleEdges(className);
				}));
				break;

			case this.graph.labelAttribute:
				if (this._tooltip){
					this._tooltip.destroyRecursive();
					this._tooltip = null;
				}
				if (newValue){
					this._tooltip = new dijit.Tooltip({
						connectId: [this.domNode],
						label: newValue
					});
				}
				break;

			case this.graph.edgeSourceAttribute:
				if (this.source){
					delete this.source.edges[this.id];
					this.unsubscribe(this._subscriptions.newSource);
					this.unsubscribe(this._subscriptions.deleteSource);
				}
				this.source = this.graph.vertices[newValue];
				if (this.source){
					this.source.edges[this.id] = this;
				}

				// watch for vertex creation and destruction
				this._subscriptions.newSource = this.subscribe(
					this.graph.getTopic("new/" + newValue),
					dojo.hitch(this, function(){
						this.source = this.graph.vertices[newValue];
						this.source.edges[this.id] = this;
					}));
				this._subscriptions.deleteSource = this.subscribe(
					this.graph.getTopic("delete/" + newValue),
					dojo.hitch(this, function(){
						if (this.source){
							delete this.source.edges[this.id];
						}
						this.source = null;
					}));
				break;

			case this.graph.edgeTargetAttribute:
				if (this.target){
					delete this.target.edges[this.id];
					this.unsubscribe(this._subscriptions.newTarget);
					this.unsubscribe(this._subscriptions.deleteTarget);
				}
				this.target = this.graph.vertices[newValue];
				if (this.target){
					this.target.edges[this.id] = this;
				}

				// watch for vertex creation and destruction
				this._subscriptions.newTarget = this.subscribe(
					this.graph.getTopic("new/" + newValue),
					dojo.hitch(this, function(){
						this.target = this.graph.vertices[newValue];
						this.target.edges[this.id] = this;
					}));
				this._subscriptions.deleteTarget = this.subscribe(
					this.graph.getTopic("delete/" + newValue),
					dojo.hitch(this, function(){
						if (this.target){
							delete this.target.edges[this.id];
						}
						this.target = null;
					}));
				break;

			case this.directedAttribute:
				this.directed = Boolean(newValue);
				break;
		}
	}
});
