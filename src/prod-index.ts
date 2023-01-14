// production index
import type {NT} from "./types"

export class ProdIndex {
  constructor(
    public nt: NT,
    public seqIdx = 0,
    public symIdx = 0,
  ) {
  }

  nextSym() {
    this.symIdx++
    return this
  }

  prevSym() {
    this.symIdx--
    return this
  }

  nextSeq() {
    this.seqIdx++
    this.symIdx = 0
    return this
  }

  clone() {
    return new ProdIndex(this.nt, this.seqIdx, this.symIdx)
  }
}
