import ui.View as View;
import ui.ImageView as ImageView;
import ui.ImageScaleView as ImageScaleView;
import ui.ScoreView as ScoreView;
import ui.resource.Image as Image;

import src.Tools as Tools;
import src.HexGrid as HexGrid;
import src.Menu as Menu;
import src.Config as config;

import entities.Entity as Entity;
import entities.EntityPool as EntityPool;

import math.geom.Vec2D as Vec2D;

import device;
import effects;
import animate;

// Compute scale of the device relative to reference dimension
const boundsWidth = 576;
const boundsHeight = 1024;

const baseWidth = boundsWidth; //576
const baseHeight =  device.screen.height * (boundsWidth / device.screen.width); //864
const scale = device.screen.width / baseWidth; //1

exports = Class(GC.Application, function () {
  // Fill up config
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

  /*
    If I understand it correctly, Image will pre-load an image.
    This is great for caching bubble images and avoid loading them every time
    we shoot.
  */
  this.cachedResources = {};
  for(var i in config.COLORS) {
    if(config.COLORS.hasOwnProperty(i)) {
      const color = config.COLORS[i];
      this.cachedResources['bubble_' + color] = new Image({url: 'resources/images/bubbles/ball_' + color + '.png'});
    }
  }

  /**
   * Initializes the UI and the game
   */
  this.initUI = function () {
    // Start by Initializing every UI element
    //I realize a lot of those should move to separate classes and/or be more generic.

    this.background = new ImageScaleView({
      superview: this,

      image: 'resources/images/ui/bg1_center.png',

      scaleMethod: 'cover',
      layout: 'box',
      layoutWidth: '100%',
      layoutHeight: '100%',
      centerX: true
    });

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

    this.cannonRoot = new View({  // This root is here to serve as a pivot for the cannon
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

    // Store newly created cannon position
    this.cannonPoint = new Vec2D(this.cannonRoot.getPosition());

    /*
     The Bullet entity is the one bullet you fire with the cannon.
     For performance reasons it is reused instead of inserting it
     into the grid.
     It is a special entity not like the bubbles in the actual grid.
    */
    this.bullet = new Entity({});
    this.bullet.view.updateOpts({
      superview: this.view,
      layout: 'box',
      width: config.BUBBLE_SIZE,
      height: config.BUBBLE_SIZE,
      scale: config.BULLET_SCALE,
    });
    this.bullet.hitBounds.r = config.BULLET_SCALED_SIZE / 2;
    this.bullet.isCircle = true;

    /*
      Just like the bullet, the "nextBullet" is reused and isn't an actual bullet.
      It is simply a view that shows the color of the upcoming bubble.
    */
    this.nextBullet = new ImageView({
      superview: this.view,

      x: (config.BASE_WIDTH - config.NEXT_BULLET_SCALED_SIZE) / 2,
      y: config.BASE_HEIGHT - config.NEXT_BULLET_Y_OFFSET,

      width: config.NEXT_BULLET_SCALED_SIZE,
      height: config.NEXT_BULLET_SCALED_SIZE,

      layout: 'box',
    });

    /*
      Helper points for the dotted line that show the sight of the cannon when aiming.
      This line bounces off walls like a bubble would.
    */
    this.aimHelperPoints = [];
    for(let i = 0; i<config.HELPER_POINTS; i++){
      this.aimHelperPoints.push(new ImageView({
        superview: this.view,
        layout: 'box',
        x: this.cannonPoint.x,
        y: this.cannonPoint.y,
        width: 10,
        height: 10,
        opacity: (1 - i / config.HELPER_POINTS)
      }));
    }

    // The EventReceiver is the view that catches inputs
    this.eventReceiver = new View({
      superview: this.view,
      layout: 'box',
      x: 0,
      y: 0,
      width: config.BASE_WIDTH,
      height: config.BASE_HEIGHT,
      zIndex: 10
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

    // See Menu.js for complete description of the class
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
    

    /*this.debugVvvv = new View({
      superview: this.view,
      layout: 'box',
      x: this.cannonPoint.x,
      y: this.cannonPoint.y,
      backgroundColor : '#FF0000',
      width: 30,
      height: 30
    });*/
    GC.app.view.style.scale = config.SCALE;

    // Once UI is initialized, we create gameplay elements like the grid

    this.openPauseScreen({
      showLogo: true,
      showPlay: true
    });

    this.aimDirection = new Vec2D({x:0, y:-1});
    this.cannonAngle = 0;
    
    // @see Bubbles
    this.bubbles = new Bubbles({ parent: this.view });
    // @see ScoreHelpers
    this.scoreHelpers = new ScoreHelpers({ parent: this.view });

    this.generateGame();
    //debugger;
  };

  this.launchUI = function () {

  };

  /**
   * Allows enabling/disabling player input, for instance when pausing the game.
   * @arg {boolean} [_enable]
   */
  this.toggleInputs = function(_enable) {
    this.enableInputs = _enable;
  };

  /**
   * Opens the menu screen and pauses the game.
   * @arg {object} [_menuOpts]
   * @see Menu#open for all available options
   */
  this.openPauseScreen = function(_menuOpts) {
    this.menu.open(_menuOpts);
    this.toggleInputs(false);
    this.setScoreViewMode(true);
  };

  /**
   * Removes menu screen and starts the game
   */
  this.startGame = function() {
    this.menu.close();
    this.toggleInputs(true);
    this.setScoreViewMode(false);
  };

  /**
   * Generates a new game wiping the current one, and start the game
   * @see Application#generateGame
   */
  this.reStartGame = function() {
    this.generateGame();
    this.startGame();
  };

  /**
   * Places the bullet back at the top of the cannon and sets its properties
   */
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

  /**
   * Is called every frame and updates the game elements
   * @arg {float} [_dt]
   */
  this.tick = function(_dt) {
    this.bullet.update(_dt);

    if(this.frame % config.DEBOUNCE_BUBBLE_UPDATE === 0) {
      this.bubbles.update(_dt);
      this.scoreHelpers.update(_dt);
    }

    this.updateUIElements(_dt);

    /*
      Update the aim helper (the dotted line that helps you aim).
      It should be in `updateUIElements` but since it's a gameplay element
      we don't want it debounced to make it as responsive as possible
    */
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

  /**
   * Update UI elements (called every frame).
   * @arg {float} [_dt]
   */
  this.updateUIElements = function(_dt) {
    if(this.frame % config.DEBOUNCE_UI_UPDATE !== 0)
      return;

    this.scoreView.setText('' + (this.score > 0 ? this.score : ''));
  };

  /**
   * Changes the way we show the score view. If it's on the menu it should be big and centered.
   * @arg {boolean} [_isInMenu]
   */
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

  /**
   * Pops bubbles that need to be popped (called every frame). Since it runs every `POP_FREQUENCY` frame,
   * We pop only one bubble per call, this way we get a nice effect of bubbles popping one after another.
   * @see Application#triggerGridTest
   */
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

  /**
   * Scans the map to check what colors are available. We don't want to load the cannon with bubble colors that
   * are not on the grid.
   */
  this.updateAvailableColors = function() {
    this.availableColors = {};
    const activeBubbles = this.bubbles.entities.filter(b => b.active && !b.toBeDeleted);
    activeBubbles.forEach((b)=>{
      this.availableColors[b.type] = b.type;
    });
  };

  /**
   * Creates a bubble by requiring it from the pool and registers it into the grid.
   * @arg {string} [_type] the color of the bubble
   * @arg {float} [_col] column of the bubble in the grid
   * @arg {float} [_row] row of the bubble in the grid
   * @see HexGrid#register
   * @see Bubbles#obtain
   */
  this.insertInGrid = function(_type, _col, _row) {
    const bb = this.bubbles.obtain(_type, _col, _row, {superview: this.view, image: this.cachedResources['bubble_' + _type]});
    this.grid.register(bb, _col, _row);
    return bb;
  };

  /**
   * Triggers when the bullet collides with an element from the grid
   * @arg {Bubble} [_bubble] the bubble the bullet has collided with
   */
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

  /**
   * Checks if the recently inserted bubble has created a 3+ match and start the procedure to pop corresponding bubbles.
   * It will also find the bubbles that not attached to the ceiling and flag them for popping.
   * @arg {Bubble} [_bubble] most recently inserted bubble
   * @see Application#popBubbles
   * @see HexGrid#getCluster
   */
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

  /**
   * Checks defeat conditions and triggers defeat endscreen if needed
   * @arg {Bubble} [_bubble] most recently inserted bubble
   */
  this.checkDefeat = function(_bubble) {
    if(_bubble.row < config.GRID_DEFEAT_THRESHOLD)
      return;

    // Trigger Defeat
    this.openPauseScreen({
      showDefeat: true,
      showReplay: true
    });
  };

  /**
   * Checks victory conditions and triggers victory endscreen if needed
   * @arg {Bubble} [_bubble] most recently inserted bubble
   */
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

  /**
   * Tests if a bullet has hit a the borders of the game
   */
  this.testBulletAgainstWalls = function() {
    // Up & Down wall: discard
    const bulletScaledSize = config.BULLET_SCALE * config.BUBBLE_SIZE;
    if(this.bullet.y <= 0 || this.bullet.y >= config.BASE_HEIGHT - bulletScaledSize) {
      this.discardBullet();
      return true;
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

  /**
   * Finds all floating bubbles in the grid using a flood fill algorithm.
   * @see HexGrid#getCluster
   */
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

  /**
   * Remove the bullet from the screen as it has hit something.
   * @see Application#resetBullet
   */
  this.discardBullet = function() {
    this.isShooting = false;
    this.bullet.active = false;
    this.bullet.view.style.visible = false;
    this.bullet.x = -999;
    this.bullet.vx = 0;

    this.currentBulletType = this.nextBulletType;
    this.nextBulletType = Tools.randomProperty(this.availableColors);
  };

  /**
   * Called every frame. Updates the position of the dotted line that helps you aim.
   */
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

  /**
   * Called when the user clicks. It will define the point where the player is aiming
   * @arg {point} [_point]
   * @see Application#aim
   */
  this.startAim = function(_point) {
    this.aimPoint = _point;
    this.aim(_point);
  };

  /**
   * Updates the current point we're aiming for.
   * @arg {point} [_point]
   * @see Application#startAim
   */
  this.aim = function(_point) {
    if(!this.aimPoint)
      return;

    this.aimPoint = _point;

    this.aimDirection = new Vec2D(_point).add(this.cannonPoint.negate());

    if(this.aimDirection.getMagnitude() === 0)
      return;

    this.aimDirection = this.aimDirection.multiply(1 / this.aimDirection.getMagnitude());
    this.cannonAngle = this.aimDirection.getAngle() + config.HALF_PI;
    this.cannonRoot.updateOpts({r: this.cannonAngle});
  };

  /**
   * If allowed, shoots the bullet.
   * @arg {point} [_point]
   * @see Application#aim
   */
  this.shoot = function(_point) {
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

  /**
   * Wipes and rebuilds all the gameplay data needed to build the game.
   */
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

  /**
   * Generates the map. This is a very basic map generation that just produces random bubbles
   */
  this.generateMap = function() {
    for(let i=0;i<config.GRID_HEIGHT;i++){
      for(let j=0;j<config.GRID_WIDTH - i%2;j++){
        this.insertInGrid(Tools.randomProperty(config.COLORS), j, i);
      }
    }
  };

});

/**
 * Class reprenting a bubble in the hex grid. This is entity is going to be pooled.
 * @see Bubbles
 */
var Bubble = Class(Entity, function() {
  var sup = Entity.prototype;
  this.name = 'Bubble';
  this.col = 0;
  this.row = 0;
  this.type = undefined;
  this.toBeDeleted = false;
  this.floating = false;

  /**
   * Based on row and column properties, places the bubble entity on the screen
   */
  this.place = function() {
    this.x = ((this.row % 2) * config.GRID_ITEM_WIDTH / 2) + this.col * config.GRID_ITEM_WIDTH;
    this.y = this.row * config.GRID_ITEM_HEIGHT;
  };

  /**
   * Resets the bubble when the pool provides it.
   * @arg {object} [_opts]
   */
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

/**
 * Pool of entities managing the bubbles in game. Bubbles are pooled because there can be up to 150 of them on the map
 */
var Bubbles = Class(EntityPool, function() {
  var sup = EntityPool.prototype;

  this.init = function(_opts) {
    _opts.ctor = Bubble;
    sup.init.call(this, _opts);
  };

  /**
   * Provides a bubble with a mix of default config and inputs
   * @arg {string} [_type] the color of the bubble
   * @arg {float} [_col] the column of the bubble in the grid
   * @arg {float} [_row] the row of the bubble in the grid
   * @arg {object} [_opts] additionnal options
   */
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

/**
 * Score Helpers are these small "+1" and "+2" that show on the grid when popping a bubble.
 */
var ScoreHelper = Class(Entity, function() {
  var sup = Entity.prototype;
  this.name = 'ScoreHelper';
  this.timerMax = config.SCORE_HELPER_TIMER_MAX;
  this.timer = 0;

  /**
   * Called every frame. Destroys the entity after the end of a countdown.
   */
  this.update = function(_dt) {
    this.timer += _dt;
    if(this.timer >= this.timerMax) {
      this.release();
    }
  }
});

/**
 * Pool supporting Score Helpers
 * @see ScoreHelpers
 */
var ScoreHelpers = Class(EntityPool, function() {
  var sup = EntityPool.prototype;

  this.init = function(_opts) {
    _opts.ctor = ScoreHelper;
    sup.init.call(this, _opts);
  };
});