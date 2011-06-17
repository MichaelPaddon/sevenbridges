dojo.provide("sevenbridges.Graph");
dojo.require("dijit._Templated");
dojo.require("dojox.color");
dojo.require("dojox.xml.parser");
dojo.require("sevenbridges._SVGWidget");
dojo.require("sevenbridges.ColorSequence");
dojo.require("sevenbridges.Edge");
dojo.require("sevenbridges.Vertex");

dojo.declare("sevenbridges.Graph", sevenbridges._SVGWidget, {
	// summary:
	//		A Graph is a widget which provides a visualization of
	//		vertices and edges stored in a dojo.data store.

	// store: [const] dojo.data
	//		The underlying data store.
	//		The store must support read, write, identity and notification.
	store: null,

	// directed: [const] Boolean
	//		Is the graph directed?
	directed: false,

	// layout: [const] sevenbridges.Layout
	//		The graph layout manager.
	layout: null,

	// styleSheet: [const] String
	//		The title of the style sheet to which vertex and edge styles
	//		will be appended.
	styleSheet: null,

	// vertexColorSequence: [const] sevenbridges.ColorSequence
	//		A sequence of colors to assign to vertex classes
	vertexColorSequence: null,

	// edgeColorSequence: [const] sevenbridges.ColorSequence
	//		A sequence of colors to assign to edge classes
	edgeColorSequence: null,

	// typeAttribute: [const] String
	//		The item attribute which specifies vertex or edge.
	typeAttribute: "type",

	// classAttribute: [const] String
	//		The item attribute which specifies classes.
	classAttribute: "class",

	// labelAttribute: [const] String
	//		The item attribute which specifies a label.
	labelAttribute: "label",

	// vertexWeightAttribute: [const] String
	//		The item attribute which specifies a vertex weight.
	vertexWeightAttribute: "weight",

	// vertexLinkAttribute: [const] String
	//		The item attribute which specifies a vertex destination URI.
	vertexLinkAttribute: "href",

	// vertexThumbnailAttribute: [const] String
	//		The item attribute which specifies a vertex thumbnail URI.
	vertexThumbnailAttribute: "thumbnail",

	// vertexPositionAttribute: [const] String
	//		The item attribute which specifies a vertex position.
	vertexPositionAttribute: "position",

	// edgeSourceAttribute: [const] String
	//		The item attribute used to specify an edge's source vertex.
	edgeSourceAttribute: "source",

	// edgeTargetAttribute: [const] String
	//		The item attribute used to specify an edge's target vertex.
	edgeTargetAttribute: "target",

	// edgeDirectedAttribute: [const] String
	//		The item attribute used to specify if an edge is directed.
	edgeDirectedAttribute: "directed",

	// vertices: [readonly] Object
	//		A mapping of vertex ids to vertex objects.
	vertices: null,

	// edges: [readonly] Object
	//		A mapping of edge ids to edge objects.
	edges: null,

	// selection: [readonly] Object
	//		A mapping of vertex ids to selected vertices.
	selection: null,

	// panX: [readonly] Number
	//		X offset of origin
	panX: 0,

	// panY: [readonly] Number
	//		Y offset of origin
	panY: 0,

	// scale: [readonly] Number
	//		The scale factor.
	scale: 1,

	// inflation: [readonly] Number
	//		The inflation (stretching of space) factor.
	inflation: 1,

	focus: null,
	grab: null,
	templateString: dojo.cache("sevenbridges", "templates/Graph.svg"),

	_styleSheet: null,
	_vertexStyles: {},
	_edgeStyles: {},
	_grabbed: false,

	postMixInProperties: function(){
		this.inherited(arguments);
		this._fetchRequest = null;
		this._connections = {};
		this._mouseDown = null;
	},

	postCreate: function(){
		this.inherited(arguments);

		// look for specified style sheet
		var doc = this.domNode.ownerDocument;
		if (this.styleSheet){
			for (var i = 0; i < doc.styleSheets.length; i++){
				var sheet = doc.styleSheets[i];
				if (sheet.title == this.styleSheet){
					this._styleSheet = sheet;
					break;
				}
			}
		}

		// style sheet not found?
		if (this._styleSheet == null){
			// no style sheets exist?
			if (doc.styleSheets.length == 0){
				// create style element
				var style = dojo.doc.createElement("style");
				style.type = "text/css";

				// append style element to document head
				var head = dojo.query("head", doc.documentElement)[0];
				head.appendChild(style);
			}

			// use last defined stylesheet
			this._styleSheet = doc.styleSheets[doc.styleSheets.length - 1];
		}

		this.vertices = {};
		this.edges = {};
		this.selection = {};

		if (!this.vertexColorSequence){
			this.vertexColorSequence = new sevenbridges.ColorSequence({
				offset: 60,
				saturation: 80,
				luminosity: 50
			});
		}
		if (!this.edgeColorSequence){
			this.edgeColorSequence = new sevenbridges.ColorSequence({
				offset: 240,
				saturation: 80,
				luminosity: 50 
			});
		}

/*
		var svgDoc = dojox.xml.parser.parse(
			dojo.string.substitute(
				dojo.cache("sevenbridges", "templates/Graph.svg"),
				{"id": this.id}));
		this._svgRoot = dojo.doc.importNode(svgDoc.documentElement, true);
		dojo.place(this._svgRoot, this.domNode);
*/

		this._svgNodeGroup = dojo.query("#" + this.id + "_nodes")[0];
		this._svgEdgeGroup = dojo.query("#" + this.id + "_edges")[0];

		// interaction events
		dojo.connect(this.domNode, "onmousedown", this, this._onMouseDown);
		dojo.connect(this.domNode,
			dojo.isMozilla ? "DOMMouseScroll" : "onmousewheel",
			this, this._onMouseWheel);

		// reset viewport
		this.panX = this.domNode.parentNode.clientWidth / 2;
		this.panY = this.domNode.parentNode.clientHeight / 2;
		this.scale = 1;
		this.inflation = 1;
		this._updateTransform();

		// load graph
		this._load();

		this._pauseToggle = new dijit.CheckedMenuItem({
			label: "Pause Layout",
			checked: false,
			onChange: dojo.hitch(this, function(state){
				if (state){
					this.suspendLayout();
				}
				else {
					this.resumeLayout();
				}
			})
		});

		this._menu = new dijit.Menu({
			targetNodeIds: [this.domNode]
		});
		this._menu.addChild(this._pauseToggle);
	},

	setStore: function(/*dojo.data*/ store){
		// summary:
		//		Set a new data store.
		// store: dojo.data
		//		New data store.

		// set store and load graph
		this.cancelLayout();
		this.store = store;
		this._load();
	},

	setPan: function(/*Number*/ panX, /*Number*/ panY){
		// summary:
		//		Pan the viewport.

		this.panX = panX;
		this.panY = panY;
		this._updateTransform();
	},

	setScale: function(/*Number*/ scale){
		// summary:
		//		Scale the viewport.

		this.scale = scale;
		this._updateTransform();
	},

	setInflation: function(/*Number*/ inflation){
		// summary:
		//		Inflate the viewport

		this.inflation = inflation;
		for (var vertexId in this.vertices){
			this.vertices[vertexId].refresh();
		}
		for (var edgeId in this.edges){
			this.edges[edgeId].refresh();
		}
		this._updateTransform();
	},

	_updateTransform: function(){
		// summary:
		//		Update the viewport transform
		var transform = dojo.string.substitute(
			"translate(${0},${1}) scale(${2})",
			[this.panX, this.panY, this.scale]);
		var node = dojo.byId(this.id + "_panzoom");
		node.setAttributeNS(null, "transform", transform);
	},

	getBBox: function(){
		var xmin = null, xmax = null;
		var ymin = null, ymax = null;
		for (var nodeId in this.vertices){
			var node = this.vertices[nodeId];
			if (xmin == null){
				xmin = xmax = node.x;
				ymin = ymax = node.y;
			}
			else {
				xmin = Math.min(xmin, node.x);
				xmax = Math.max(xmax, node.x);
				ymin = Math.min(ymin, node.x);
				ymax = Math.max(ymax, node.x);
			}
		}
		return [xmin, ymin, xmax, ymax];
	},

	setLayout: function(/*sevenbridges.Layout*/ layout, /*Boolean*/ dontStart){
		// summary:
		//		Set a new layout.

		// cancel any running layout
		this.cancelLayout();

		this._pauseToggle.set("checked", false);

		// set new layout
		this.layout = layout;
		if (!dontStart){
			this.startLayout();
		}
	},

	startLayout: function(){
		// summary:
		//		Start the layout thread.
		//		Does nothing if a layout thread is alive.

		// do we have a layout but no layout thread?
		if (this.layout && !this._layoutThread){
			// start new thread
			this._layoutThread = new sevenbridges.Thread({
				runnable: this.layout,
				__graph: this
			}).start();

			// install reaper
			var reap = dojo.hitch(this, function(){
				this._layoutThread = null;
			});
			this._layoutThread.deferred.then(reap, reap);
		}
	},

	suspendLayout: function(){
		// summary:
		//		Suspend the layout thread.
		//		Does nothing if the layout thread is not running.

		if (this._layoutThread){
			this._layoutThread.suspend();
		}
	},

	resumeLayout: function(){
		// summary:
		//		Resume the layout thread.
		//		Does nothing if the layout thread is not suspended.

		if (this._layoutThread){
			this._layoutThread.resume();
		}
	},

	cancelLayout: function(){
		// summary:
		//		Cancel the layout thread.
		//		Does nothing if the layout thread is not alive.

        if (this._layoutThread){
			this._layoutThread.deferred.cancel();
			this._layoutThread = null;
		}
	},

	setSelection: function(/*Array*/vertices){
		// summary:
		//		Set the selected vertices.
		//
		// vertices:
		//		An array of sevenbridges.Vertex objects.

		// empty selection
		for (var vertexId in this.selection){
			this.selection[vertexId].removeClass("_selected");
			delete this.selection[vertexId];
		}

		// add vertices to selection
		this.addSelection(vertices);
	},

	addSelection: function(/*Array*/vertices){
		// summary:
		//		Add vertices to the selection.
		//
		// vertices:
		//		An array of sevenbridges.Vertex objects.

		dojo.forEach(vertices, function(vertex){
			vertex.addClass("_selected");
			this.selection[vertex.identity] = vertex;
		}, this);
	},

	removeSelection: function(/*Array*/vertices){
		// summary:
		//		Remove vertices from the selection.
		//
		// vertices:
		//		An array of sevenbridges.Vertex objects.

		dojo.forEach(vertices, function(vertex){
			vertex.removeClass("_selected");
			delete this.selection[vertex.identity];
		}, this);
	},

	toggleSelection: function(/*Array*/vertices){
		// summary:
		//		Toggle vertices in the selection.
		//		Selected vertices are unslected and vice versa.
		//
		// vertices:
		//		An array of sevenbridges.Vertex objects.

		dojo.forEach(vertices, function(vertex){
			if (vertex.identity in this.selection){
				vertex.removeClass("_selected");
				delete this.selection[vertex.identity];
			}
			else {
				vertex.addClass("_selected");
				this.selection[vertex.identity] = vertex;
			}
		}, this);
	},

	styleVertices: function(className){
		if (!(className in this._vertexStyles)){
			var fill = this.vertexColorSequence.next();
			var hsl = fill.toHsl();
			var stroke = dojox.color.fromHsl(hsl.h, hsl.s, 10);
			var rule = dojo.string.substitute(
				"#${0} g.${1} circle {fill: ${2}; stroke: ${3}}",
				[this.get("id"), className, fill, stroke]);
			this._vertexStyles[className] = this._styleSheet.insertRule(
				rule, this._styleSheet.cssRules.length);
		}
	},

	styleEdges: function(className){
		if (!(className in this._edgeStyles)){
			var color = this.edgeColorSequence.next();
			var rule = dojo.string.substitute(
				"#${0} g.${1} * {stroke: ${2}; fill: ${2}}",
				[this.get("id"), className, color]);
			this._edgeStyles[className] = this._styleSheet.insertRule(
				rule, this._styleSheet.cssRules.length);
		}
	},

	onLoadStart: function(){
		// extension point
	},

	onLoadEnd: function(/*Boolean*/succeeded){
		// extension point
	},

	_load: function(){
		// summary:
		//		Load the graph from the store.

		// abort any outstanding fetch request
		if (this._fetchRequest != null){
			this._fetchRequest.abort();
			this._fetchRequest = null;
		}

		// disconnect notification handlers
		dojo.forEach(this._storeConnections, function(handle){
			this.disconnect(handle);
		}, this);
		this._storeConnections = [];

		// initialize graph
		for (var vertexId in this.vertices){
			this.vertices[vertexId].destroyRecursive();
			delete this.vertices[vertexId];
		}
		for (var edgeId in this.edges){
			this.edges[edgeId].destroyRecursive();
			delete this.edges[vertexId];
		}

		// fetch all items from store
		if (this.store != null){
			this.onLoadStart();
			this._fetchRequest = this.store.fetch({
				scope: this,

				onItem: function(item, request){
					// call new item handler
					this._onNew(item, null);
				},

				onComplete: function(items, request){
					this._fetchRequest = null;
					this.onLoadEnd(true);

					// register for notifications on store
					this._storeConnections.push(
						this.connect(this.store, "onNew", this._onNew));
					this._storeConnections.push(
						this.connect(this.store, "onSet", this._onSet));
					this._storeConnections.push(
						this.connect(this.store, "onDelete", this._onDelete));

					this.startLayout();
				},

				onError: function(error, request){
					this._fetchRequest = null;
                    this.onLoadEnd(false);
					throw error;
				}
			});
		}
	},

	_onNew: function(/*Object*/ item, /*Object*/ parentInfo){
		// what type is the item?
		var identity = this.store.getIdentity(item);
		switch (this.store.getValue(item, this.typeAttribute)){
			case "vertex":
				// create a new vertex
				var vertex = new sevenbridges.Vertex({
					graph: this,
					store: this.store,
					item: item,
					identity: identity
				});
				this.vertices[identity] = vertex;

				// place the vertex in the graph
				dojo.place(vertex.domNode, this._svgNodeGroup);
				break;

			case "edge":
				// create new edge
				var edge = new sevenbridges.Edge({
                    graph: this,
					store: this.store,
					item: item,
					identity: identity
				});
				this.edges[identity] = edge;

				// place the edge in the graph
				dojo.place(edge.domNode, this._svgEdgeGroup);
				break;
		}
	},

	_onSet: function(/*Object*/ item, /*String*/ attribute,
		/*Object*/ oldValue, /*Object*/ newValue){
		// what type is the item?
		var identity = this.store.getIdentity(item);
		switch (this.store.getValue(item, this.typeAttribute)){
			case "vertex":
				// notify vertex
				var vertex = this.vertices[identity];
				if (vertex){
					vertex._onSet(attribute, oldValue, newValue);
				}
				break;

			case "edge":
				// notify edge
				var edge = this.edges[identity];
				if (edge){
					edge._onSet(attribute, oldValue, newValue);
				}
				break;
		}
	},

    _onDelete: function(/*Object*/ item){
		// what type is the item?
		var identity = this.store.getIdentity(item);
		switch (this.store.getValue(item, this.typeAttribute)){
			case "vertex":
				// destroy vertex
				var vertex = this.vertices[identity];
				if (vertex){
					vertex.destroyRecursive();
					delete this.vertices[identity];
				}
				break;

			case "edge":
				// destroy edge
				var edge = this.edges[identity];
				if (edge){
					edge.destroyRecursive();
					delete this.edge[identity];
				}
				break;
		}
	},

	_onMouseDown: function(/*MouseEvent*/ downEvent){
		var docNode = this.domNode.ownerDocument.documentElement;
		switch (downEvent.button){
			case 0: // left button
				// grab graph
				if (this._grabbed){
					break;
				}
				this._grabbed = true;

				var rectNode = dojo.byId(this.id + "_selector");
				var moveHandle = this.connect(docNode, "onmousemove",
					function(moveEvent){
						// calculate selection box
						var x = Math.min(downEvent.layerX,
							moveEvent.layerX);
						var y = Math.min(downEvent.layerY,
							moveEvent.layerY);
						var width = Math.abs(
							downEvent.layerX - moveEvent.layerX);
						var height = Math.abs(
							downEvent.layerY - moveEvent.layerY);

						// update selector rectangle
						rectNode.setAttributeNS(null, "x", x);
						rectNode.setAttributeNS(null, "y", y);
						rectNode.setAttributeNS(null, "width", width);
						rectNode.setAttributeNS(null, "height", height);

						dojo.stopEvent(moveEvent);
					});

				var upHandle = this.connect(docNode, "onmouseup",
					function(upEvent){
						if (upEvent.button == downEvent.button){
							// get selected region
							var region = rectNode.getBBox();

							// find selected vertices
							var selected = [];
							for (var vertexId in this.vertices){
								// we don't use checkEnclosed() because
								// of the way it interacts with
								// pointer-events

								// vertex bounding box enclosed?
								var vertex = this.vertices[vertexId];
								var bbox = sevenbridges.getBBox(
									vertex.domNode, this.domNode);
								if (bbox.x >= region.x
									&& bbox.y >= region.y
									&& bbox.x + bbox.width
										<= region.x + region.width
									&& bbox.y + bbox.height
										<= region.y + region.height){
									// add to our selected vertex list
									selected.push(vertex);
								}
							}

							// perform selection action
							if (downEvent.shiftKey){
								this.addSelection(selected);
							}
							else if (downEvent.ctrlKey){
								this.toggleSelection(selected);
							}
							else {
								this.setSelection(selected);
							}

							// clean up
							rectNode.setAttributeNS(null, "width", 0);
							rectNode.setAttributeNS(null, "height", 0);
							this.disconnect(moveHandle);
							this.disconnect(upHandle);
							this._grabbed = false;

							dojo.stopEvent(upEvent);
						}
					});
				break;

			case 1: // middle button
				if (downEvent.ctrlKey){
					// grab graph
					if (this._grabbed){
						break;
					}
					this._grabbed = true;

					var scale = this.scale;
					var moveHandle = this.connect(docNode, "onmousemove",
						function(moveEvent){
							var dy = moveEvent.layerY - downEvent.layerY;
							if (dy > 0){
								this.zoom(scale * (1 + dy / 100));
							}
							else if (dy < 0){
								this.zoom(scale / (1 - dy / 100));
							}
							dojo.stopEvent(moveEvent);
						});

					var upHandle = this.connect(docNode, "onmouseup",
						function(upEvent){
							if (upEvent.button == downEvent.button){
								this.disconnect(moveHandle);
								this.disconnect(upHandle);
								this._grabbed = false;
								dojo.stopEvent(upEvent);
							}
						});
				}
				else {
					// grab graph
					if (this._grabbed){
						break;
					}
					this._grabbed = true;

					var panX = this.panX;
					var panY = this.panY;
					var moveHandle = this.connect(docNode, "onmousemove",
						function(moveEvent){
							var dx = moveEvent.layerX - downEvent.layerX;
							var dy = moveEvent.layerY - downEvent.layerY;
							this.setPan(panX + dx, panY + dy);
							dojo.stopEvent(moveEvent);
						});

					var upHandle = this.connect(docNode, "onmouseup",
						function(upEvent){
							if (upEvent.button == downEvent.button){
								this.disconnect(moveHandle);
								this.disconnect(upHandle);
								this._grabbed = false;
								dojo.stopEvent(upEvent);
							}
						});
				}
				break;
		}
		dojo.stopEvent(downEvent);
	},

	_onMouseWheel: function(/*MouseEvent*/ wheelEvent){
		// get normalized delta
		var delta =  dojo.isMozilla
			? -wheelEvent.detail : wheelEvent.wheelDelta / 120;
		if (wheelEvent.shiftKey){
			this.setScale(this.scale * (1 + delta / 10));
		}
		else {
			this.setInflation(this.inflation * (1 + delta / 10));
		}
		dojo.stopEvent(wheelEvent); 
	},
});
