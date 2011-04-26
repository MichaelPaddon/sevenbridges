dojo.provide("sevenbridges.Thread");

dojo.declare("sevenbridges.Runnable", null, {
	// summary:
	//		A Runnable implements onStart() and onTick() callbacks.

	onStart: function(/*sevenbridges.Thread*/ thread){
		// summary:
		//		Run once when a thread is started.
		//		Default implementation does nothing.
		// tags:
		//		extension
	},

	onTick: function(/*sevenbridges.Thread*/ thread){
		// summary:
		//		Run on every thread tick.
		//		Default implementation exits the thread.
		// tags:
		//		extension

		thread.deferred.resolve(null);
	},
});

dojo.declare("sevenbridges.Thread", sevenbridges.Runnable, {
	// summary:
	//		A non-premptive thread, wrapped around the dojo.Deferred API.
	// detail:
	//		When the thread is started, onStart() is called once immediately
	//		and then onTick() is called every tick.
	//		Members of the form "__foo" are reserved for thread users,
	//		and may therefore be used safely for thread local storage.

	// runnable: [const] sevenbridges.Runnable
	//		A runnable object. If not set, deafults to the thread itself.
	runnable: null,

	// tick: [const] Integer
	//		Delay between dispatches, in milliseconds (default 10).
	tick: 10,

	// deferred: [readonly] dojo.Deferred
	//		The underlying deferred object.
	deferred: null,

	// _started: Boolean
	//		Has thread started?
	_started: null,

	// _interval: Object
	//		Timer interval identifier.
	_interval: null,

	constructor: function(/*Object?*/ properties){
		// summary:
		//		Construct a new thread, mixing in the properties.

		dojo.safeMixin(this, properties);
		if (this.runnable == null){
			this.runnable = this;
		}

		// create underlying deferred
		this.deferred = new dojo.Deferred();

		// suspend ticking when fired
		var suspend = dojo.hitch(this, this.suspend);
		this.deferred.then(suspend, suspend);
	},

	isAlive: function(){
		// summary:
		//		Is the thread alive (started and not finished)?

		return this._started && this.deferred.fired < 0; // Boolean
	},

	start: function(){
		// summary:
		//		Start the thread.
		// returns: sevenbridges.Thread
		//		This thread.

		if (!this._started){
			this._started = true;
			try {
				this.runnable.onStart(this);
				this.resume();
			}
			catch (error){
				this.deferred.reject(error);
			}
		}

		return this; // sevenbridges.Thread
	},

	suspend: function(){
		// summary:
		//		Suspend a running thread.
		// returns: sevenbridges.Thread
		//		This thread.

		// interval timer running?
		if (this._interval != null){
			// stop interval timer
			clearInterval(this._interval);
			this._interval = null;
		}

		return this; // sevenbridges.Thread
	},

	resume: function(){
		// summary:
		//		Resume a suspended thread.
		// returns: sevenbridges.Thread
		//		This thread.

		// thread alive and not running?
		if (this._started && this.deferred.fired < 0 && this._interval == null){
			// start interval timer
			this._interval = setInterval(dojo.hitch(this, function(){
				try {
					// call onTick()
					this.runnable.onTick(this);
				}
				catch (error){
					// abort thread
					this.deferred.reject(error);
				}
			}), this.tick);
		}

		return this; // sevenbridges.Thread
	}
});
