import ui.View as View;

exports = Class(View, function() {
	this.populate = function(_playFn, _restartFn, _ctx) {
		this.startButton = new View({
	      superview: this,
	      backgroundColor : '#0000AABB',
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.55,
	      width: this.style.width * 0.5,
	      height: 120
	    });
	    this.startButton.onInputStart = (evt, point) => {
	    	_playFn.call(_ctx);
	    };

	    this.restartButton = new View({
	      superview: this,
	      backgroundColor : '#AA00AABB',
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.55,
	      width: this.style.width * 0.5,
	      height: 120
	    });
	    this.restartButton.onInputStart = (evt, point) => {
	    	_restartFn.call(_ctx);
	    };

	    this.menuLogo = new View({
	      superview: this,
	      backgroundColor : '#0000FF',
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.2,
	      width: this.style.width * 0.75,
	      height: 200
	    });

	    this.menuVictory = new View({
	      superview: this,
	      backgroundColor : '#00FF00',
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.2,
	      width: this.style.width * 0.75,
	      height: 200
	    });

	    this.menuDefeat = new View({
	      superview: this,
	      backgroundColor : '#FF0000',
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.2,
	      width: this.style.width * 0.75,
	      height: 200
	    });
	}

	this.open = function(_menuOpts) {
		this.menuLogo.updateOpts({visible : !!_menuOpts.showLogo});
	    this.menuVictory.updateOpts({visible : !!_menuOpts.showVictory});
	    this.menuDefeat.updateOpts({visible : !!_menuOpts.showDefeat});

	    this.startButton.updateOpts({visible : !!_menuOpts.showPlay});
	    this.restartButton.updateOpts({visible : !!_menuOpts.showReplay});

	    this.updateOpts({visible : true});
	}

	this.close = function() {
	    this.updateOpts({visible : false});
	}
});