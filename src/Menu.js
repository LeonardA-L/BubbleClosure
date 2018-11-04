import ui.View as View;
import ui.ImageView as ImageView;
import ui.ImageScaleView as ImageScaleView;

exports = Class(View, function() {
	this.populate = function(_playFn, _restartFn, _ctx) {
		this.startButton = new ImageView({
	      superview: this,
	      //backgroundColor : '#0000AABB',
     	  image: "resources/images/ui/Play_btn.png",
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.55,
	      width: 288,
	      height: 120
	    });
	    this.startButton.onInputStart = (evt, point) => {
	    	_playFn.call(_ctx);
	    };

	    this.restartButton = new ImageView({
	      superview: this,
	      //backgroundColor : '#AA00AABB',
     	  image: "resources/images/ui/Play_btn.png",
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.55,
	      width: 288,
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

	    this.menuVictory = new ImageView({
	      superview: this,
     	  image: "resources/images/ui/Victory.png",
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.17,
	      width: 600,
	      height: 300,
	      scale: 0.8
	    });

	    this.menuDefeat = new ImageView({
	      superview: this,
     	  image: "resources/images/ui/Defeat.png",
	      layout: "box",
	      centerX: true,
	      y: this.style.height * 0.17,
	      width: 600,
	      height: 300,
	      scale: 0.8
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