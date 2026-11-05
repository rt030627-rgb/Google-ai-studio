import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Minimal pure Node.js PNG encoder using built-in zlib
 */
function createPng(width: number, height: number, rgbaBuffer: Uint8Array): Buffer {
  // CRC32 calculation table
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function writeChunk(type: string, data: Buffer): Buffer {
    const chunk = Buffer.alloc(8 + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const typeAndData = chunk.subarray(4, 8 + data.length);
    chunk.writeUInt32BE(crc32(typeAndData), 8 + data.length);
    return chunk;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = writeChunk('IHDR', ihdrData);

  // Raw Scanlines with Filter type 0 (None)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let scanlineOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[scanlineOffset++] = 0; // Filter: None
    const rowOffset = y * width * 4;
    for (let x = 0; x < width * 4; x++) {
      scanlines[scanlineOffset++] = rgbaBuffer[rowOffset + x];
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = writeChunk('IDAT', compressed);

  // IEND
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Creates 32x32 RGBA pixel buffer from ASCII art / palette map
 */
function createRasterFromGrid(
  width: number,
  height: number,
  grid: string[],
  palette: Record<string, [number, number, number, number]>
): Uint8Array {
  const buf = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const row = grid[y] || '';
    for (let x = 0; x < width; x++) {
      const char = row[x] || '.';
      const rgba = palette[char] || [0, 0, 0, 0];
      const idx = (y * width + x) * 4;
      buf[idx] = rgba[0];
      buf[idx + 1] = rgba[1];
      buf[idx + 2] = rgba[2];
      buf[idx + 3] = rgba[3];
    }
  }
  return buf;
}

// -------------------------------------------------------------
// 1. CLAUDE LOGO: 32x32 Terracotta Badge with White Sunburst
// -------------------------------------------------------------
const CLAUDE_PALETTE: Record<string, [number, number, number, number]> = {
  '.': [0, 0, 0, 0],             // transparent
  '#': [115, 42, 28, 255],        // dark terracotta border
  'b': [209, 107, 82, 255],       // main terracotta fill
  'l': [225, 122, 96, 255],       // lighter terracotta highlight
  'w': [255, 255, 255, 255],      // white spark
  'c': [255, 243, 235, 255],      // soft cream ray edge
  's': [240, 205, 190, 255],      // shaded ray pixel
};

const CLAUDE_GRID = [
  "....########################....",
  "..##bbbbbbbbbbbbbbbbbbbbbbbb##..",
  ".#bbbbbbbbbbbbbbbbbbbbbbbbbbbb#.",
  ".#bbbbbbbbbbbbwwbbbbbbbbbbbbbb#.",
  "#bbbbbbbbbbbbswwbbwbbbbbbbbbbbb#",
  "#bbbbbbbbbbbbwwwbwwwbbbbbbbbbbb#",
  "#bbbbbwbwbbbbwwwbwwwbbbbwbbbbbb#",
  "#bbbbwwwwbbbbwwwbwwwbbswwbbbbbb#",
  "#bbbbswwwbbbbwwwbwwwbbwwwbbbbbb#",
  "#bbbbbwwwwbbswwwbwwwbwwwwbbbbbb#",
  "#bbbbbbwwwwbwwwwbwwwwwwwbbbbbbb#",
  "#bbbbbbswwwwwwwwwwwwwwwwbbbbbbb#",
  "#bbbbbbbswwwwwwwwwwwwwwbbbbbbbb#",
  "#bbswwwwwwwwwwwwwwwwwwwwwwsbbbb#",
  "#bbwwwwwwwwwwwwwwwwwwwwwwwwwsbb#",
  "#bbbbswwwwwwwwwwwwwwwwwwwwwsbbb#",
  "#bbbbbbbswwwwwwwwwwwwwwwbbbbbbb#",
  "#bbbbbbwwwwwwwwwwwwwwwwwwbbbbbb#",
  "#bbbbbwwwwbswwwwbwwwwswwwwbbbbb#",
  "#bbbbwwwwbbswwwwbwwwbbswwwbbbbb#",
  "#bbbbwwwsbbbwwwwbwwwbbbswwbbbbb#",
  "#bbbbswsbbbbwwwwbwwwbbbbswbbbbb#",
  "#bbbbbbbbbbbwwwwbwwwbbbbbbbbbbb#",
  "#bbbbbbbbbbbwwwwbwwwbbbbbbbbbbb#",
  "#bbbbbbbbbbbwwwwbswwbbbbbbbbbbb#",
  "#bbbbbbbbbbbswwwbbswbbbbbbbbbbb#",
  "#bbbbbbbbbbbbwwwbbbbbbbbbbbbbbb#",
  "#bbbbbbbbbbbbswwbbbbbbbbbbbbbbb#",
  ".#bbbbbbbbbbbbswbbbbbbbbbbbbbb#.",
  ".#bbbbbbbbbbbbbbbbbbbbbbbbbbbb#.",
  "..##bbbbbbbbbbbbbbbbbbbbbbbb##..",
  "....########################....",
];

// -------------------------------------------------------------
// 2. CHATGPT LOGO: 32x32 Sage-Teal Badge with White Rosette Knot
// -------------------------------------------------------------
const GPT_PALETTE: Record<string, [number, number, number, number]> = {
  '.': [0, 0, 0, 0],             // transparent
  '#': [38, 77, 68, 255],         // dark sage-teal border
  'b': [114, 169, 154, 255],      // main sage-teal fill
  'l': [135, 186, 172, 255],      // light teal highlight
  'w': [255, 255, 255, 255],      // crisp white rosette line
  'm': [225, 245, 238, 255],      // soft mint white shading
};

const GPT_GRID = [
  "....########################....",
  "..##bbbbbbbbbbbbbbbbbbbbbbbb##..",
  ".#bbbbbbbbbbbbbbbbbbbbbbbbbbbb#.",
  ".#bbbbbbbbbbbbbbbbbbbbbbbbbbbb#.",
  "#bbbbbbbbbbbbwwwwbbbbbbbbbbbbbb#",
  "#bbbbbbbbbbwwbbbbwwbbbbbbbbbbbb#",
  "#bbbbbbbbbwwbbwwbbwwbbbbbbbbbbb#",
  "#bbbbbbbbwwbbwwwwbbwwbbbbbbbbbb#",
  "#bbbbbbwwbbbbwwwwbbbbwwbbbbbbbb#",
  "#bbbbbwwbbwwwwbbwwwwbbwwbbbbbbb#",
  "#bbbbbwwbwwwwbbbbwwwwbwwbbbbbbb#",
  "#bbbbwwbwwbbbbbbbbbbwwbwwbbbbbb#",
  "#bbbbwwbwwbbwwwwwwbbwwbwwbbbbbb#",
  "#bbbwwbbwwbwwbbbbwwbwwbbwwbbbbb#",
  "#bbbwwbbwwbwwbbbbwwbwwbbwwbbbbb#",
  "#bbbwwbbwwbwwbbbbwwbwwbbwwbbbbb#",
  "#bbbwwbbwwbwwbbbbwwbwwbbwwbbbbb#",
  "#bbbwwbbwwbwwbbbbwwbwwbbwwbbbbb#",
  "#bbbbwwbwwbbwwwwwwbbwwbwwbbbbbb#",
  "#bbbbwwbwwbbbbbbbbbbwwbwwbbbbbb#",
  "#bbbbbwwbwwwwbbbbwwwwbwwbbbbbbb#",
  "#bbbbbwwbbwwwwbbwwwwbbwwbbbbbbb#",
  "#bbbbbbwwbbbbwwwwbbbbwwbbbbbbbb#",
  "#bbbbbbbbwwbbwwwwbbwwbbbbbbbbbb#",
  "#bbbbbbbbbwwbbwwbbwwbbbbbbbbbbb#",
  "#bbbbbbbbbbwwbbbbwwbbbbbbbbbbbb#",
  "#bbbbbbbbbbbbwwwwbbbbbbbbbbbbbb#",
  "#bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb#",
  ".#bbbbbbbbbbbbbbbbbbbbbbbbbbbb#.",
  ".#bbbbbbbbbbbbbbbbbbbbbbbbbbbb#.",
  "..##bbbbbbbbbbbbbbbbbbbbbbbb##..",
  "....########################....",
];

// -------------------------------------------------------------
// 3. DEEPSEEK WHALE: 32x32 Cute Blue Pixel Whale Mascot
// Note: In this base grid, the whale's head is on the LEFT,
//       white belly on lower-left, and tail flukes up on RIGHT.
// -------------------------------------------------------------
const DEEPSEEK_PALETTE: Record<string, [number, number, number, number]> = {
  '.': [0, 0, 0, 0],             // transparent
  '#': [22, 32, 90, 255],         // dark navy outline
  'B': [68, 108, 255, 255],       // primary royal blue
  'H': [120, 155, 255, 255],      // dorsal / fluke highlight blue
  'D': [45, 78, 210, 255],        // shaded deep blue
  'W': [255, 255, 255, 255],      // pure white belly / eye
  'w': [210, 228, 255, 255],      // soft belly shadow
};

const DEEPSEEK_GRID = [
  "..................##............",
  ".................#HH#...#H#.....",
  ".................#BBB#.#BBH#....",
  "..........#####..#BBBB#BBBB#....",
  "........##HHHHH#..#BBBBBBBD#....",
  "......##BBBBBBB#...#BBBBBBD#....",
  "....##BBBBBBBBB#...#BBBBBBD#....",
  "...#BBBBBBBBBBB#....#BBBBBD#....",
  "..#BBBBBBBBBBBBB####BBBBBBBD#...",
  ".#BBBBBBBBBBBBBBBBBBBBBBBBBD#...",
  ".#BBBBBBBBBBBBBBBBBBBBBBBBBD#...",
  "#BBBBBBBBBBBBBBBBBBBBBBBBBBD#...",
  "#BBWWWWWWBBBBBBBBBBBBBBBBBBD#...",
  "#BWWWWWWWWBBBBBBBBB#BBBBBBBD#...",
  "#BWWWWWWWWWBBBBBBBB##BBBBBBD#...",
  "#BWWWWWWWWWWBBBBBBBB#BBBBBBD#...",
  "#BWWWWWWWWWWBBBBBBBB#BBBBBD#....",
  "#BWWWWWWWWWWBBBBBBBB#BBBBBD#....",
  ".#WWWWWWWWWWWBBBBBBB#BBBBD#.....",
  ".#BWWWWWWWWWWBBBBBBB#BBBD#......",
  "..#BWWWWWWWWWBBBBBBB#BBD#.......",
  "...#BWWWWWWWWBBBBBB##BD#........",
  "....#BBWWWWWWBBBBBB#D#..........",
  ".....##BBWWWWBBBBBB##...........",
  ".......##BBWWBBBB##..#H#........",
  ".........######BB#..#BBB##......",
  "...............###..#BBBBB#.....",
  ".....................######.....",
  "................................",
  "................................",
  "................................",
  "................................",
];

const targetDir = path.join(process.cwd(), 'public/assets/aistudio');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Generate PNG buffers
const claudeBuf = createRasterFromGrid(32, 32, CLAUDE_GRID, CLAUDE_PALETTE);
const claudePng = createPng(32, 32, claudeBuf);
fs.writeFileSync(path.join(targetDir, 'claude-logo-20261026-213714-preview.png'), claudePng);

const gptBuf = createRasterFromGrid(32, 32, GPT_GRID, GPT_PALETTE);
const gptPng = createPng(32, 32, gptBuf);
fs.writeFileSync(path.join(targetDir, 'chatgpt-logo-20261026-213226.png'), gptPng);

const deepseekBuf = createRasterFromGrid(32, 32, DEEPSEEK_GRID, DEEPSEEK_PALETTE);
const deepseekPng = createPng(32, 32, deepseekBuf);
fs.writeFileSync(path.join(targetDir, 'deepseek-whale-20261026-191209-preview.png'), deepseekPng);

console.log('Successfully generated authentic pixel art PNGs:');
console.log('- claude-logo-20261026-213714-preview.png');
console.log('- chatgpt-logo-20261026-213226.png');
console.log('- deepseek-whale-20261026-191209-preview.png');
