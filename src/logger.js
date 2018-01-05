'use strict'

const MODE_SILENT = 0
const MODE_VERBOSE = 1
const MODE_VERY_VERBOSE = 2
module.exports = {
  mode: MODE_SILENT,
  init (args) {
    if (args.verbose) this.mode = MODE_VERBOSE
    if (args.veryVerbose) this.mode = MODE_VERY_VERBOSE
  },
  v (str) {
    if (this.mode >= MODE_VERBOSE) console.log(str)
  },
  vTime (str) {
    if (this.mode >= MODE_VERBOSE) console.time(`[timer] ${str}`)
  },
  vTimeEnd (str) {
    if (this.mode >= MODE_VERBOSE) console.timeEnd(`[timer] ${str}`)
  },
  vv (str) {
    if (this.mode >= MODE_VERY_VERBOSE) console.log(str)
  },
  vvTime (str) {
    if (this.mode >= MODE_VERY_VERBOSE) console.time(`[timer] ${str}`)
  },
  vvTimeEnd (str) {
    if (this.mode >= MODE_VERY_VERBOSE) console.timeEnd(`[timer] ${str}`)
  }
}
