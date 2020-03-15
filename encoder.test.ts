import { MsgPackEncoder } from "./encoder.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

function buildTest(
  name: string,
  action: (enc: MsgPackEncoder) => void,
  expected: ArrayLike<number>
) {
  Deno.test(name, () => {
    const enc = new MsgPackEncoder();
    action(enc);
    assertEquals(enc.dump(), new Uint8Array(expected));
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

buildTest("nil", enc => enc.putNil(), [0xc0]);

buildTest("bool - false", enc => enc.putBool(false), [0xc2]);
buildTest("bool - true", enc => enc.putBool(true), [0xc3]);

buildTest(
  "binary - empty",
  enc => enc.putBinary(new Uint8Array()),
  [0xc4, 0x00]
);
buildTest(
  "binary - small",
  enc => enc.putBinary(new Uint8Array([0x01, 0x02, 0x03])),
  [0xc4, 0x03, 0x01, 0x02, 0x03]
);
buildTest(
  "binary - mid",
  enc => enc.putBinary(new Uint8Array(test_binary)),
  [0xc4, 0x28, ...test_binary]
);
buildTest(
  "binary - large",
  enc => enc.putBinary(new Uint8Array(test_large_binary)),
  [0xc5, 0x01, 0x90, ...test_large_binary]
);

buildTest("fixnum 0", enc => enc.putInt(0), [0]);
buildTest("fixnum 127", enc => enc.putInt(127), [127]);
buildTest("fixnum -5", enc => enc.putInt(-5), [0xFB]);
buildTest("fixnum -32", enc => enc.putInt(-32), [0xE0]);

buildTest("number 128", enc => enc.putInt(128), [0xCC, 0x80]);
buildTest("number 255", enc => enc.putInt(255), [0xCC, 0xFF]);
buildTest("number 256", enc => enc.putInt(256), [0xCD, 0x01, 0x00]);
buildTest("number 65535", enc => enc.putInt(65535), [0xCD, 0xFF, 0xFF]);
buildTest(
  "number 65536",
  enc => enc.putInt(65536),
  [0xCE, 0x00, 0x01, 0x00, 0x00]
);
buildTest(
  "number 2147483647",
  enc => enc.putInt(2147483647),
  [0xCE, 0x7F, 0xFF, 0xFF, 0xFF]
);
buildTest(
  "number 2147483648",
  enc => enc.putInt(2147483648),
  [0xCE, 0x80, 0x00, 0x00, 0x00]
);
buildTest(
  "number 4294967295",
  enc => enc.putInt(4294967295),
  [0xCE, 0xFF, 0xFF, 0xFF, 0xFF]
);

buildTest("number -33", enc => enc.putInt(-33), [0xD0, 0xDF]);
buildTest("number -128", enc => enc.putInt(-128), [0xD0, 0x80]);
buildTest("number -256", enc => enc.putInt(-256), [0xD1, 0xFF, 0x00]);
buildTest("number -32768", enc => enc.putInt(-32768), [0xD1, 0x80, 0x00]);
buildTest(
  "number -65536",
  enc => enc.putInt(-65536),
  [0xD2, 0xFF, 0xFF, 0x00, 0x00]
);
buildTest(
  "number -2147483648",
  enc => enc.putInt(-2147483648),
  [0xD2, 0x80, 0x00, 0x00, 0x00]
);

buildTest(
  "float32 0.5",
  enc => enc.putFloat32(0.5),
  [0xCA, 0x3F, 0x00, 0x00, 0x00]
);
buildTest(
  "float32 -0.5",
  enc => enc.putFloat32(-0.5),
  [0xCA, 0xBF, 0x00, 0x00, 0x00]
);
buildTest(
  "float64 0.5",
  enc => enc.putFloat64(0.5),
  [0xCB, 0x3F, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
);
buildTest(
  "float64 -0.5",
  enc => enc.putFloat64(-0.5),
  [0xCB, 0xBF, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
);

buildTest("string empty", enc => enc.putString(""), [0xA0]);
buildTest("string a", enc => enc.putString("a"), [0xA1, 0x61]);
buildTest(
  "string 1234567890123456789012345678901",
  enc => enc.putString("1234567890123456789012345678901"),
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
  ]
);
buildTest(
  "string 12345678901234567890123456789012",
  enc => enc.putString("12345678901234567890123456789012"),
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
  ]
);
buildTest(
  "string 汉字",
  enc => enc.putString("汉字"),
  [0xa6, 0xe6, 0xb1, 0x89, 0xe5, 0xad, 0x97]
);

buildTest("array empty", enc => enc.putArray(0), [0x90]);
buildTest("array [1]", enc => {
  enc.putArray(1);
  enc.putInt(1);
}, [0x91, 0x1]);
buildTest(
  "array [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]",
  enc => {
    enc.putArray(15);
    for (let i = 0; i < 15; i++) {
      enc.putInt(i + 1);
    }
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
  ]
);

buildTest(
  "array [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]",
  enc => {
    enc.putArray(16);
    for (let i = 0; i < 16; i++) {
      enc.putInt(i + 1);
    }
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
  ]
);
buildTest("array ['a']", enc => {
  enc.putArray(1);
  enc.putString("a");
}, [0x91, 0xa1, 0x61]);

buildTest("map empty", enc => enc.putMap(0), [0x80]);
buildTest("map { a -> 1 }", enc => {
  enc.putMap(1);
  enc.putString("a");
  enc.putInt(1);
}, [0x81, 0xa1, 0x61, 0x01]);
