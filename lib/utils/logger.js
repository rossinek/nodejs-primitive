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
  log (str) {
    console.log(str)
  },
  error (e) {
    console.error(e)
  },
  time (str) {
    console.time(str)
  },
  timeEnd (str) {
    console.timeEnd(str)
  },
  v (str) {
    if (this.mode >= MODE_VERBOSE) this.log(str)
  },
  vTime (str) {
    if (this.mode >= MODE_VERBOSE) this.time(`[timer] ${str}`)
  },
  vTimeEnd (str) {
    if (this.mode >= MODE_VERBOSE) this.timeEnd(`[timer] ${str}`)
  },
  vv (str) {
    if (this.mode >= MODE_VERY_VERBOSE) this.log(str)
  },
  vvTime (str) {
    if (this.mode >= MODE_VERY_VERBOSE) this.time(`[timer] ${str}`)
  },
  vvTimeEnd (str) {
    if (this.mode >= MODE_VERY_VERBOSE) this.timeEnd(`[timer] ${str}`)
  }
}
