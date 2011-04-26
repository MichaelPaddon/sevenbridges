dojo.provide("sevenbridges.Layout");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("sevenbridges.Thread");

dojo.declare("sevenbridges.Layout",
	[dijit._Widget, dijit._Templated, sevenbridges.Runnable], {
	// summary:
	//		A Layout is a Runnable that assigns new locations
	//		to vertices in a graph.	Layouts are widgets and therefore
	//		may be declared in HTML.

	// templateString: String
	//		Widget HTML template.
	templateString: dojo.cache("sevenbridges", "templates/Layout.html"),
});
