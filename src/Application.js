import ui.TextView as TextView;
import ui.View as View;
import ui.ImageView as ImageView;
import ui.ImageScaleView as ImageScaleView;
import src.Tools as Tools;
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
    BULLET_VELOCITY: 0.5,
    GRID_WIDTH: 10, // in cols
    GRID_HEIGHT: 8, // in rows

    BUBBLE_SCALE: 0.74,
    COLORS: {
      BLUE: 'blue',
      GREEN: 'green',
      PURPLE: 'purple',
      RED: 'red',
      YELLOW: 'yellow'
    },
  };

  this.constants.GRID_ITEM_WIDTH = this.constants.BUBBLE_SIZE * this.constants.BUBBLE_SCALE * 0.97;
  this.constants.GRID_ITEM_HEIGHT = this.constants.BUBBLE_SIZE * this.constants.BUBBLE_SCALE * 0.85;
  this.constants.BUBBLE_SCALED_SIZE = this.constants.BUBBLE_SIZE * this.constants.BUBBLE_SCALE;
  this.constants.BULLET_SCALED_SIZE = this.constants.BUBBLE_SIZE * this.constants.BULLET_SCALE;

  this.initUI = function () {
    app = this;

    this.aimDirection = new Vec2D({x:0, y:-1});
    this.cannonAngle = 0;

    this.onInputStart = (evt, point) => {
      this.startAim(point);
    };
    this.onInputMove = (evt, point) => {
      this.aim(point);
    };
    this.onInputSelect = (evt, point) => {
      this.shoot(point);
    };

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

    var cannonPosition = this.cannonRoot.getPosition();
    this.cannonPoint = new Vec2D({ x: cannonPosition.x, y: cannonPosition.y });

    this.gridRoot = new View({
      superview: this.view,
      layout: "box",
      x: 0,
      y: 0,
      width: baseWidth
    });

    this.currentBulletType = Tools.randomProperty(this.constants.COLORS);
    this.bullet = new Entity({});
    this.bullet.view.updateOpts({
      superview: this.view,
      image: "resources/images/bubbles/ball_" + this.currentBulletType + ".png",
      layout: "box",
      width: this.constants.BUBBLE_SIZE,
      height: this.constants.BUBBLE_SIZE,
      scale: this.constants.BULLET_SCALE,
      isCircle: true,
      bubbleType: this.currentBulletType,
      //backgroundColor: "#FF0000"
    });
    this.bullet.hitBounds.r = this.constants.BULLET_SCALED_SIZE / 2;
    this.bullet.isCircle = true;
    this.resetBullet();

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

    for(var i=0;i<this.constants.GRID_HEIGHT;i++){
      for(var j=0;j<this.constants.GRID_WIDTH - i%2;j++){
        this.bubbles.obtain(Tools.randomProperty(this.constants.COLORS), j, i, {});
      }
    }
    //debugger;

    GC.app.view.style.scale = this.constants.SCALE;
  };

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

  this.onBulletCollision = function(_bubble) {
    const bulletCenter = new Vec2D({x: this.bullet.x + this.constants.BULLET_SCALED_SIZE / 2, y: this.bullet.y + this.constants.BULLET_SCALED_SIZE / 2});
    
    //this.x = ((this.row % 2) * app.constants.GRID_ITEM_WIDTH / 2) + this.col * app.constants.GRID_ITEM_WIDTH;
    //this.y = this.row * app.constants.GRID_ITEM_HEIGHT;
    const row = Math.floor(bulletCenter.y / this.constants.GRID_ITEM_HEIGHT);
    const col = Math.floor((bulletCenter.x - ((row % 2) * this.constants.GRID_ITEM_WIDTH / 2)) / this.constants.GRID_ITEM_WIDTH);
    this.bubbles.obtain(this.currentBulletType, col, row, {});

    this.discardBullet();
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

  this.discardBullet = function() {
    this.isShooting = false;
    this.bullet.active = false;
    this.bullet.view.style.visible = false;
    this.currentBulletType = Tools.randomProperty(this.constants.COLORS);
    this.bullet.view.updateOpts({
      image: "resources/images/bubbles/ball_" + this.currentBulletType + ".png",
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

});

var Bubble = Class(Entity, function() {
  var sup = Entity.prototype;
  this.name = "Bubble";
  this.col = 0;
  this.row = 0;

  this.place = function() {
    this.x = ((this.row % 2) * app.constants.GRID_ITEM_WIDTH / 2) + this.col * app.constants.GRID_ITEM_WIDTH;
    this.y = this.row * app.constants.GRID_ITEM_HEIGHT;
  }

  this.reset = function(_, _, _opts) {
    sup.reset.call(this, _opts);
    this.col = _opts.col;
    this.row = _opts.row;
    this.active = true;
    this.view.updateOpts(_opts);
    this.hitBounds.r = app.constants.BUBBLE_SCALED_SIZE / 2;
    this.isCircle = true;
    this.place();
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