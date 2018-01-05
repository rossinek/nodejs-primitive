'use strict'

class Point {
  constructor (x, y) {
    this.x = x
    this.y = y
  }

  copy () {
    return new Point(this.x, this.y)
  }

  svg () {
    return `${this.x},${this.y}`
  }
}

module.exports = Point
