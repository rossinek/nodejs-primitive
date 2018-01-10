'use strict'

const Utils = require('./utils/utils')

class State {
  constructor (worker, shape, alpha, mutateAlpha, score) {
    this.worker = worker
    this.shape = shape
    this.alpha = alpha || 128
    this.mutateAlpha = (mutateAlpha === undefined) ? !alpha : mutateAlpha
    this.score = (score === undefined) ? -1 : score
  }

  copy () {
    return new State(this.worker, this.shape.copy(), this.alpha, this.mutateAlpha, this.score)
  }

  energy () {
    if (this.score < 0) {
      this.score = this.worker.energy(this.shape, this.alpha)
    }
    return this.score
  }

  doMove () {
    const oldState = this.copy()
    this.shape.mutate()
    if (this.mutateAlpha) {
      this.alpha = Utils.clamp(this.alpha + Utils.randomInt(-10, 11), 1, 255)
    }
    this.score = -1
    return oldState
  }

  undoMove (oldState) {
    this.shape = oldState.shape
    this.alpha = oldState.alpha
    this.score = oldState.score
  }
}

module.exports = State
