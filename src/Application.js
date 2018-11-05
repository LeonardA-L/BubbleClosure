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
import ui.resource.Image as Image;
import device;
import effects;
import animate;

import math.geom.Vec2D as Vec2D;

const boundsWidth = 576;
const boundsHeight = 1024;

const baseWidth = boundsWidth; //576
const baseHeight =  device.screen.height * (boundsWidth / device.screen.width); //864
const scale = device.screen.width / baseWidth; //1

exports = Class(GC.Application, function () {
  config.BOUNDS_WIDTH = boundsWidth;
  config.BOUNDS_HEIGHT = boundsHeight;
  config.BASE_WIDTH = boundsWidth;
  config.BASE_HEIGHT = baseHeight;
  config.SCALE = scale;
  config.GRID_ITEM_WIDTH = config.BUBBLE_SIZE * config.BUBBLE_SCALE * 0.97;
  config.GRID_ITEM_HEIGHT = config.BUBBLE_SIZE * config.BUBBLE_SCALE * 0.85;
  config.BUBBLE_SCALED_SIZE = config.BUBBLE_SIZE * config.BUBBLE_SCALE;
  config.BULLET_SCALED_SIZE = config.BUBBLE_SIZE * config.BULLET_SCALE;
  config.NEXT_BULLET_SCALED_SIZE = config.BUBBLE_SIZE * config.NEXT_BULLET_SCALE;

  this.initUI = function () {
    this.cachedResources = {};
    for(var i in config.COLORS) {
      if(config.COLORS.hasOwnProperty(i)) {
        const color = config.COLORS[i];
        this.cachedResources['bubble_' + color] = new Image({url: 'resources/images/bubbles/ball_' + color + '.png'});
      }
    }
    
    this.aimDirection = new Vec2D({x:0, y:-1});
    this.cannonAngle = 0;

    this.background = new ImageScaleView({
      superview: this,

      image: 'resources/images/ui/bg1_center.png',

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

    this.scoreView = new ScoreView(Object.assign({parent: this.view}, config.SCORE_VIEW_CONFIG));

    [cannonBaseW, cannonBaseH] = [244,145];

    this.cannonBase = new ImageView({
      superview: this.view,

      y: config.BASE_HEIGHT - cannonBaseH,

      width: cannonBaseW,
      height: cannonBaseH,

      centerX: true,

      layout: 'box',
      image: 'resources/images/ui/cannon_base.png'
    });

    [cannonW, cannonH] = [109,125];

    this.cannonRoot = new View({
      superview: this.view,
      layout: 'box',
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

      layout: 'box',
      image: 'resources/images/ui/cannon_top.png'
    });

    this.nextBullet = new ImageView({
      superview: this.view,

      x: (config.BASE_WIDTH - config.NEXT_BULLET_SCALED_SIZE) / 2,
      y: config.BASE_HEIGHT - config.NEXT_BULLET_Y_OFFSET,

      width: config.NEXT_BULLET_SCALED_SIZE,
      height: config.NEXT_BULLET_SCALED_SIZE,

      layout: 'box',
    });

    const cannonPosition = this.cannonRoot.getPosition();
    this.cannonPoint = new Vec2D({ x: cannonPosition.x, y: cannonPosition.y });

    this.gridRoot = new View({
      superview: this.view,
      layout: 'box',
      x: 0,
      y: 0,
      width: baseWidth
    });

    this.bullet = new Entity({});
    this.bullet.view.updateOpts({
      superview: this.view,
      layout: 'box',
      width: config.BUBBLE_SIZE,
      height: config.BUBBLE_SIZE,
      scale: config.BULLET_SCALE,
      isCircle: true,
      //backgroundColor: '#FF0000'
    });
    this.bullet.hitBounds.r = config.BULLET_SCALED_SIZE / 2;
    this.bullet.isCircle = true;

    /*this.debugVvvv = new View({
      superview: this.view,
      layout: 'box',
      x: this.cannonPoint.x,
      y: this.cannonPoint.y,
      backgroundColor : '#FF0000',
      width: 30,
      height: 30
    });*/

    this.aimHelperPoints = [];
    for(let i = 0; i<config.HELPER_POINTS; i++){
      this.aimHelperPoints.push(new ImageView({
        superview: this.view,
        layout: 'box',
        x: this.cannonPoint.x,
        y: this.cannonPoint.y,
        width: 10,
        height: 10,
        opacity: (1 - i*0.1)
      }));
    }
    
    this.bubbles = new Bubbles({ parent: this.view });
    this.scoreHelpers = new ScoreHelpers({ parent: this.view });

    this.generateGame();

    this.eventReceiver = new View({
      superview: this.view,
      layout: 'box',
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
      layout: 'box',
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

  this.launchUI = function () {

  };

  this.toggleInputs = function(_enable) {
    this.enableInputs = _enable;
  };

  this.openPauseScreen = function(_menuOpts) {
    this.menu.open(_menuOpts);
    this.toggleInputs(false);
    this.setScoreViewMode(true);
  };

  this.startGame = function() {
    this.menu.close();
    this.toggleInputs(true);
    this.setScoreViewMode(false);
  };

  this.reStartGame = function() {
    this.generateGame();
    this.startGame();
  };

  this.resetBullet = function() {
    const cannonLength = this.aimDirection.multiply(config.CANNON_TO_BASE_Y_OFFSET + config.BULLET_Y_OFFSET);
    this.bullet.x = this.cannonPoint.x + cannonLength.x - config.BULLET_SCALE * config.BUBBLE_SIZE / 2;
    this.bullet.y = this.cannonPoint.y + cannonLength.y - config.BULLET_SCALE * config.BUBBLE_SIZE / 2;
    this.bullet.active = true;
    this.bullet.vx = 0;
    this.bullet.vy = 0;
    this.bullet.view.style.visible = true;

    if(!this.nextBulletType)
      this.nextBulletType = config.COLORS.BLUE; // Cosmetic: Should only happen if the game is over

    this.nextBullet.updateOpts({
      image: this.cachedResources['bubble_' + this.nextBulletType]
    });
    this.bullet.view.updateOpts({
      image: this.cachedResources['bubble_' + this.currentBulletType]
    });
  };

  this.tick = function(_dt) {
    this.bullet.update(_dt);

    if(this.frame % config.DEBOUNCE_BUBBLE_UPDATE === 0) {
      this.bubbles.update(_dt);
      this.scoreHelpers.update(_dt);
    }

    this.updateUIElements(_dt);
    this.updateAimHelper(_dt);

    if(this.isShooting) {
      if(!this.testBulletAgainstWalls()) {
        this.bubbles.onFirstCollision(this.bullet, this.onBulletCollision, this);
      }
    } else {
      this.resetBullet();
    }

    this.popBubbles();
    this.frame ++;
  };

  this.updateUIElements = function(_dt) {
    if(this.frame % config.DEBOUNCE_UI_UPDATE !== 0)
      return;

    this.scoreView.setText('' + (this.score > 0 ? this.score : ''));
  };

  this.setScoreViewMode = function(_isInMenu) {
    // All of this is purely cosmetic and should be moved to a config file
    if(_isInMenu) {
      this.scoreView.updateOpts({
        x: (config.BASE_WIDTH - 96 * 2) / 2,
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
  };

  this.popBubbles = function() {
    if(!this.bubblesToDelete.length)
      return;

    if(this.frame % config.POP_FREQUENCY != 0)
      return;

    const bubble = this.bubblesToDelete.pop();
    bubble.active = false;

    const scoreDiff = bubble.floating ? config.BUBBLE_FLOATING_SCORE : config.BUBBLE_ATTACHED_SCORE
    this.score += scoreDiff;

    // Add explosion on the bubble
    effects.explode(bubble.view);
    // Make the score pop out.
    // I only managed to get a rather poor effect but the goal is to get the score moving
    // to catch the eye and create a mental link between score and bubbles popping
    animate(this.scoreView)
      .now({ scale: 2.5 }, 100)
      .then({ scale: 1.8 }, 100);

    var scoreHelper = this.scoreHelpers.obtain(bubble.x, bubble.y, {
      superview: this.view,
      layout: 'box',
      width: scoreDiff === 1 ? 30 : 40,
      height: scoreDiff === 1 ? 30 : 33,
      // NB: I tried caching these using Image like bubble images but Entity wouldn't let me
      image: scoreDiff === 1 ? 'resources/images/scoreDigits/pop_plus_1.png' : 'resources/images/scoreDigits/pop_plus_2_'+bubble.type+'.png',
      zIndex: 40
    });
    scoreHelper.timer = 0;
    animate(scoreHelper.view)
      .now({ scale: 4 }, 100)
      .then({ scale: 1.5 }, 100);

    bubble.release();
  };

  this.updateAvailableColors = function() {
    this.availableColors = {};
    const activeBubbles = this.bubbles.entities.filter(b => b.active && !b.toBeDeleted);
    activeBubbles.forEach((b)=>{
      this.availableColors[b.type] = b.type;
    });
  };

  this.insertInGrid = function(_type, _col, _row) {
    const bb = this.bubbles.obtain(_type, _col, _row, {superview: this.view, image: this.cachedResources['bubble_' + _type]});
    this.grid.register(bb, _col, _row);
    return bb;
  };

  this.onBulletCollision = function(_bubble) {
    const bulletCenter = new Vec2D({x: this.bullet.x + config.BULLET_SCALED_SIZE / 3, y: this.bullet.y + config.BULLET_SCALED_SIZE / 3});

    const row = Math.floor(bulletCenter.y / config.GRID_ITEM_HEIGHT);
    let col = Math.floor((bulletCenter.x - ((row % 2) * config.GRID_ITEM_WIDTH / 2)) / config.GRID_ITEM_WIDTH);

    // Clamp column
    col = Math.max(0, Math.min(config.GRID_WIDTH - (row % 2 ? 2 : 1), col));
    const newBubble = this.insertInGrid(this.currentBulletType, col, row);

    this.triggerGridTest(newBubble);

    this.updateAvailableColors();

    this.discardBullet();
  };

  this.triggerGridTest = function(_bubble) {
    let toBeDeleted = this.grid.getCluster([_bubble], (b)=>b.type ===_bubble.type);

    if(toBeDeleted.length < config.MIN_BUBBLES_TO_POP) {
      this.checkDefeat(_bubble);
      return;
    }

    for(let i = 0; i<toBeDeleted.length; i++) {
      toBeDeleted[i].toBeDeleted = true;
    }

    toBeDeleted.push(...this.findFloatingBubbles());

    this.bubblesToDelete = [];
    while(toBeDeleted.length) {
      const bubbleToPop = toBeDeleted.pop();
      this.grid.unregister(bubbleToPop.col, bubbleToPop.row);
      bubbleToPop.toBeDeleted = true;
      this.bubblesToDelete.push(bubbleToPop); // We're delaying poping bubbles just for the cool effect
    }

    this.checkVictory();
  };

  this.checkDefeat = function(_bubble) {
    if(_bubble.row < config.GRID_DEFEAT_THRESHOLD)
      return;

    // Trigger Defeat
    this.openPauseScreen({
      showDefeat: true,
      showReplay: true
    });
  };

  this.checkVictory = function() {
    const activeBubbles = this.bubbles.entities.filter((b)=>b.active&&!b.toBeDeleted);
    if(activeBubbles.length)
      return;

    // Trigger Victory
    this.openPauseScreen({
      showVictory: true,
      showReplay: true
    });
  };

  this.testBulletAgainstWalls = function() {
    // Up & Down wall: discard
    const bulletScaledSize = config.BULLET_SCALE * config.BUBBLE_SIZE;
    if(this.bullet.y <= 0 || this.bullet.y >= config.BASE_HEIGHT - bulletScaledSize) {
      this.discardBullet();
      return true;
      //debugger;
    }

    // Left & Right walls: bounce
    if(this.bullet.x <= 0 && this.bullet.vx < 0
    || this.bullet.x >= config.BASE_WIDTH - bulletScaledSize  && this.bullet.vx > 0) {
      if(this.isDiscarding) { // Exception: when you shoot below the horizon
        this.discardBullet();
        return true;
      }
      
      this.bullet.vx *= -1;
    }
  };

  this.findFloatingBubbles = function() {
    // Find top row
    let topRow = [];
    for(let i=0;i<config.GRID_WIDTH; i++) {
      const bubble = this.grid.get(i, 0);
      bubble && topRow.push(bubble);
    }
    // Find all attached bubbles
    const attachedCluster = this.grid.getCluster(topRow, b => !b.toBeDeleted); // By not specifying a type we get all types
    const activeBubbles = this.bubbles.entities.filter(b => b.active && !b.toBeDeleted);
    const floating = activeBubbles.diff(attachedCluster);

    floating.forEach(b=>{
      b.floating = true;
    });
    return floating;
  };

  this.discardBullet = function() {
    this.isShooting = false;
    this.bullet.active = false;
    this.bullet.view.style.visible = false;
    this.bullet.x = -999;
    this.bullet.vx = 0;

    this.currentBulletType = this.nextBulletType;
    this.nextBulletType = Tools.randomProperty(this.availableColors);
  };

  this.updateAimHelper = function() {
    if(!this.aimPoint) {
      for(let p = 0; p<config.HELPER_POINTS; p++) {
        const point = this.aimHelperPoints[p];
        point.updateOpts({ visible: false });
      }
      return;
    }

    let direction = new Vec2D(this.aimDirection);
    let currentPoint = this.cannonPoint;
    const padding = 5;
    currentPoint = currentPoint.add(direction.multiply(80 + config.HELPER_POINTS_SPACING));
    for(let p = 0; p<config.HELPER_POINTS; p++) {
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
        image: 'resources/images/helpers/helper_' + this.currentBulletType + '.png'
      });

      currentPoint = currentPoint.add(direction.multiply(config.HELPER_POINTS_SPACING));
    }
  };

  this.startAim = function(point) {
    this.aimPoint = point;
    this.aim(point);
  };

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
  };

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
  };

  this.reset = function(){
    this.bubbles.reset();
    this.scoreHelpers.reset();
  };

  this.generateGame = function() {
    this.frame = 0;
    this.score = 0;

    this.bubbles.releaseAll();
    this.bubblesToDelete = [];

    this.grid && delete this.grid;
    this.grid = new HexGrid();

    this.generateMap();

    this.updateAvailableColors();

    this.currentBulletType = Tools.randomProperty(this.availableColors);
    this.nextBulletType = Tools.randomProperty(this.availableColors);

    this.nextBullet.updateOpts({
      image: this.cachedResources['bubble_' + this.nextBulletType]
    });

    this.bullet.view.updateOpts({
      image: this.cachedResources['bubble_' + this.currentBulletType]
    });
    this.bullet.bubbleType = this.currentBulletType;
    this.resetBullet();
  };

  this.generateMap = function() {
    for(let i=0;i<config.GRID_HEIGHT;i++){
      for(let j=0;j<config.GRID_WIDTH - i%2;j++){
        this.insertInGrid(Tools.randomProperty(config.COLORS), j, i);
      }
    }
  };

});

var Bubble = Class(Entity, function() {
  var sup = Entity.prototype;
  this.name = 'Bubble';
  this.col = 0;
  this.row = 0;
  this.type = undefined;
  this.toBeDeleted = false;
  this.floating = false;

  this.place = function() {
    this.x = ((this.row % 2) * config.GRID_ITEM_WIDTH / 2) + this.col * config.GRID_ITEM_WIDTH;
    this.y = this.row * config.GRID_ITEM_HEIGHT;
  };

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
  };
});


var Bubbles = Class(EntityPool, function() {
  var sup = EntityPool.prototype;

  this.init = function(opts) {
    opts.ctor = Bubble;
    sup.init.call(this, opts);
  };

  this.obtain = function(_type, _col, _row, _opts) {
    const opts = Object.assign({
      layout: 'box',
      width: config.BUBBLE_SIZE * config.BUBBLE_SCALE,
      height: config.BUBBLE_SIZE * config.BUBBLE_SCALE,
      col: _col,
      row: _row,
      type: _type,
      isCircle: true
    }, _opts);

    return sup.obtain.call(this, 0, 0, opts);
  };
});

var ScoreHelper = Class(Entity, function() {
  var sup = Entity.prototype;
  this.name = 'ScoreHelper';
  this.timerMax = config.SCORE_HELPER_TIMER_MAX;
  this.timer = 0;

  this.update = function(_dt) {
    this.timer += _dt;
    if(this.timer >= this.timerMax) {
      this.release();
    }
  }
});

var ScoreHelpers = Class(EntityPool, function() {
  var sup = EntityPool.prototype;

  this.init = function(opts) {
    opts.ctor = ScoreHelper;
    sup.init.call(this, opts);
  };
});