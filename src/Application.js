import ui.TextView as TextView;
import ui.View as View;
import ui.ImageView as ImageView;
import ui.ImageScaleView as ImageScaleView;
import ui.ScoreView as ScoreView;
import src.Tools as Tools;
import src.HexGrid as HexGrid;
import src.Menu as Menu;
import src.Config as config;
import entities.Entity as Entity;
import entities.EntityPool as EntityPool;
import device;
import effects;
import animate;

import math.geom.Vec2D as Vec2D;

var boundsWidth = 576;
var boundsHeight = 1024;

var baseWidth = boundsWidth; //576
var baseHeight =  device.screen.height * (boundsWidth / device.screen.width); //864
var scale = device.screen.width / baseWidth; //1

var app;
exports = Class(GC.Application, function () {
  config.BOUNDS_WIDTH = boundsWidth,
  config.BOUNDS_HEIGHT = boundsHeight,
  config.BASE_WIDTH = boundsWidth,
  config.BASE_HEIGHT = baseHeight,
  config.SCALE = scale,
  config.GRID_ITEM_WIDTH = config.BUBBLE_SIZE * config.BUBBLE_SCALE * 0.97;
  config.GRID_ITEM_HEIGHT = config.BUBBLE_SIZE * config.BUBBLE_SCALE * 0.85;
  config.BUBBLE_SCALED_SIZE = config.BUBBLE_SIZE * config.BUBBLE_SCALE;
  config.BULLET_SCALED_SIZE = config.BUBBLE_SIZE * config.BULLET_SCALE;
  config.NEXT_BULLET_SCALED_SIZE = config.BUBBLE_SIZE * config.NEXT_BULLET_SCALE;

  this.initUI = function () {
    app = this;

    this.aimDirection = new Vec2D({x:0, y:-1});
    this.cannonAngle = 0;

    this.background = new ImageScaleView({
      superview: this,

      image: "resources/images/ui/bg1_center.png",

      scaleMethod: 'cover',
      layout: 'box',
      layoutWidth: '100%',
      layoutHeight: '100%',
      centerX: true
    });

    /*this.tvHelloWorld = new TextView({
      superview: this.view,
      text: 'Hello, world! ' + Tools.square(5),
      color: '#F00000',
      x: 0,
      y: 100,
      width: this.view.style.width,
      height: 500
    });*/

    this.scoreView = new ScoreView({
      parent: this.view,
      width: 96,
      height: 33,
      text: "",
      horizontalAlign: "center",
      spacing: 0,
      characterData: {
        "0": { image: "resources/images/scoreDigits/score_0.png" },
        "1": { image: "resources/images/scoreDigits/score_1.png" },
        "2": { image: "resources/images/scoreDigits/score_2.png" },
        "3": { image: "resources/images/scoreDigits/score_3.png" },
        "4": { image: "resources/images/scoreDigits/score_4.png" },
        "5": { image: "resources/images/scoreDigits/score_5.png" },
        "6": { image: "resources/images/scoreDigits/score_6.png" },
        "7": { image: "resources/images/scoreDigits/score_7.png" },
        "8": { image: "resources/images/scoreDigits/score_8.png" },
        "9": { image: "resources/images/scoreDigits/score_9.png" }
      },

      zIndex: 60
    });

    [cannonBaseW, cannonBaseH] = [244,145];

    this.cannonBase = new ImageView({
      superview: this.view,

      y: config.BASE_HEIGHT - cannonBaseH,

      width: cannonBaseW,
      height: cannonBaseH,

      centerX: true,

      layout: "box",
      image: "resources/images/ui/cannon_base.png"
    });

    [cannonW, cannonH] = [109,125];

    this.cannonRoot = new View({
      superview: this.view,
      layout: "box",
      x: config.BASE_WIDTH / 2,
      y: config.BASE_HEIGHT - cannonBaseH,
      backgroundColor : '#FF0000',
      width: 0,
    });

    this.cannon = new ImageView({
      superview: this.cannonRoot,

      x: -cannonW / 2,
      y: -config.CANNON_TO_BASE_Y_OFFSET,

      width: cannonW,
      height: cannonH,

      //centerX: true,

      layout: "box",
      image: "resources/images/ui/cannon_top.png"
    });

    this.nextBullet = new ImageView({
      superview: this.view,

      x: (config.BASE_WIDTH - config.NEXT_BULLET_SCALED_SIZE) / 2,
      y: config.BASE_HEIGHT - config.NEXT_BULLET_Y_OFFSET,

      width: config.NEXT_BULLET_SCALED_SIZE,
      height: config.NEXT_BULLET_SCALED_SIZE,

      //centerX: true,

      layout: "box",
    });

    var cannonPosition = this.cannonRoot.getPosition();
    this.cannonPoint = new Vec2D({ x: cannonPosition.x, y: cannonPosition.y });

    this.gridRoot = new View({
      superview: this.view,
      layout: "box",
      x: 0,
      y: 0,
      width: baseWidth
    });

    this.bullet = new Entity({});
    this.bullet.view.updateOpts({
      superview: this.view,
      layout: "box",
      width: config.BUBBLE_SIZE,
      height: config.BUBBLE_SIZE,
      scale: config.BULLET_SCALE,
      isCircle: true,
      //backgroundColor: "#FF0000"
    });
    this.bullet.hitBounds.r = config.BULLET_SCALED_SIZE / 2;
    this.bullet.isCircle = true;

    /*this.debugVvvv = new View({
      superview: this.view,
      layout: "box",
      x: this.cannonPoint.x,
      y: this.cannonPoint.y,
      backgroundColor : '#0000FF',
      width: 10,
      height: 10
    });*/
    this.aimHelperPoints = [];
    for(var i = 0; i<config.HELPER_POINTS; i++){
      this.aimHelperPoints.push(new ImageView({
        superview: this.view,
        layout: "box",
        x: this.cannonPoint.x,
        y: this.cannonPoint.y,
        width: 10,
        height: 10,
        opacity: (1 - i*0.1)
      }));
    }
    
    this.bubbles = new Bubbles({ parent: this.view });

    this.generateGame();
    //debugger;

    this.eventReceiver = new View({
      superview: this.view,
      layout: "box",
      x: 0,
      y: 0,
      width: config.BASE_WIDTH,
      height: config.BASE_HEIGHT
    });

    this.eventReceiver.onInputStart = (evt, point) => {
      this.enableInputs && this.startAim(point);
    };
    this.eventReceiver.onInputMove = (evt, point) => {
      this.aim(point);
    };
    this.eventReceiver.onInputSelect = (evt, point) => {
      this.shoot(point);
    };

    this.menu = new Menu({
      superview: this.view,
      layout: "box",
      x: 0,
      y: 0,
      backgroundColor : '#FFFFFF99',
      width: config.BASE_WIDTH,
      height: config.BASE_HEIGHT,
      zIndex: 50
    });
    this.menu.populate(this.startGame, this.reStartGame, this);
    
    this.openPauseScreen({
      showLogo: true,
      showPlay: true
    });

    //debugger;
    GC.app.view.style.scale = config.SCALE;
  };

  this.toggleInputs = function(_enable) {
    this.enableInputs = _enable;
  }

  /*

  */
  this.openPauseScreen = function(_menuOpts) {
    this.menu.open(_menuOpts);
    this.toggleInputs(false);
    this.scoreViewMode(true);
  }

  this.startGame = function() {
    this.menu.close();
    this.toggleInputs(true);
    this.scoreViewMode(false);
  }

  this.reStartGame = function() {
    this.generateGame();
    this.startGame();
  }

  this.resetBullet = function() {
    var cannonLength = this.aimDirection.multiply(config.CANNON_TO_BASE_Y_OFFSET + config.BULLET_Y_OFFSET);
    this.bullet.x = this.cannonPoint.x + cannonLength.x - config.BULLET_SCALE * config.BUBBLE_SIZE / 2;
    this.bullet.y = this.cannonPoint.y + cannonLength.y - config.BULLET_SCALE * config.BUBBLE_SIZE / 2;
    this.bullet.active = true;
    this.bullet.vx = 0;
    this.bullet.vy = 0;
    this.bullet.view.style.visible = true;
  }

  this.launchUI = function () {

  };

  this.tick = function(_dt) {
    this.bullet.update(_dt);
    this.bubbles.update(_dt);

    this.updateUIElements(_dt);
    this.updateAimHelper(_dt);

    if(this.isShooting) {
      this.bubbles.onFirstCollision(this.bullet, this.onBulletCollision, this);
      this.testBulletAgainstWalls();
    }

    this.popBubbles();
    this.frame ++;
  }

  this.updateUIElements = function(_dt) {
    if(this.frame % config.DEBOUNCE_UI_UPDATE !== 0)
      return;

    this.scoreView.setText('' + (this.score > 0 ? this.score : ''));
  }

  this.scoreViewMode = function(_isInMenu) {
    if(_isInMenu) {
      this.scoreView.updateOpts({
        x: (config.BASE_WIDTH - 96 * 3) / 2,
        y: config.BASE_HEIGHT - 160,
        r: 0,
        scale: 3,
      });
    } else {
      this.scoreView.updateOpts({
        x: 40,
        centerX: false,
        y: config.BASE_HEIGHT - 160,
        r: - Math.PI / 12, // Rotation sense is not direct?
        scale: 1.8,
      });
    }
  }

  this.popBubbles = function() {
    if(!this.bubblesToDelete.length)
      return;

    if(this.frame % config.POP_FREQUENCY != 0)
      return;

    const bubble = this.bubblesToDelete.pop();
    bubble.active = false;

    this.score += bubble.floating ? config.BUBBLE_FLOATING_SCORE : config.BUBBLE_ATTACHED_SCORE;

    // Add explosion on the bubble
    effects.explode(bubble.view);
    // Make the score pop out.
    // I only managed to get a rather poor effect but the goal is to get the score moving
    // to catch the eye and create a mental link between score and bubbles popping
    animate(this.scoreView)
      .now({scale: 2.5, x: this.scoreView.style.x / 3 }, 100)
      .then({scale: 1.8, x: this.scoreView.style.x}, 100);

    bubble.release();
  }

  this.updateAvailableColors = function() {
    this.availableColors = {};
    var activeBubbles = this.bubbles.entities.filter((b)=>b.active&&!b.toBeDeleted);
    activeBubbles.forEach((b)=>{
      this.availableColors[b.type] = b.type;
    });
  }

  this.insertInGrid = function(_type, _col, _row) {
    const bb = this.bubbles.obtain(_type, _col, _row, {});
    this.grid.register(bb, _col, _row);
    return bb;
  }

  this.onBulletCollision = function(_bubble) {
    const bulletCenter = new Vec2D({x: this.bullet.x + config.BULLET_SCALED_SIZE / 2, y: this.bullet.y + config.BULLET_SCALED_SIZE / 2});
    
    const row = Math.floor(bulletCenter.y / config.GRID_ITEM_HEIGHT);
    let col = Math.floor((bulletCenter.x - ((row % 2) * config.GRID_ITEM_WIDTH / 2)) / config.GRID_ITEM_WIDTH);
    // Clamp column
    col = Math.max(0, Math.min(config.GRID_WIDTH - (row % 2 ? 2 : 1), col));
    var newBubble = this.insertInGrid(this.currentBulletType, col, row);

    this.triggerGridTest(newBubble);

    this.updateAvailableColors();

    this.discardBullet();
  }

  this.triggerGridTest = function(_bubble) {
    var toBeDeleted = this.grid.getCluster([_bubble], (b)=>b.type ===_bubble.type);

    if(toBeDeleted.length < config.MIN_BUBBLES_TO_POP) {
      this.checkDefeat(_bubble);
      return;
    }

    for(var i = 0; i<toBeDeleted.length; i++) {
      toBeDeleted[i].toBeDeleted = true;
    }

    toBeDeleted.push(...this.findFloatingBubbles());
    this.bubblesToDelete = [];
    while(toBeDeleted.length) {
      const bubbleToPop = toBeDeleted.pop();
      this.grid.unregister(bubbleToPop.col, bubbleToPop.row);
      bubbleToPop.toBeDeleted = true;
      //bubbleToPop.active = false;
      //bubbleToPop.release();
      this.bubblesToDelete.push(bubbleToPop);
    }

    this.checkVictory();
  }

  this.checkDefeat = function(_bubble) {
    if(_bubble.row < config.GRID_DEFEAT_THRESHOLD)
      return;

    // Trigger Defeat
    this.openPauseScreen({
      showDefeat: true,
      showReplay: true
    });
  }

  this.checkVictory = function() {
    var activeBubbles = this.bubbles.entities.filter((b)=>b.active&&!b.toBeDeleted);
    if(activeBubbles.length)
      return;

    // Trigger Victory
    this.openPauseScreen({
      showVictory: true,
      showReplay: true
    });
  }

  this.testBulletAgainstWalls = function() {
    // Up & Down wall: discard
    const bulletScaledSize = config.BULLET_SCALE * config.BUBBLE_SIZE;
    if(this.bullet.y <= 0 || this.bullet.y >= config.BASE_HEIGHT - bulletScaledSize) {
      this.discardBullet();
      //debugger;
    }

    // Left & Right walls: bounce
    if(this.bullet.x <= 0 && this.bullet.vx < 0
    || this.bullet.x >= config.BASE_WIDTH - bulletScaledSize  && this.bullet.vx > 0) {
      if(this.isDiscarding) { // Exception: when you shoot below the horizon
        this.discardBullet();
        return;
      }
      
      this.bullet.vx *= -1;
    }
  }

  Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

  this.findFloatingBubbles = function() {
    // Find top row
    var topRow = [];
    for(var i=0;i<config.GRID_WIDTH; i++) {
      const bubble = this.grid.get(i, 0);
      bubble && topRow.push(bubble);
    }
    // Find all attached bubbles
    var attachedCluster = this.grid.getCluster(topRow, (b)=>!b.toBeDeleted); // By not specifying a type we get all types
    var activeBubbles = this.bubbles.entities.filter((b)=>b.active&&!b.toBeDeleted);
    var floating = activeBubbles.diff(attachedCluster);

    floating.forEach(b=>{
      b.floating = true;
    });
    //debugger;
    return floating;
  }

  this.discardBullet = function() {
    this.isShooting = false;
    this.bullet.active = false;
    this.bullet.view.style.visible = false;
    this.currentBulletType = this.nextBulletType;
    this.bullet.view.updateOpts({
      image: "resources/images/bubbles/ball_" + this.currentBulletType + ".png",
    });
    this.nextBulletType = Tools.randomProperty(this.availableColors);
    if(!this.nextBulletType)
      this.nextBulletType = config.COLORS.BLUE; // Should only happen if the game is over
    this.nextBullet.updateOpts({
      image: "resources/images/bubbles/ball_" + this.nextBulletType + ".png",
    });
    this.bullet.x = -999;
    this.bullet.vx = 0;
    this.resetBullet();
  }

  this.updateAimHelper = function() {
    if(!this.aimPoint) {
      for(var p = 0; p<config.HELPER_POINTS; p++) {
        const point = this.aimHelperPoints[p];
        point.updateOpts({visible: false});
      }
      return;
    }

    var direction = new Vec2D(this.aimDirection);
    var currentPoint = this.cannonPoint;
    const padding = 5;
    currentPoint = currentPoint.add(direction.multiply(80 + config.HELPER_POINTS_SPACING));
    for(var p = 0; p<config.HELPER_POINTS; p++) {
      const point = this.aimHelperPoints[p];

      if(currentPoint.x < 0) {
        currentPoint.x = padding;
        direction.x *= -1;
      } else if(currentPoint.x > config.BASE_WIDTH) {
        currentPoint.x = config.BASE_WIDTH - padding - point.style.width;
        direction.x *= -1;
      }

      point.updateOpts({
        visible: true,
        x: currentPoint.x - 3,
        y: currentPoint.y, 
        image: "resources/images/helpers/helper_" + this.currentBulletType + ".png"
      });

      currentPoint = currentPoint.add(direction.multiply(config.HELPER_POINTS_SPACING));
    }
    //debugger;
  }

  this.startAim = function(point) {
    this.aimPoint = point;
    this.aim(point);
  }
  this.aim = function(point) {
    if(!this.aimPoint)
      return;

    this.aimPoint = point;

    this.aimDirection = new Vec2D(point).add(this.cannonPoint.negate());

    if(this.aimDirection.getMagnitude() === 0)
      return;

    this.aimDirection = this.aimDirection.multiply(1 / this.aimDirection.getMagnitude());
    this.cannonAngle = this.aimDirection.getAngle() + config.HALF_PI;
    this.cannonRoot.updateOpts({r: this.cannonAngle});

    if(!this.isShooting && !this.bubblesToDelete.length) {
      this.resetBullet();
    }
  }
  this.shoot = function(point) {
    if(!this.aimPoint)
      return;
    if(this.isShooting || this.bubblesToDelete.length)
      return;

    this.isShooting = true;
    this.isDiscarding = this.cannonAngle > config.HALF_PI || this.cannonAngle < - config.HALF_PI;
    this.bullet.vx = config.BULLET_VELOCITY * this.aimDirection.x;
    this.bullet.vy = config.BULLET_VELOCITY * this.aimDirection.y;

    effects.explode(this.bullet, config.CANNON_SMOKE_OPTS);

    //debugger;
    delete this.aimPoint;
  }

  this.reset = function(){
    this.bubbles.reset();
  }

  this.generateGame = function() {
    this.frame = 0;
    this.score = 0;

    this.bubbles.releaseAll();
    this.bubblesToDelete = [];

    this.grid && delete this.grid;
    this.grid = new HexGrid();

    for(var i=0;i<config.GRID_HEIGHT;i++){
      for(var j=0;j<config.GRID_WIDTH - i%2;j++){
        this.insertInGrid(Tools.randomProperty(config.COLORS), j, i);
      }
    }

    this.updateAvailableColors();

    this.currentBulletType = Tools.randomProperty(this.availableColors);
    this.nextBulletType = Tools.randomProperty(this.availableColors);

    this.nextBullet.updateOpts({
      image: "resources/images/bubbles/ball_" + this.nextBulletType + ".png"
    });

    this.bullet.view.updateOpts({
      image: "resources/images/bubbles/ball_" + this.currentBulletType + ".png"
    });
    this.bullet.bubbleType = this.currentBulletType;
    this.resetBullet();
  }

});

