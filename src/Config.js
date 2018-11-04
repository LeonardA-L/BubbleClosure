exports = {
  HALF_PI: Math.PI/2,

  CANNON_TO_BASE_Y_OFFSET: 85,
  BUBBLE_SIZE: 80,
  BULLET_SCALE: 0.74,
  BULLET_Y_OFFSET: -8,
  BULLET_VELOCITY: 0.65,
  GRID_WIDTH: 10, // in cols 10
  GRID_HEIGHT: 8, // in rows 8
  GRID_DEFEAT_THRESHOLD: 14, // in rows 14

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

  MIN_BUBBLES_TO_POP: 3,
  POP_FREQUENCY: 2, // in frames

  DEBOUNCE_UI_UPDATE: 4,
  DEBOUNCE_BUBBLE_UPDATE: 4,

  BUBBLE_FLOATING_SCORE: 2,
  BUBBLE_ATTACHED_SCORE: 1,

  HELPER_POINTS: 10,
  HELPER_POINTS_SPACING: 50,

  CANNON_SMOKE_OPTS: {
    blend: false,
    speed: 0.7,
    images: [
      'resources/images/particles/particleSmoke3_bw.png',
      'resources/images/particles/particleSmoke4_bw.png',
      'resources/images/particles/particleSmoke5_bw.png',
    ]
  },

  SCORE_VIEW_CONFIG: {
    width: 96,
    height: 33,
    text: '',
    horizontalAlign: 'center',
    spacing: 0,
    characterData: {
      '0': { image: 'resources/images/scoreDigits/score_0.png' },
      '1': { image: 'resources/images/scoreDigits/score_1.png' },
      '2': { image: 'resources/images/scoreDigits/score_2.png' },
      '3': { image: 'resources/images/scoreDigits/score_3.png' },
      '4': { image: 'resources/images/scoreDigits/score_4.png' },
      '5': { image: 'resources/images/scoreDigits/score_5.png' },
      '6': { image: 'resources/images/scoreDigits/score_6.png' },
      '7': { image: 'resources/images/scoreDigits/score_7.png' },
      '8': { image: 'resources/images/scoreDigits/score_8.png' },
      '9': { image: 'resources/images/scoreDigits/score_9.png' }
    },

    zIndex: 60
  }
}