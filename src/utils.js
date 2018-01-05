'use strict'


module.exports = {
  clamp (val, min = 0, max = 255) {
    return (val < min) ? min : (val > max ? max : val)
  },
  clampInt (val, min = 0, max = 255) {
    return (val < min) ? min : (val > max ? max : Math.floor(val))
  },
  // random int from [min, max)
  randomInt (min, max) {
    return Math.floor(Math.random() * (max - min)) + min
  },
  randomFloat (min, max) {
    return Math.random() * (max - min) + min
  },

  randomNormFloat () {
    return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3
  },

  isInt (value) {
    return !isNaN(value) && parseInt(Number(value)) === value && !isNaN(parseInt(value, 10))
  },

  getExtension (path) {
    return path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  }
}
