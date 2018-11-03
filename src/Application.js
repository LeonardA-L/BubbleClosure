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
    BULLET_SCALE: 0.8,
    BULLET_Y_OFFSET: -8,
    BULLET_VELOCITY: 0.5,
  };

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

    this.bullet = new Entity({});
    this.bullet.view.updateOpts({
      superview: this.view,
      image: "resources/images/bubbles/ball_blue.png",
      layout: "box",
      width: this.constants.BUBBLE_SIZE,
      height: this.constants.BUBBLE_SIZE,
      scale: this.constants.BULLET_SCALE,
      //backgroundColor: "#FF0000"
    });
    //bullet.reset();
    this.resetBullet();

    this.debugVvvv = new View({
      superview: this.view,
      layout: "box",
      x: this.cannonPoint.x,
      y: this.cannonPoint.y,
      backgroundColor : '#0000FF',
      width: 10,
      height: 10
    });

    GC.app.view.style.scale = this.constants.SCALE;
  };

  this.resetBullet = function() {
    var cannonLength = this.aimDirection.multiply(this.constants.CANNON_TO_BASE_Y_OFFSET + this.constants.BULLET_Y_OFFSET);
    this.bullet.x = this.cannonPoint.x + cannonLength.x - this.constants.BULLET_SCALE * this.constants.BUBBLE_SIZE / 2;
    this.bullet.y = this.cannonPoint.y + cannonLength.y - this.constants.BULLET_SCALE * this.constants.BUBBLE_SIZE / 2;
  }

  this.launchUI = function () {

  };

  this.tick = function(_dt) {
    this.bullet.update(_dt);
    this.testBulletAgainstWalls();
  }

  this.testBulletAgainstWalls = function() {

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
    this.isShooting = true;
    this.isDiscarding = this.cannonAngle > this.constants.HALF_PI || this.cannonAngle < - this.constants.HALF_PI;
    this.bulletDirection = new Vec2D(this.aimDirection);
    this.bullet.vx = this.constants.BULLET_VELOCITY * this.bulletDirection.x;
    this.bullet.vy = this.constants.BULLET_VELOCITY * this.bulletDirection.y;
    //debugger;
    delete this.aimPoint;
  }

});


var Projectile = Class(Entity, function() {
  var sup = Entity.prototype;
  this.name = "Projectile";

  this.init = function(opts) {
    sup.init.call(this, opts);
  };

  this.update = function(dt) {
    sup.update.call(this, dt);
/*    var b = this.viewBounds;
    if (this.y + b.y + b.h < app.player.getScreenY()) {
      this.destroy();
    }*/
  };
});