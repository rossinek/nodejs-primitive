'use strict'

const Utils = require('./utils/utils')

class Scanlines {
  constructor (lines) {
    this.lines = lines
  }

  crop (w, h) {
    this.lines = this.lines.reduce((acc, line) => {
      if (line.y < 0 || line.y >= h  || line.x0 >= w || line.x1 < 0) {
        return acc
      }
      line.x0 = Utils.clamp(line.x0, 0, w-1)
      line.x1 = Utils.clamp(line.x1, 0, w-1)
      if (line.x0 <= line.x1) {
        acc.push(line)
      }
      // else [line.x0, line.x1] = [line.x1, line.x0]
      return acc
    }, [])
    return this
  }

  push (x0, x1, y, alpha = 0xff) {
    this.lines.push({x0, x1, y, alpha})
  }
}

module.exports = Scanlines
