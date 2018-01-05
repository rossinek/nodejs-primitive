'use strict'
// const Heatmap = require('./Heatmap')
const Core = require('./core')
const Optimize = require('./optimize')
const Triangle = require('./Triangle')
const State = require('./State')
const Logger = require('./logger')

class Worker {
  constructor (targetBuffer, metadata) {
    this.target = targetBuffer
    this.buffer = Buffer.alloc(targetBuffer.length, 0)
    this.width = metadata.width
    this.height = metadata.height
    // this.heatmap = new Heatmap(this.width, this.height)
  }

  init (currentBuffer, score) {
    this.current = currentBuffer
    this.score = score
    this.counter = 0
    // this.heatmap.clear()
  }

  energy (shape, alpha) {
    this.counter++
    const scanlines = shape.rasterize()
    // commented out in origin
    // this.heatmap.add(scanlines)
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
      // Logger.vv(`${n} random: ${before.toFixed(6)} -> ${age} hill climb: ${energy.toFixed(6)}`)
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
        // if(i !== 1) console.log('change', energy)
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
