import AutoBuffer from "./auto_buffer.ts";

const textDecoder = new TextDecoder();

class BadTypeError extends Error {
  constructor(type: string) {
    super(`Bad type ${type}`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface MsgPackExtensionData {
  type: number;
  data: Uint8Array;
}

export class MsgPackDecoder {
  private buffer: AutoBuffer;

  constructor(buffer: ArrayBufferLike) {
    this.buffer = new AutoBuffer(new DataView(buffer));
  }

  checkNil(): boolean {
    if (this.buffer.getUint(8) == 0xc0) {
      return true;
    }
    this.buffer.rollback();
    return false;
  }

  expectedBool(): boolean {
    let ret: boolean;
    switch (this.buffer.getUint(8)) {
      case 0xc2: // false
        ret = false;
        break;
      case 0xc3: // true
        ret = true;
        break;
      default:
        this.buffer.rollback();
        throw new BadTypeError("boolean");
    }
    return ret;
  }

  expectedBinary(): Uint8Array {
    let len: number;
    switch (this.buffer.getUint(8)) {
      case 0xc4: // bin 8
        len = this.buffer.getUint(8);
        break;
      case 0xc5: // bin 16
        len = this.buffer.getUint(16);
        break;
      case 0xc6: // bin 32
        len = this.buffer.getUint(32);
        break;
      default:
        this.buffer.rollback();
        throw new BadTypeError("binary");
    }
    return this.buffer.getBytes(len);
  }

  expectedExtension(): MsgPackExtensionData {
    let type: number;
    let len: number;
    switch (this.buffer.getUint(8)) {
      case 0xc7: // ext 8
        len = this.buffer.getUint(8);
        type = this.buffer.getInt(8);
        break;
      case 0xc8: // ext 16
        len = this.buffer.getUint(16);
        type = this.buffer.getInt(8);
        break;
      case 0xc9: // ext 32
        len = this.buffer.getUint(32);
        type = this.buffer.getInt(8);
        break;
      case 0xd4: // fixext 1
        len = 1;
        type = this.buffer.getInt(8);
        break;
      case 0xd5: // fixext 2
        len = 2;
        type = this.buffer.getInt(8);
        break;
      case 0xd6: // fixext 4
        len = 4;
        type = this.buffer.getInt(8);
        break;
      case 0xd7: // fixext 8
        len = 8;
        type = this.buffer.getInt(8);
        break;
      case 0xd8: // fixext 16
        len = 16;
        type = this.buffer.getInt(8);
        break;
      default:
        this.buffer.rollback();
        throw new BadTypeError("extension");
    }
    return {
      type,
      data: this.buffer.getBytes(len)
    };
  }

  expectedInteger(): number {
    const sig = this.buffer.getUint(8);
    switch (sig) {
      case 0xcc: // uint 8
        return this.buffer.getUint(8);
      case 0xcd: // uint 16
        return this.buffer.getUint(16);
      case 0xce: // uint 32
        return this.buffer.getUint(32);
      case 0xcf: // uint 64
        return this.buffer.getUint(64);
      case 0xd0: // int 8
        return this.buffer.getInt(8);
      case 0xd1: // int 16
        return this.buffer.getInt(16);
      case 0xd2: // int 32
        return this.buffer.getInt(32);
      case 0xd3: // int 64
        return this.buffer.getInt(64);
      default:
        // positive fixint
        if (sig <= 0x7F) return sig;
        // negative fixint
        if (sig >= 0xE0 && sig <= 0xFF) return sig - 0x100;
        this.buffer.rollback();
        throw new BadTypeError("number");
    }
  }

  expectedNumber(): number {
    const sig = this.buffer.getUint(8);
    switch (sig) {
      case 0xca: // float 32
        return this.buffer.getFloat(false);
      case 0xcb: // float 64
        return this.buffer.getFloat(true);
      case 0xcc: // uint 8
        return this.buffer.getUint(8);
      case 0xcd: // uint 16
        return this.buffer.getUint(16);
      case 0xce: // uint 32
        return this.buffer.getUint(32);
      case 0xcf: // uint 64
        return this.buffer.getUint(64);
      case 0xd0: // int 8
        return this.buffer.getInt(8);
      case 0xd1: // int 16
        return this.buffer.getInt(16);
      case 0xd2: // int 32
        return this.buffer.getInt(32);
      case 0xd3: // int 64
        return this.buffer.getInt(64);
      default:
        // positive fixint
        if (sig <= 0x7F) return sig;
        // negative fixint
        if (sig >= 0xE0 && sig <= 0xFF) return sig - 0x100;
        this.buffer.rollback();
        throw new BadTypeError("number");
    }
  }

  expectedString(): string {
    const sig = this.buffer.getUint(8);
    let len: number;
    switch (sig) {
      case 0xd9: // str 8
        len = this.buffer.getUint(8);
        break;
      case 0xda: // str 16
        len = this.buffer.getUint(16);
        break;
      case 0xdb: // str 32
        len = this.buffer.getUint(32);
        break;
      default:
        // fixstr
        if (sig >= 0xa0 && sig <= 0xbf) {
          len = sig & 0x1F;
          break;
        }
        this.buffer.rollback();
        throw new BadTypeError("string");
    }
    return textDecoder.decode(this.buffer.getBytes(len));
  }

  expectedArray(): number {
    const sig = this.buffer.getUint(8);
    switch (sig) {
      case 0xdc: // array 16
        return this.buffer.getUint(16);
      case 0xdd: // array 32
        return this.buffer.getUint(32);
      default:
        // fiarray
        if (sig >= 0x90 && sig <= 0x9f) return sig & 0xf;
        this.buffer.rollback();
        throw new BadTypeError("array");
    }
  }

  expectedMap(): number {
    const sig = this.buffer.getUint(8);
    switch (sig) {
      case 0xde: // map 16
        return this.buffer.getUint(16);
      case 0xdf: // map 32
        return this.buffer.getUint(32);
      default:
        // fixmap
        if (sig >= 0x80 && sig <= 0x8f) return sig & 0xf;
        this.buffer.rollback();
        throw new BadTypeError("array");
    }
  }

  getRest(): Uint8Array {
    return this.buffer.getRest();
  }
}
