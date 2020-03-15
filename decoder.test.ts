import { MsgPackDecoder } from "./decoder.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

function buildTest<T>(
  name: string,
  action: (dec: MsgPackDecoder) => T,
  source: ArrayLike<number>,
  expected: T
) {
  Deno.test("decoder " + name, () => {
    const dec = new MsgPackDecoder(new Uint8Array(source));
    assertEquals(action(dec), expected);
  });
}

const test_binary = Array.from(
  { length: 40 },
  () => Math.floor(Math.random() * 256)
);
const test_large_binary = Array.from(
  { length: 400 },
  () => Math.floor(Math.random() * 256)
);

buildTest("nil", dec => dec.checkNil(), [0xc0], true);

buildTest("bool - false", dec => dec.expectedBool(), [0xc2], false);
buildTest("bool - true", dec => dec.expectedBool(), [0xc3], true);

buildTest(
  "binary - empty",
  dec => dec.expectedBinary(),
  [0xc4, 0x00],
  new Uint8Array()
);
buildTest(
  "binary - small",
  dec => dec.expectedBinary(),
  [0xc4, 0x03, 0x01, 0x02, 0x03],
  new Uint8Array([0x01, 0x02, 0x03])
);
buildTest(
  "binary - mid",
  dec => dec.expectedBinary(),
  [0xc4, 0x28, ...test_binary],
  new Uint8Array(test_binary)
);
buildTest(
  "binary - large",
  dec => dec.expectedBinary(),
  [0xc5, 0x01, 0x90, ...test_large_binary],
  new Uint8Array(test_large_binary)
);

buildTest("fixnum 0", dec => dec.expectedInteger(), [0], 0);
buildTest("fixnum 127", dec => dec.expectedInteger(), [127], 127);
buildTest("fixnum -5", dec => dec.expectedInteger(), [0xFB], -5);
buildTest("fixnum -32", dec => dec.expectedInteger(), [0xE0], -32);

buildTest("number 128", dec => dec.expectedInteger(), [0xCC, 0x80], 128);
buildTest("number 255", dec => dec.expectedInteger(), [0xCC, 0xFF], 255);
buildTest("number 256", dec => dec.expectedInteger(), [0xCD, 0x01, 0x00], 256);
buildTest(
  "number 65535",
  dec => dec.expectedInteger(),
  [0xCD, 0xFF, 0xFF],
  65535
);
buildTest(
  "number 65536",
  dec => dec.expectedInteger(),
  [0xCE, 0x00, 0x01, 0x00, 0x00],
  65536
);
buildTest(
  "number 2147483647",
  dec => dec.expectedInteger(),
  [0xCE, 0x7F, 0xFF, 0xFF, 0xFF],
  2147483647
);
buildTest(
  "number 2147483648",
  dec => dec.expectedInteger(),
  [0xCE, 0x80, 0x00, 0x00, 0x00],
  2147483648
);
buildTest(
  "number 4294967295",
  dec => dec.expectedInteger(),
  [0xCE, 0xFF, 0xFF, 0xFF, 0xFF],
  4294967295
);

buildTest("number -33", dec => dec.expectedInteger(), [0xD0, 0xDF], -33);
buildTest("number -128", dec => dec.expectedInteger(), [0xD0, 0x80], -128);
buildTest(
  "number -256",
  dec => dec.expectedInteger(),
  [0xD1, 0xFF, 0x00],
  -256
);
buildTest(
  "number -32768",
  dec => dec.expectedInteger(),
  [0xD1, 0x80, 0x00],
  -32768
);
buildTest(
  "number -65536",
  dec => dec.expectedInteger(),
  [0xD2, 0xFF, 0xFF, 0x00, 0x00],
  -65536
);
buildTest(
  "number -2147483648",
  dec => dec.expectedInteger(),
  [0xD2, 0x80, 0x00, 0x00, 0x00],
  -2147483648
);

buildTest(
  "float32 0.5",
  dec => dec.expectedNumber(),
  [0xCA, 0x3F, 0x00, 0x00, 0x00],
  0.5
);
buildTest(
  "float32 -0.5",
  dec => dec.expectedNumber(),
  [0xCA, 0xBF, 0x00, 0x00, 0x00],
  -0.5
);
buildTest(
  "float64 0.5",
  dec => dec.expectedNumber(),
  [0xCB, 0x3F, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  0.5
);
buildTest(
  "float64 -0.5",
  dec => dec.expectedNumber(),
  [0xCB, 0xBF, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  -0.5
);

buildTest("string empty", dec => dec.expectedString(), [0xA0], "");
buildTest("string a", dec => dec.expectedString(), [0xA1, 0x61], "a");

buildTest(
  "string 1234567890123456789012345678901",
  dec => dec.expectedString(),
  [
    0xbf,
    0x31,
    0x32,
    0x33,
    0x34,
    0x35,
    0x36,
    0x37,
    0x38,
    0x39,
    0x30,
    0x31,
    0x32,
    0x33,
    0x34,
    0x35,
    0x36,
    0x37,
    0x38,
    0x39,
    0x30,
    0x31,
    0x32,
    0x33,
    0x34,
    0x35,
    0x36,
    0x37,
    0x38,
    0x39,
    0x30,
    0x31
  ],
  "1234567890123456789012345678901"
);
buildTest(
  "string 12345678901234567890123456789012",
  dec => dec.expectedString(),
  [
    0xd9,
    0x20,
    0x31,
    0x32,
    0x33,
    0x34,
    0x35,
    0x36,
    0x37,
    0x38,
    0x39,
    0x30,
    0x31,
    0x32,
    0x33,
    0x34,
    0x35,
    0x36,
    0x37,
    0x38,
    0x39,
    0x30,
    0x31,
    0x32,
    0x33,
    0x34,
    0x35,
    0x36,
    0x37,
    0x38,
    0x39,
    0x30,
    0x31,
    0x32
  ],
  "12345678901234567890123456789012"
);
buildTest(
  "string 汉字",
  dec => dec.expectedString(),
  [0xa6, 0xe6, 0xb1, 0x89, 0xe5, 0xad, 0x97],
  "汉字"
);

buildTest("array empty", dec => dec.expectedArray(), [0x90], 0);
buildTest(
  "array [1]",
  dec => [dec.expectedArray(), dec.expectedInteger()],
  [0x91, 0x1],
  [1, 1]
);
buildTest(
  "array [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]",
  dec => {
    const len = dec.expectedArray();
    const ret: [number, number[]] = [len, []];
    for (let i = 0; i < len; i++) {
      ret[1].push(dec.expectedInteger());
    }
    return ret;
  },
  [
    0x9f,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f
  ],
  [15, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]]
);
buildTest(
  "array [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]",
  dec => {
    const len = dec.expectedArray();
    const ret: [number, number[]] = [len, []];
    for (let i = 0; i < len; i++) {
      ret[1].push(dec.expectedInteger());
    }
    return ret;
  },
  [
    0xDC,
    0x00,
    0x10,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f,
    0x10
  ],
  [16, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]]
);
buildTest(
  "array ['a']",
  dec => [dec.expectedArray(), dec.expectedString()],
  [0x91, 0xa1, 0x61],
  [1, "a"]
);
buildTest("map empty", dec => dec.expectedMap(), [0x80], 0);
buildTest(
  "map { a -> 1 }",
  dec => [dec.expectedMap(), dec.expectedString(), dec.expectedInteger()],
  [0x81, 0xa1, 0x61, 0x01],
  [1, "a", 1]
);
