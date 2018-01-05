'use strict'

class Color {
  constructor (r = 0, g = 0, b = 0, a = 0) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
  }

  copy () {
    return new Color(this.r, this.g, this.b, this.a)
  }

  toHex () {
    let numToHex = (num) => {
      let hex = Number(num).toString(16)
      return (hex.length < 2 ? '0' : '') + hex
    }
    return `#${numToHex(this.r)}${numToHex(this.g)}${numToHex(this.b)}`
  }
}

module.exports = Color
