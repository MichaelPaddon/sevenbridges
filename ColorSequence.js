dojo.provide("sevenbridges.ColorSequence");

dojo.require("dojox.color");

dojo.declare("sevenbridges.ColorSequence", [dijit._Widget, dijit._Templated], {
	// summary:
	//		A ColorSequence iterates through an endless sequence of colors.

	offset: 0,
	saturation: 100,
	luminosity: 50,

	// templateString: String
	//		Widget HTML template.
	templateString: dojo.cache("sevenbridges", "templates/ColorSequence.html"),

	postCreate: function(){
		this.inherited(arguments);
		this._hue = 0;
		this._theta = 120;
	},

	next: function(){
		// generate color
		var hue = (this._hue + this.offset) % 360;
		var color = dojox.color.fromHsl(hue ,
			this.saturation, this.luminosity); 

		// move to next color in sequence
		this._hue += this._theta;
		if(this._hue >= 360){
			this._theta /= 2;
			this._hue = this._theta / 2;
		}

		return color; // return dojo.Color
	}
});
