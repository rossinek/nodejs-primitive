'use strict'
const Point = require('./Point')
const Scanlines = require('./Scanlines')
const Utils = require('./utils')

class Triangle {
  constructor (worker) {
    this.worker = worker
    this.p0 = new Point(Utils.randomInt(0, worker.width), Utils.randomInt(0, worker.height))
    this.p1 = new Point(this.p0.x + Utils.randomInt(-15, 16), this.p0.y +  Utils.randomInt(-15, 16))
    this.p2 = new Point(this.p0.x +  Utils.randomInt(-15, 16), this.p0.y +  Utils.randomInt(-15, 16))
    this.mutate()
  }

  rasterize () {
    const scanlines = new Scanlines([])
    this.computeScanlines(scanlines)
    return scanlines.crop(this.worker.width, this.worker.height)
  }

  copy () {
    const t = new Triangle(this.worker)
    t.p0 = this.p0.copy()
    t.p1 = this.p1.copy()
    t.p2 = this.p2.copy()
    return t
  }

  mutate () {
    const w = this.worker.width
    const h = this.worker.height
    // max offset
    const m = 16
    let mutationType
    do {
      mutationType = Utils.randomInt(0, 3)
      switch (mutationType) {
        case 0:
          this.p0.x = Utils.clamp(this.p0.x + Math.floor(Utils.randomNormFloat() * 16), -m, w - 1 + m)
          this.p0.y = Utils.clamp(this.p0.y + Math.floor(Utils.randomNormFloat() * 16), -m, h - 1 + m)
          break
        case 1:
          this.p1.x = Utils.clamp(this.p1.x + Math.floor(Utils.randomNormFloat() * 16), -m, w - 1 + m)
          this.p1.y = Utils.clamp(this.p1.y + Math.floor(Utils.randomNormFloat() * 16), -m, h - 1 + m)
          break
        case 2:
          this.p2.x = Utils.clamp(this.p2.x + Math.floor(Utils.randomNormFloat() * 16), -m, w - 1 + m)
          this.p2.y = Utils.clamp(this.p2.y + Math.floor(Utils.randomNormFloat() * 16), -m, h - 1 + m)
          break
      }
    } while (!this.valid())
  }

  svg (attrs = '') {
    return `<polygon ${attrs} points="${this.p0.svg()} ${this.p1.svg()} ${this.p2.svg()}" />`
  }

  valid () {
    const MIN_ANGLE = 15 * Math.PI / 180
    let x0, x1, y0, y1
    x0 = this.p1.x - this.p0.x
    y0 = this.p1.y - this.p0.y
    x1 = this.p2.x - this.p0.x
    y1 = this.p2.y - this.p0.y
    let d0 = Math.sqrt(x0 * x0 + y0 * y0)
    let d1 = Math.sqrt(x1 * x1 + y1 * y1)
    x0 /= d0
    y0 /= d0
    x1 /= d1
    y1 /= d1
    const a0 = Math.acos(x0 * x1 + y0 * y1)
    x0 = this.p0.x - this.p1.x
    y0 = this.p0.y - this.p1.y
    x1 = this.p2.x - this.p1.x
    y1 = this.p2.y - this.p1.y
    d0 = Math.sqrt(x0 * x0 + y0 * y0)
    d1 = Math.sqrt(x1 * x1 + y1 * y1)
    x0 /= d0
    y0 /= d0
    x1 /= d1
    y1 /= d1
    const a1 = Math.acos(x0 * x1 + y0 * y1)
    const a2 = Math.PI - a0 - a1
    return a0 > MIN_ANGLE && a1 > MIN_ANGLE && a2 > MIN_ANGLE
  }

  sort () {
    if (this.p0.y > this.p2.y) {
      [this.p0, this.p2] = [this.p2, this.p0]
    }
    if (this.p0.y > this.p1.y) {
      [this.p0, this.p1] = [this.p1, this.p0]
    }
    if (this.p1.y > this.p2.y) {
      [this.p1, this.p2] = [this.p2, this.p1]
    }
  }

  computeScanlines (scanlines) {
    this.sort()
    const fy = (p0, p1) => {
      return (y) => Math.floor(((y - p0.y) * (p1.x - p0.x)) / (p1.y - p0.y) + p0.x)
    }

    if (this.p0.y === this.p1.y) {
      scanlines.push(this.p0.x, this.p1.x, this.p0.y)
    } else {
      const fy0 = fy(this.p0, this.p1)
      const fy1 = fy(this.p0, this.p2)
      let a, b
      for (let y = this.p0.y; y < this.p1.y; y++) {
        a = fy0(y)
        b = fy1(y)
        if (a > b) [a, b] = [b, a]
        scanlines.push(a, b, y)
      }
    }
    if (this.p1.y === this.p2.y) {
      scanlines.push(this.p1.x, this.p2.x, this.p1.y)
    } else {
      const fy0 = fy(this.p2, this.p0)
      const fy1 = fy(this.p2, this.p1)
      let a, b
      for (let y = this.p1.y; y <= this.p2.y; y++) {
        a = fy0(y)
        b = fy1(y)
        if (a > b) [a, b] = [b, a]
        scanlines.push(a, b, y)
      }
    }
  }
}

module.exports = Triangle
