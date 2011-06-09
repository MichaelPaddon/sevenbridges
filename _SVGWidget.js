dojo.provide("sevenbridges._SVGWidget");

dojo.require("dijit._Widget");
dojo.require("sevenbridges.base");

// hack for mozilla
dijit.placementRegistry.register("svgnode", function(n, x){
	return typeof x == "object"
}, dijit.placeOnScreenAroundNode);

dojo.declare("sevenbridges._SVGWidget", dijit._Widget, {
	// summary:
	//		An _SVGWidget is a _Widget wrapped around an SVG element.

	// SVGNS: String
	//		The SVG namespace.
	SVGNS: "http://www.w3.org/2000/svg",

	// XLINKNS: String
	//		The XLINK namespace.
	XLINKNS: "http://www.w3.org/1999/xlink",

    // templateString: [const] String
    //      XML template
    templateString: "<g/>",

    buildRendering: function(){
        // summary:
        //      Render the SVG template.

		// perform ${name} substitutions on template
		var xml = dojo.string.substitute(this.templateString, this,
			dojo.hitch(this, function(value, key){
				if (key[0] == "!"){
					// no encoding on ${!name} substitutions
					value = dojo.getObject(key.substr(1), false, this);
				}
				else if (value != null){
					// encode XML special characters
					value = value.toString().replace(/[&<>"']/g,
						function(match){
							return "&#" + match.charCodeAt(0) + ";";
						});
				}
				return (value == null) ? "" : value;
			}), this);

        // parse XML and adopt node into document
        var xmldoc = dojox.xml.parser.parse(xml);
        this.domNode = dojo.doc.adoptNode(xmldoc.documentElement);
    },

	set: function(/*String*/attr, /*String*/value){
		// summary:
		//		Set a widget attribute.
		//		Handles the class attribute especially to work around
		//		Mozilla issues.

		if (attr == "class"){
			this.addClass(value);
			this[attr] = value;
		}
		else {
			this.inherited(arguments);
		}
	},

	hasClass: function(/*String*/className){
		// summary:
		//		Does the widget's DOM node have the specified class?
		//
		// className:
		//		The name of the class.

		return sevenbridges.hasClass(this.domNode, className); // Boolean
	},

	addClass: function(/*String|Array*/ classes){
		// summary:
		// 		Adds the classes to the end of the class list on the widget's
		// 		DOM node, avoiding duplication.
		//
		// classes:
		//		A whitespace delimited string of class names or an array of
		//		class names.

		sevenbridges.addClass(this.domNode, classes);
	},

	removeClass: function(/*String|Array*/ classes){
		// summary:
		// 		Removes the classes from the class list on the widget's
		// 		DOM node, if they exist.
		//
		// classes:
		//		A whitespace delimited string of class names or an array of
		//		class names.

		sevenbridges.removeClass(this.domNode, classes);
	},

	toggleClass: function(/*String|Array*/ classes){
		// summary:
		// 		Toggles the classes on the widget'S DOM node,
		//		adding them if they don't exist or removing them if they do.
		//
		// classes:
		//		A whitespace delimited string of class names or an array of
		//		class names.

		sevenbridges.toggleClass(this.domNode, classes);
	},

	resize: function(){
		// do nothing
	}
});
