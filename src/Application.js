import ui.TextView as TextView;
import ui.View as View;
import ui.ImageView as ImageView;
import ui.ImageScaleView as ImageScaleView;
import src.Tools as Tools;
import src.HexGrid as HexGrid;
import entities.Entity as Entity;
import entities.EntityPool as EntityPool;
import device;

import math.geom.Vec2D as Vec2D;

var boundsWidth = 576;
var boundsHeight = 1024;

var baseWidth = boundsWidth; //576
var baseHeight =  device.screen.height * (boundsWidth / device.screen.width); //864
var scale = device.screen.width / baseWidth; //1

var app;
exports = Class(GC.Application, function () {
  this.constants = {
    HALF_PI: Math.PI/2,
    BOUNDS_WIDTH: boundsWidth,
    BOUNDS_HEIGHT: boundsHeight,
    BASE_WIDTH: boundsWidth,
    BASE_HEIGHT:  baseHeight,
    SCALE: scale,

    CANNON_TO_BASE_Y_OFFSET: 85,
    BUBBLE_SIZE: 80,
    BULLET_SCALE: 0.74,
    BULLET_Y_OFFSET: -8,
    BULLET_VELOCITY: 0.6,
    GRID_WIDTH: 10, // in cols 10
    GRID_HEIGHT: 8, // in rows 8
    GRID_DEFEAT_THRESHOLD: 14, // in rows 15

    BUBBLE_SCALE: 0.74,
    COLORS: {
      BLUE: 'blue',
      GREEN: 'green',
      PURPLE: 'purple',
      RED: 'red',
      YELLOW: 'yellow'
    },

    NEXT_BULLET_SCALE: 0.65,
    NEXT_BULLET_Y_OFFSET: 80,

    MIN_BUBBLES_TO_POP: 3
  };

  this.constants.GRID_ITEM_WIDTH = this.constants.BUBBLE_SIZE * this.constants.BUBBLE_SCALE * 0.97;
  this.constants.GRID_ITEM_HEIGHT = this.constants.BUBBLE_SIZE * this.constants.BUBBLE_SCALE * 0.85;
  this.constants.BUBBLE_SCALED_SIZE = this.constants.BUBBLE_SIZE * this.constants.BUBBLE_SCALE;
  this.constants.BULLET_SCALED_SIZE = this.constants.BUBBLE_SIZE * this.constants.BULLET_SCALE;
  this.constants.NEXT_BULLET_SCALED_SIZE = this.constants.BUBBLE_SIZE * this.constants.NEXT_BULLET_SCALE;

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

    [cannonBaseW, cannonBaseH] = [244,145];

    this.cannonBase = new ImageView({
      superview: this.view,

      y: this.constants.BASE_HEIGHT - cannonBaseH,

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
      x: this.constants.BASE_WIDTH / 2,
      y: this.constants.BASE_HEIGHT - cannonBaseH,
      backgroundColor : '#FF0000',
      width: 0,
    });

    this.cannon = new ImageView({
      superview: this.cannonRoot,

      x: -cannonW / 2,
      y: -this.constants.CANNON_TO_BASE_Y_OFFSET,

      width: cannonW,
      height: cannonH,

      //centerX: true,

      layout: "box",
      image: "resources/images/ui/cannon_top.png"
    });

    this.nextBullet = new ImageView({
      superview: this.view,

      x: (this.constants.BASE_WIDTH - this.constants.NEXT_BULLET_SCALED_SIZE) / 2,
      y: this.constants.BASE_HEIGHT - this.constants.NEXT_BULLET_Y_OFFSET,

      width: this.constants.NEXT_BULLET_SCALED_SIZE,
      height: this.constants.NEXT_BULLET_SCALED_SIZE,

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
      width: this.constants.BUBBLE_SIZE,
      height: this.constants.BUBBLE_SIZE,
      scale: this.constants.BULLET_SCALE,
      isCircle: true,
      //backgroundColor: "#FF0000"
    });
    this.bullet.hitBounds.r = this.constants.BULLET_SCALED_SIZE / 2;
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
    
    this.bubbles = new Bubbles({ parent: this.view });

    this.generateGame();
    //debugger;

    this.eventReceiver = new View({
      superview: this.view,
      layout: "box",
      x: 0,
      y: 0,
      width: this.constants.BASE_WIDTH,
      height: this.constants.BASE_HEIGHT
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

    this.pauseScreen = new View({
      superview: this.view,
      layout: "box",
      x: 0,
      y: 0,
      backgroundColor : '#FFFFFF99',
      width: this.constants.BASE_WIDTH,
      height: this.constants.BASE_HEIGHT,
      zIndex: 50
    });

    this.startButton = new View({
      superview: this.pauseScreen,
      backgroundColor : '#0000AABB',
      layout: "box",
      centerX: true,
      y: this.constants.BASE_HEIGHT * 0.55,
      width: this.constants.BASE_WIDTH * 0.5,
      height: 120
    });
    this.startButton.onInputStart = (evt, point) => {
      this.startGame();
    };

    this.restartButton = new View({
      superview: this.pauseScreen,
      backgroundColor : '#AA00AABB',
      layout: "box",
      centerX: true,
      y: this.constants.BASE_HEIGHT * 0.55,
      width: this.constants.BASE_WIDTH * 0.5,
      height: 120
    });
    this.restartButton.onInputStart = (evt, point) => {
      this.reStartGame();
    };

    this.menuLogo = new View({
      superview: this.pauseScreen,
      backgroundColor : '#0000FF',
      layout: "box",
      centerX: true,
      y: this.constants.BASE_HEIGHT * 0.2,
      width: this.constants.BASE_WIDTH * 0.75,
      height: 200
    });

    this.menuVictory = new View({
      superview: this.pauseScreen,
      backgroundColor : '#00FF00',
      layout: "box",
      centerX: true,
      y: this.constants.BASE_HEIGHT * 0.2,
      width: this.constants.BASE_WIDTH * 0.75,
      height: 200
    });

    this.menuDefeat = new View({
      superview: this.pauseScreen,
      backgroundColor : '#FF0000',
      layout: "box",
      centerX: true,
      y: this.constants.BASE_HEIGHT * 0.2,
      width: this.constants.BASE_WIDTH * 0.75,
      height: 200
    });


    this.openPauseScreen({
      showLogo: true,
      showPlay: true
    });

    //debugger;
    GC.app.view.style.scale = this.constants.SCALE;
  };

  this.toggleInputs = function(_enable) {
    this.enableInputs = _enable;
  }

  /*

  */
  this.openPauseScreen = function(_menuOpts) {
    this.menuLogo.updateOpts({visible : !!_menuOpts.showLogo});
    this.menuVictory.updateOpts({visible : !!_menuOpts.showVictory});
    this.menuDefeat.updateOpts({visible : !!_menuOpts.showDefeat});

    this.startButton.updateOpts({visible : !!_menuOpts.showPlay});
    this.restartButton.updateOpts({visible : !!_menuOpts.showReplay});

    this.pauseScreen.updateOpts({visible : true});

    this.toggleInputs(false);
    //debugger;
  }

  this.startGame = function() {
    this.toggleInputs(true);
    this.pauseScreen.updateOpts({visible : false});
  }

  this.reStartGame = function() {
    this.generateGame();
    this.startGame();
  }

  this.resetBullet = function() {
    var cannonLength = this.aimDirection.multiply(this.constants.CANNON_TO_BASE_Y_OFFSET + this.constants.BULLET_Y_OFFSET);
    this.bullet.x = this.cannonPoint.x + cannonLength.x - this.constants.BULLET_SCALE * this.constants.BUBBLE_SIZE / 2;
    this.bullet.y = this.cannonPoint.y + cannonLength.y - this.constants.BULLET_SCALE * this.constants.BUBBLE_SIZE / 2;
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

    if(this.isShooting) {
      this.bubbles.onFirstCollision(this.bullet, this.onBulletCollision, this);
      this.testBulletAgainstWalls();
    }
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
    const bulletCenter = new Vec2D({x: this.bullet.x + this.constants.BULLET_SCALED_SIZE / 2, y: this.bullet.y + this.constants.BULLET_SCALED_SIZE / 2});
    
    const row = Math.floor(bulletCenter.y / this.constants.GRID_ITEM_HEIGHT);
    let col = Math.floor((bulletCenter.x - ((row % 2) * this.constants.GRID_ITEM_WIDTH / 2)) / this.constants.GRID_ITEM_WIDTH);
    // Clamp column
    col = Math.max(0, Math.min(this.constants.GRID_WIDTH - 1, col));
    var newBubble = this.insertInGrid(this.currentBulletType, col, row);

    this.triggerGridTest(newBubble);

    this.updateAvailableColors();

    this.discardBullet();
  }

  this.triggerGridTest = function(_bubble) {
    var toBeDeleted = this.grid.getCluster([_bubble], (b)=>b.type ===_bubble.type);

    if(toBeDeleted.length < this.constants.MIN_BUBBLES_TO_POP) {
      this.checkDefeat(_bubble);
      return;
    }

    for(var i = 0; i<toBeDeleted.length; i++) {
      toBeDeleted[i].toBeDeleted = true;
    }

    toBeDeleted.push(...this.findFloatingBubbles());

    while(toBeDeleted.length) {
      const bubbleToPop = toBeDeleted.pop();
      this.grid.unregister(bubbleToPop.col, bubbleToPop.row);
      bubbleToPop.toBeDeleted = true;
      bubbleToPop.active = false;
      bubbleToPop.release();
    }

    this.checkVictory();
  }

  this.checkDefeat = function(_bubble) {
    if(_bubble.row < this.constants.GRID_DEFEAT_THRESHOLD)
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
    const bulletScaledSize = this.constants.BULLET_SCALE * this.constants.BUBBLE_SIZE;
    if(this.bullet.y <= 0 || this.bullet.y >= this.constants.BASE_HEIGHT - bulletScaledSize) {
      this.discardBullet();
      //debugger;
    }

    // Left & Right walls: bounce
    if(this.bullet.x <= 0 && this.bullet.vx < 0
    || this.bullet.x >= this.constants.BASE_WIDTH - bulletScaledSize  && this.bullet.vx > 0) {
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
    for(var i=0;i<this.constants.GRID_WIDTH; i++) {
      const bubble = this.grid.get(i, 0);
      bubble && topRow.push(bubble);
    }
    // Find all attached bubbles
    var attachedCluster = this.grid.getCluster(topRow, (b)=>!b.toBeDeleted); // By not specifying a type we get all types
    var activeBubbles = this.bubbles.entities.filter((b)=>b.active&&!b.toBeDeleted);
    var floating = activeBubbles.diff(attachedCluster);
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
    this.nextBullet.updateOpts({
      image: "resources/images/bubbles/ball_" + this.nextBulletType + ".png",
    });
    this.bullet.x = -999;
    this.bullet.vx = 0;
    this.resetBullet();
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
    this.cannonAngle = this.aimDirection.getAngle() + this.constants.HALF_PI;
    this.cannonRoot.updateOpts({r: this.cannonAngle});

    if(!this.isShooting) {
      this.resetBullet();
    }
  }
  this.shoot = function(point) {
    if(!this.aimPoint)
      return;
    if(this.isShooting)
      return;

    this.isShooting = true;
    this.isDiscarding = this.cannonAngle > this.constants.HALF_PI || this.cannonAngle < - this.constants.HALF_PI;
    this.bullet.vx = this.constants.BULLET_VELOCITY * this.aimDirection.x;
    this.bullet.vy = this.constants.BULLET_VELOCITY * this.aimDirection.y;
    //debugger;
    delete this.aimPoint;
  }

  this.reset = function(){
    this.bubbles.reset();
  }

  this.generateGame = function() {
    this.bubbles.releaseAll();

    this.grid && delete this.grid;
    this.grid = new HexGrid();

    for(var i=0;i<this.constants.GRID_HEIGHT;i++){
      for(var j=0;j<this.constants.GRID_WIDTH - i%2;j++){
        this.insertInGrid(Tools.randomProperty(this.constants.COLORS), j, i);
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

  this.place = function() {
    this.x = ((this.row % 2) * app.constants.GRID_ITEM_WIDTH / 2) + this.col * app.constants.GRID_ITEM_WIDTH;
    this.y = this.row * app.constants.GRID_ITEM_HEIGHT;
  }

  this.reset = function(_, _, _opts) {
    sup.reset.call(this, _opts);
    this.col = _opts.col;
    this.row = _opts.row;
    this.type = _opts.type;
    this.active = true;
    this.view.updateOpts(_opts);
    this.hitBounds.r = app.constants.BUBBLE_SCALED_SIZE / 2;
    this.isCircle = true;
    this.toBeDeleted = false;
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
      width: app.constants.BUBBLE_SIZE * app.constants.BUBBLE_SCALE,
      height: app.constants.BUBBLE_SIZE * app.constants.BUBBLE_SCALE,
      col: _col,
      row: _row,
      type: _type,
      isCircle: true,
      hitOpts: {
        radius: app.constants.BUBBLE_SIZE * app.constants.BUBBLE_SCALE / 2,
      },
      hitBounds: {
        radius: app.constants.BUBBLE_SIZE * app.constants.BUBBLE_SCALE / 2,
      },
      shape: 'Circle'
    }, _opts);

    return sup.obtain.call(this, 0, 0, opts);
  }
});