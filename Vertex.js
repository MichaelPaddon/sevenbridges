dojo.provide("sevenbridges.Vertex");

dojo.require("dijit.ColorPalette");
dojo.require("dijit.Menu");
dojo.require("dijit.MenuItem");
dojo.require("dijit.Tooltip");
//dojo.require("dojox.widget.ColorPicker");
dojo.require("sevenbridges._SVGWidget");

dojo.declare("sevenbridges.Vertex", sevenbridges._SVGWidget, {
	// summary:
	// 		A Vertex is an SVG widget which provides a visualization
	//		of an item in a data store.

	// graph: [const] sevenbridges.Graph
	//		The enclosing graph.
	graph: null,

	// store: [const] dojo.data
	//		The underlying data store.
	store: null,

	// item: [const] opaque
	//		The underlying item in the data store.
	item: null,

	// identity: [const] string
	//		The item identity.
	identity: null,

	// templateString: [const] String
	//		DOM XML template
	templateString: '<g xmlns="http://www.w3.org/2000/svg"><circle class="vertex" cx="0" cy="0" r="5"/><circle class="pin" cx="0" cy="0" r="1"/></g>',

	// classes: [readonly] Array
	//		Array of vertex class names.
	classes: null,

	// edges: [readonly] Object
	//		Incident edges, indexed by edge id.
	edges: null,

	// x: [readonly] Number
	//		X coordinate of vertex.
	x: 0,

	// y: [readonly] Number
	//		Y coordinate of vertex.
	y: 0,

	// scale: [readonly] Number
	//		Scale factor of vertex.
	scale: 1,

	// grabbed: [readonly] Boolean
	//		The vertex has been grabbed by the user.
	grabbed: false,

	// pinned: [readonly] Boolean
	//		The vertex is pinned down.
	pinned: false,

	// label: [readonly] String
	//		Vertex label.
	label: "",

	// _tooltip: /*dijit.Tooltip*/
	//		Vertex tooltip.
	_tooltip: null,

	// _menu: [readonly] dijit.Menu
	//		Menu shared between all vertices.
	_menu: function(){
		var menu = new dijit.Menu();

		// menu context
		var vertex = null;
		dojo.connect(menu, "_openMyself", null, function(openEvent){
			vertex = dijit.getEnclosingWidget(openEvent.target);
			if (!(vertex.identity in vertex.graph.selection)){
				vertex.graph.setSelection([]);
			}
		});

		menu.addChild(new dijit.MenuItem({
			label: "Pin",
			onClick: function(mouseEvent){
				if (vertex){
					vertex.pin();
					for (var vertexId in vertex.graph.selection){
						vertex.graph.selection[vertexId].pin();
					}
				}
			}
		}));

		menu.addChild(new dijit.MenuItem({
			label: "Unpin",
			onClick: function(mouseEvent){
				if (vertex){
					vertex.unpin();
					for (var vertexId in vertex.graph.selection){
						vertex.graph.selection[vertexId].unpin();
					}
				}
			}
		}));

/*
		var colorPicker = new dojox.widget.ColorPicker({
			onChange: function(color){
				if (vertex){
					vertex.setColor(color);
					for (var vertexId in vertex.graph.selection){
						vertex.graph.selection[vertexId].setColor(color);
					}
				}
			}
		});
		menu.addChild(new dijit.PopupMenuItem({
			label: "Color >",
			popup: new dijit.layout.ContentPane({
				content: colorPicker
			})
		}));
*/

		return menu;
	}(),

    postCreate: function(){
		this.inherited(arguments);

		this.classes = [];
		this.edges = {};

		this._circleNode = dojo.query("circle", this.domNode)[0];

		this.channel = dojo.string.substitute("${0}/${1}",
			[this.graph.id, this.identity]);

        // process all item attributes
		dojo.forEach(this.store.getAttributes(this.item), function(attribute){
			var values = this.store.getValues(this.item, attribute)
			this._onSet(attribute, undefined,
				values.length < 2 ? values[0] : values);
		}, this);

		this.connect(this, "onMouseOver", this._onMouseOver);
		this.connect(this, "onMouseOut", this._onMouseOut);
		this.connect(this, "onMouseDown", this._onMouseDown);
		this.connect(this, "onDblClick", this._onDblClick);
		this._menu.bindDomNode(this.domNode);
	},

    pin: function(){
		this.pinned = true;
		this.addClass("_pinned");
	},

	unpin: function(){
		this.pinned = false;
		this.removeClass("_pinned");
	},

	setColor: function(color){
		// .style() doesn't work with Mozilla
		/*
		dojo.query("[class=vertex]", this.domNode).forEach(
			function(node){
				node.setAttributeNS(null, "style", "fill:" + color);
			});
		*/
	},

	move: function(x, y){
		this.store.setValues(this.item,
			this.graph.vertexPositionAttribute, [x, y])
	},

	refresh: function(){
		var weight = 1;
		if (this.store.hasAttribute(this.item,
			this.graph.vertexWeightAttribute)){
			weight += this.store.getValue(this.item,
				this.graph.vertexWeightAttribute);
		}

		// move the vertex to it's nominal coordinates
		this.domNode.setAttributeNS(null, "transform",
			dojo.string.substitute("translate(${0},${1}) scale(${2})", [
				this.x, this.y, weight * this.scale
			]));

		// update our edges
		for (var edgeId in this.edges){
			this.edges[edgeId].refresh();
		}
	},

	apply: function(){
		// Mozilla hack: do nothing
		console.log(arguments);
	},

    _onSet: function(/*String*/ attribute,
		/*Object*/ oldValue, /*Object*/ newValue){
		// summary:
		//		Handle a changed item attribute.

		switch(attribute){
			case this.graph.classAttribute:
				// update classes applied to node
				if (oldValue){
					this.removeClass(oldValue);
				}
				if (newValue){
					this.addClass(newValue);
				}

/*
				this.classes = sevenbridges.str2tokens(newValue);
				dojo.forEach(this.classes, dojo.hitch(this, function(className){
					this.graph.styleVertices(className);
				}));
*/
				this._refreshTooltip();
				break;

			case this.graph.labelAttribute:
				this.label = newValue;
				this._refreshTooltip();
				break;

			case this.graph.vertexPositionAttribute:
				this.x = newValue[0];
				this.y = newValue[1];
				this.refresh();
				dojo.publish(this.channel, [this]);
				break;
		}
	},

	_refreshTooltip: function(){
		var lines = [];
		if (this.label){
			lines.push(this.label);
		}
/*
		if (this.classes.length > 0){
			lines.push("<span class=\"classes\">"
				+ this.classes.join(" ") + "</span>");
		}
*/

		var thumbnail = this.store.getValue(this.item,
			this.graph.vertexThumbnailAttribute);
		if (thumbnail){
			lines.push(dojo.string.substitute("<img src=\"${0}\">", [
				thumbnail
			]));
		}

		var label = lines.join("<br>");
		if (label){
			if (this._tooltip){
				this._tooltip.set("label", label);
			}
			else {
				this._tooltip = new dijit.Tooltip({
					connectId: [this.domNode],
					label: label
				});
			}
		}
		else if (this._tooltip){
			this._tooltip.destroyRecursive();
			this._tooltip = null;
		}
	},

	_onMouseOver: function(/*MouseEvent*/overEvent){
		this.scale = 2;
		this.refresh();

		// move vertex on top of siblings
		dojo.place(this.domNode, this.domNode.parentNode);

		dojo.stopEvent(overEvent);
	},

	_onMouseOut: function(/*MouseEvent*/outEvent){
		this.scale = 1;
		this.refresh();
		dojo.stopEvent(outEvent);
	},

	_onMouseDown: function(/*MouseEvent*/downEvent){
		// summary:
		//		Handle mouse down event.

		var graph = this.graph;
		switch (downEvent.button){
			case 0:
				// selection action
				var doSelect = dojo.hitch(this, function(){
					if (downEvent.shiftKey){
						// add to selection
						graph.addSelection([this]);
					}
					else if (downEvent.ctrlKey){
						// toggle selection
						graph.toggleSelection([this]);
					}
					else {
						// new selection
						graph.setSelection([this]);
					}
				});

				// vertex already selected?
				mouseUpAction = null;
				if (this.identity in graph.selection){
					mouseUpAction = doSelect;
				}
				else {
					doSelect();
				}

				// create a state record for each vertex being dragged
				var dragStates = {};
				for (vertexId in graph.selection){
					var vertex = graph.selection[vertexId];
					vertex.grabbed = true;
					dragStates[vertexId] = {vertex: vertex,
						x: vertex.x, y: vertex.y};
				}

				// install handler for mouse movement events
				var dragging = false;
				var docNode = this.domNode.ownerDocument.documentElement;
				var moveHandle = this.connect(docNode, "onmousemove",
					function(moveEvent){
						var dx = moveEvent.screenX - downEvent.screenX;
						var dy = moveEvent.screenY - downEvent.screenY;

						if (!dragging
							&& (Math.abs(dx) > 3 || Math.abs(dy) > 3)){
							dragging = true;
							mouseUpAction = null;
						}

						if (dragging){
							for (vertexId in dragStates){
								// move vertex relative to the mouse
								// XXX: need to account for zoom
								var state = dragStates[vertexId];
								var x = state.x + dx;
								var y = state.y + dy;
								state.vertex.move(x, y);
							}
						}
				});

				// install handler for mouse up events
				var upHandle = this.connect(docNode, "onmouseup",
					function(upEvent){
						// mouse button released?
						if (upEvent.button == downEvent.button){
							// ungrab vertices
							for (vertexId in dragStates){
								var state = dragStates[vertexId];
								state.vertex.grabbed = false;
							}

							// perform mouse up action
							if (mouseUpAction){
								mouseUpAction();
							}

							// clean up
							this.disconnect(moveHandle);
							this.disconnect(upHandle);
						}
					});

				dojo.stopEvent(downEvent);
				break;

			case 3:
				dojo.stopEvent(downEvent);
				break;

			default:
				dojo.stopEvent(downEvent);
				break;
		}

/*
		// not grabbed?
		if (!this.graph.grab){
			// what button was pressed?
			if (downEvent.button == 0){
				// establish grab
				this.graph.grab = this;

				// take the focus, too
				this._focus();

				// where is the vertex's starting point?
				var origin = {x: this.x, y: this.y};

				// install handler for mouse movement events
				var moveHandle = dojo.connect(dojo.doc.documentElement,
					"onmousemove", this, function(moveEvent){
						// move the vertex relative to the mouse
						this.x = origin.x
							+ moveEvent.screenX - downEvent.screenX;
						this.y = origin.y
							+ moveEvent.screenY - downEvent.screenY;
						this._update();

						// XXX
						this.graph.startLayout();
					});

				// install handler for mouse up events
				var upHandle = dojo.connect(dojo.doc.documentElement,
					"onmouseup", this, function(upEvent){
						// mouse button released?
						if (upEvent.button == downEvent.button){
							// clean up
							dojo.disconnect(moveHandle);
							dojo.disconnect(upHandle);

							// release the grab
							this.graph.grab = null;
						}
					});

				// consume event
				dojo.stopEvent(downEvent);
			}
		}
*/

		return true;
	},

	_onDblClick: function(/*MouseEvent*/ clickEvent){
		// open the related URI
		var uri = this.store.getValue(this.item,
			this.graph.vertexLinkAttribute);
		if (uri){
			// XXX more portable way to find window?
			window.open(uri);	
		}
	}
});
