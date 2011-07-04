dojo.provide("sevenbridges.Viewer");
dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dijit._Templated");
dojo.require("dijit._Widget");
dojo.require("dijit.Menu");
dojo.require("dijit.MenuBar");
dojo.require("dijit.PopupMenuBarItem");
dojo.require("dijit.form.Button");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dojox.widget.Standby");
dojo.require("sevenbridges.Graph");
dojo.require("sevenbridges.ForceDirectedLayout");

dojo.declare("sevenbridges.Viewer", [dijit._Widget, dijit._Templated], {
	// summary:
	//		A Viewer is an embeddable graph viewing widget.

    store: null,

	templateString: dojo.cache("sevenbridges", "templates/Viewer.html"),
    widgetsInTemplate: true,

    postCreate: function(){
		this.inherited(arguments);
		this.store = new dojo.data.ItemFileWriteStore({});
	},

	loadFromSearchString: function(/*String*/ search){
		// summary:
		//		Load the graph from a URL search string
		//		(e.g. the document.location.search value).

		// parse query
		var params = search ? dojo.queryToObject(search.substring(1)) : {};

		// stylesheets specified?
		if (params.stylesheet){
			if (dojo.isArray(params.stylesheet)){
				dojo.forEach(params.stylesheet, function(stylesheet){
					this._addStyleSheet(stylesheet);
				})
			}
			else {
				this._addStyleSheet(params.stylesheet);
			}
		}

		// graph specified?
		if (params.graph){
			this.loadFromURL(params.graph)
		}
	},

    loadFromURL: function(/*String*/ url){
		this._graph.setStore(new dojo.data.ItemFileWriteStore({
			"url": url
		}));
	},

	_addStyleSheet: function addStyleSheet(url){
		// append external stylesheet to document head
		var link = dojo.doc.createElement("link");
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = url;
		dojo.place(link, dojo.query("head")[0]);
		return link;
	}
});

/*
			function loadStore(store){
				store._saveEverything = saveFile;
				graph.setStore(store);
			}

			function loadURL(url){
				loadStore(new dojo.data.ItemFileWriteStore({
					"url": url
				}));
			}

			function loadFile(file){
				// create file reader
				var reader = new FileReader();
				reader.onload = function(loadEvent){
					standby.hide();
					loadStore(new dojo.data.ItemFileWriteStore({
						"data": dojo.fromJson(loadEvent.target.result)
					}));
				}
				reader.onerror = function(errorEvent){
					standby.hide();
					console.log(errorEvent);
				}

				// read file
				standby.show();
				reader.readAsText(file);
			}

			function saveFile(){
				// build and save blob
				var blobBuilder = new BlobBuilder();
				blobBuilder.append(data);
				var fileSaver = window.saveAs(
					blobBuilder.getBlob(), "graph.json");

				// handle results of save
				standby.show();
				fileSaver.onerror = fileSaver.onabort = function(){
					standby.hide();
					onFail();
				}
				fileSaver.onwriteend = function(){
					standby.hide();
					onComplete();
				}
			}

			// schedule startup
			dojo.addOnLoad(onLoad);
		</script>
*/
