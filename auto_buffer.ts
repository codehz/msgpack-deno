export default class AutoBuffer {
  private view: DataView;
  private count: number = 0;
  private last: number = -1;

  constructor(view: DataView) {
    this.view = view;
  }

  getRest(): Uint8Array {
    return new Uint8Array(this.view.buffer, this.count);
  }

  rollback() {
    if (this.last === -1) throw new RangeError("no history");
    this.last = -1;
    this.count = this.last;
  }

  getFloat(is64: boolean): number {
    this.last = this.count;
    if (is64) {
      const ret = this.view.getFloat64(this.count, false);
      this.count += 8;
      return ret;
    } else {
      const ret = this.view.getFloat32(this.count, false);
      this.count += 4;
      return ret;
    }
  }

  getInt(bit: number): number {
    let ret = 0;
    switch (bit) {
      case 8:
        ret = this.view.getInt8(this.count);
        break;
      case 16:
        ret = this.view.getInt16(this.count);
        break;
      case 32:
        ret = this.view.getInt32(this.count);
        break;
      case 64:
        ret = Number(this.view.getBigInt64(this.count));
        break;
      default:
        throw "unexpected";
    }
    this.last = this.count;
    this.count += bit / 8 | 0;
    return ret;
  }

  getUint(bit: number): number {
    let ret = 0;
    switch (bit) {
      case 8:
        ret = this.view.getUint8(this.count);
        break;
      case 16:
        ret = this.view.getUint16(this.count);
        break;
      case 32:
        ret = this.view.getUint32(this.count);
        break;
      case 64:
        ret = Number(this.view.getBigUint64(this.count));
        break;
      default:
        throw "unexpected";
    }
    this.last = this.count;
    this.count += bit / 8 | 0;
    return ret;
  }

  getBytes(bytes: number): Uint8Array {
    const ret = new Uint8Array(this.view.buffer, this.count, bytes);
    this.last = this.count;
    this.count += bytes;
    return ret;
  }
}
