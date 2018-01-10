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

  bestHillClimbState (shapeType, alpha, nrandom, age, nbest) {
    let bestEnergy, bestState
    let state, before, energy
    for (let i = 0; i < nbest; i++) {
      state = this.bestRandomState(shapeType, alpha, nrandom)
      before = state.energy()
      state = Optimize.hillClimb(state, age)
      energy = state.energy()
      Logger.vv(`${nrandom} random: ${before.toFixed(6)} -> ${age} hill climb: ${energy.toFixed(6)}`)
      if (i === 0 || energy < bestEnergy) {
        bestEnergy = energy
        bestState = state
      }
    }
    return bestState
  }

  bestRandomState (shapeType, alpha, nrandom) {
    let bestEnergy, bestState
    let state, energy
    for (let i = 0; i < nrandom; i++) {
      state = this.randomState(shapeType, alpha)
      energy = state.energy()
      if (i === 0 || energy < bestEnergy) {
        bestEnergy = energy
        bestState = state
      }
    }
    return bestState
  }

  randomState (shapeType, alpha) {
    switch (shapeType) {
      case 'triangle':
        return new State(this, new Triangle(this), alpha)
      default:
        throw Error(`Not implemented for type ${shapeType}.`)
    }
  }
}

module.exports = Worker