var Bubble = Class(Entity, function() {
  var sup = Entity.prototype;
  this.name = "Bubble";
  this.col = 0;
  this.row = 0;
  this.type = undefined;
  this.toBeDeleted = false;
  this.floating = false;

  this.place = function() {
    this.x = ((this.row % 2) * config.GRID_ITEM_WIDTH / 2) + this.col * config.GRID_ITEM_WIDTH;
    this.y = this.row * config.GRID_ITEM_HEIGHT;
  }

  this.reset = function(_, _, _opts) {
    sup.reset.call(this, _opts);
    this.col = _opts.col;
    this.row = _opts.row;
    this.type = _opts.type;
    this.active = true;
    this.view.updateOpts(_opts);
    this.hitBounds.r = config.BUBBLE_SCALED_SIZE / 2;
    this.isCircle = true;
    this.toBeDeleted = false;
    this.floating = false;
    this.place();

    /*this.view.onInputStart = (evt, point) => {
      debugger;
    };*/
    //debugger;
  }

  this.update = function(dt) {
    sup.update.call(this, dt);
  };
});


var Bubbles = Class(EntityPool, function() {
  var sup = EntityPool.prototype;

  this.init = function(opts) {
    opts.ctor = Bubble;
    sup.init.call(this, opts);
  };

  this.reset = function() {
    sup.reset.call(this);
  };

  this.update = function(dt) {
    sup.update.call(this, dt);
  };

  this.obtain = function(_type, _col, _row, _opts) {
    var opts = Object.assign({
      superview: app.view,
      image: "resources/images/bubbles/ball_" + _type + ".png",
      layout: "box",
      width: config.BUBBLE_SIZE * config.BUBBLE_SCALE,
      height: config.BUBBLE_SIZE * config.BUBBLE_SCALE,
      col: _col,
      row: _row,
      type: _type,
      isCircle: true,
      hitOpts: {
        radius: config.BUBBLE_SIZE * config.BUBBLE_SCALE / 2,
      },
      hitBounds: {
        radius: config.BUBBLE_SIZE * config.BUBBLE_SCALE / 2,
      },
      shape: 'Circle'
    }, _opts);

    return sup.obtain.call(this, 0, 0, opts);
  }
});