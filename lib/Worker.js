'use strict'
const Core = require('./utils/core')
const Optimize = require('./utils/optimize')
const Triangle = require('./shapes/Triangle')
const State = require('./State')
const Logger = require('./utils/logger')

class Worker {
  constructor (targetBuffer, metadata) {
    this.target = targetBuffer
    this.buffer = Buffer.alloc(targetBuffer.length, 0)
    this.width = metadata.width
    this.height = metadata.height
  }

  init (currentBuffer, score) {
    this.current = currentBuffer
    this.score = score
    this.counter = 0
  }

  energy (shape, alpha) {
    this.counter++
    const scanlines = shape.rasterize()
    const color = Core.computeColor(this, scanlines, alpha)
    Core.copyLines(this, this.buffer, this.current, scanlines)
    Core.drawLines(this, this.buffer, color, scanlines)
    const diff = Core.differencePartial(this, this.target, this.current, this.buffer, this.score, scanlines)
    return diff
  }

  bestHillClimbState (t, a, n, age, m) {
    let bestEnergy, bestState
    let state, before, energy
    for (let i = 0; i < m; i++) {
      state = this.bestRandomState(t, a, n)
      before = state.energy()
      state = Optimize.hillClimb(state, age)
      energy = state.energy()
      Logger.vv(`${n} random: ${before.toFixed(6)} -> ${age} hill climb: ${energy.toFixed(6)}`)
      if (i === 0 || energy < bestEnergy) {
        bestEnergy = energy
        bestState = state
      }
    }
    return bestState
  }

  bestRandomState (t, a, n) {
    let bestEnergy, bestState
    let state, energy
    for (let i = 0; i < n; i++) {
      state = this.randomState(t, a)
      energy = state.energy()
      if (i === 0 || energy < bestEnergy) {
        bestEnergy = energy
        bestState = state
      }
    }
    return bestState
  }

  randomState (t, a) {
    return new State(this, new Triangle(this), a)
  }
}

module.exports = Worker
