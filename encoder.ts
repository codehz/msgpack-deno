const storage = new ArrayBuffer(8);
const buffer = new DataView(storage);
const u8view = new Uint8Array(storage, 0, 1);
const u16view = new Uint8Array(storage, 0, 2);
const u32view = new Uint8Array(storage, 0, 4);
const u64view = new Uint8Array(storage, 0, 8);

const encoder = new TextEncoder();

const extmap = {
  1: 0xd4,
  2: 0xd5,
  4: 0xd6,
  8: 0xd7,
  16: 0xd8
};

export class MsgPackEncoder {
  private cache: number[] = [];

  constructor() {}

  putNil() {
    this.cache.push(0xC0);
  }

  putBool(flag: boolean) {
    this.cache.push(flag ? 0xC3 : 0xC2);
  }

  putInt(val: number) {
    if (val >= 0) {
      if (val <= 0x7F) {
        this.cache.push(val);
      } else if (val <= 0xFF) {
        this.cache.push(0xCC, val);
      } else if (val <= 0xFFFF) {
        buffer.setUint16(0, val, false);
        this.cache.push(0xCD, ...u16view);
      } else if (val <= 0xFFFFFFFF) {
        buffer.setUint32(0, val, false);
        this.cache.push(0xCE, ...u32view);
      } else {
        buffer.setBigUint64(0, BigInt(val), false);
        this.cache.push(0xCF, ...u64view);
      }
    } else {
      if (val >= -0x20) {
        this.cache.push(0x100 + val);
      } else if (val >= -0x80) {
        buffer.setInt8(0, val);
        this.cache.push(0xD0, ...u8view);
      } else if (val >= -0x8000) {
        buffer.setInt16(0, val, false);
        this.cache.push(0xD1, ...u16view);
      } else if (val >= -0x80000000) {
        buffer.setInt32(0, val, false);
        this.cache.push(0xD2, ...u32view);
      } else {
        buffer.setBigInt64(0, BigInt(val), false);
        this.cache.push(0xD3, ...u64view);
      }
    }
  }

  putFloat32(val: number) {
    buffer.setFloat32(0, val);
    this.cache.push(0xCA, ...u32view);
  }

  putFloat64(val: number) {
    buffer.setFloat64(0, val);
    this.cache.push(0xCB, ...u64view);
  }

  putString(val: string) {
    const encoded = encoder.encode(val);
    if (encoded.length < 0x20) {
      this.cache.push(0xA0 | encoded.length, ...encoded);
    } else if (encoded.length <= 0xFF) {
      this.cache.push(0xD9, encoded.length, ...encoded);
    } else if (encoded.length <= 0xFFFF) {
      buffer.setUint16(0, encoded.length, false);
      this.cache.push(0xDA, ...u16view, ...encoded);
    } else {
      buffer.setUint32(0, encoded.length, false);
      this.cache.push(0xDB, ...u32view, ...encoded);
    }
  }

  putBinary(val: ArrayBufferLike) {
    const encoded = new Uint8Array(val);
    if (encoded.length <= 0xFF) {
      this.cache.push(0xC4, encoded.length, ...encoded);
    } else if (encoded.length <= 0xFFFF) {
      buffer.setUint16(0, encoded.length, false);
      this.cache.push(0xC5, ...u16view, ...encoded);
    } else {
      buffer.setUint32(0, encoded.length, false);
      this.cache.push(0xC6, ...u32view, ...encoded);
    }
  }

  putArray(num: number) {
    if (num <= 0xF) {
      this.cache.push(0x90 | num);
    } else if (num <= 0xFFFF) {
      buffer.setUint16(0, num, false);
      this.cache.push(0xDC, ...u16view);
    } else {
      buffer.setUint32(0, num, false);
      this.cache.push(0xDD, ...u32view);
    }
  }

  putMap(num: number) {
    if (num <= 0xF) {
      this.cache.push(0x80 | num);
    } else if (num <= 0xFFFF) {
      buffer.setUint16(0, num, false);
      this.cache.push(0xDE, ...u16view);
    } else {
      buffer.setUint32(0, num, false);
      this.cache.push(0xDF, ...u32view);
    }
  }

  putExt(type: number, data: ArrayBufferLike) {
    const encoded = new Uint8Array(data);
    switch (encoded.length) {
      case 0:
        throw "Nil ext";
      case 1:
      case 2:
      case 4:
      case 8:
      case 16:
        this.cache.push(extmap[encoded.length], type, ...encoded);
        break;
      default:
        if (encoded.length <= 0xFF) {
          this.cache.push(0xC7, encoded.length, type, ...encoded);
        } else if (encoded.length <= 0xFFFF) {
          buffer.setUint16(0, encoded.length, false);
          this.cache.push(0xC8, ...u16view, type, ...encoded);
        } else {
          buffer.setUint32(0, encoded.length, false);
          this.cache.push(0xC9, ...u16view, type, ...encoded);
        }
        break;
    }
  }

  dump(rest: Uint8Array | undefined = undefined): Uint8Array {
    if (rest) {
      const u8 = new Uint8Array(this.cache.length + rest.length);
      u8.set(this.cache);
      u8.set(rest, this.cache.length);
      return u8;
    }
    return new Uint8Array(this.cache);
  }
}
