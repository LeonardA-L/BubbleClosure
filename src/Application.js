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
    HALF_PI: Math.PI/2
  };

  this.initUI = function () {
    app = this;

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

      y: baseHeight - cannonBaseH,

      width: cannonBaseW,
      height: cannonBaseH,

      centerX: true,

      layout: "box",
      image: "resources/images/ui/cannon_base.png"
    });

    var cannonToBaseYOffset = 85;
    [cannonW, cannonH] = [109,125];

    this.cannonRoot = new View({
      superview: this.view,
      layout: "box",
      x: baseWidth / 2,
      y: baseHeight - cannonBaseH,
      backgroundColor : '#FF0000',
      width: 0,
    });

    this.cannon = new ImageView({
      superview: this.cannonRoot,

      x: -cannonW / 2,
      y: -cannonToBaseYOffset,

      width: cannonW,
      height: cannonH,

      //centerX: true,

      layout: "box",
      image: "resources/images/ui/cannon_top.png"
    });

    var cannonPosition = this.cannonRoot.getPosition();
    this.cannonPoint = new Vec2D({ x: cannonPosition.x, y: cannonPosition.y });

    GC.app.view.style.scale = scale;
  };

  this.launchUI = function () {

  };

  this.tick = function(_dt) {

  }

  this.startAim = function(point) {
    this.aimPoint = point;
  }
  this.aim = function(point) {
    if(!this.aimPoint)
      return;

    this.aimPoint = point;

    var direction = new Vec2D(point).add(this.cannonPoint.negate());
    this.cannonAngle = direction.getAngle() + this.constants.HALF_PI;
    this.cannonRoot.updateOpts({r: this.cannonAngle});
  }
  this.shoot = function(point) {
    delete this.aimPoint;

    if(this.cannonAngle > this.constants.HALF_PI || this.cannonAngle < - this.constants.HALF_PI)
    {
      debugger;
    }

  }

});
