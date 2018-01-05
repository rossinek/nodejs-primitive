'use strict'

module.exports = {
  hillClimb (argstate, maxAge) {
    const state = argstate.copy()
    let bestState = state.copy()
    let bestEnergy = state.energy()
    let undo, energy
    let step = 0
    for (let age = 0; age < maxAge; age++) {
      undo = state.doMove()
      energy = state.energy()
      if (energy >= bestEnergy) {
        state.undoMove(undo)
      } else {
        bestEnergy = energy
        bestState = state.copy()
        age = -1
      }
      step++
    }
    return bestState
  },

  preAnneal(argstate, iterations) {
    const state = argstate.copy()
    let previous = state.energy()
    let total = 0
    for (let i = 0; i < iterations; i++) {
      state.doMove()
      energy = state.energy()
      total += Math.abs(energy - previous)
      previous = energy
    }
    return total / iterations
  },

  anneal (argstate, maxTemp, minTemp, steps) {
    const factor = -Math.log(maxTemp / minTemp)
    const state = state.copy()
    let bestState = state.copy()
    let bestEnergy = state.energy()
    let previousEnergy = bestEnergy
    let pct, temp, undo, energy, change
    for (let step = 0; step < steps; step++) {
      pct = step / (steps-1)
      temp = maxTemp * Math.exp(factor * pct)
      undo = state.doMove()
      energy = state.energy()
      change = energy - previousEnergy
      if (change > 0 && Math.exp(-change / temp) < Math.random()) {
        state.undoMove(undo)
      } else {
        previousEnergy = energy
        if (energy < bestEnergy) {
          bestEnergy = energy
          bestState = state.copy()
        }
      }
    }
    return bestState
  }
}
