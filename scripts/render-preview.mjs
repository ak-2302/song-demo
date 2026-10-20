import { mkdir, readFile, writeFile } from 'node:fs/promises';

const input = JSON.parse(process.env.RENDER_INPUT || '{}');
const outputDir = process.env.RENDER_OUTPUT || 'render-output';
const mode = input.mode === 'proposed' ? 'proposed' : 'base';
const sampleRate = 22050;
const seconds = 2;
const samples = sampleRate * seconds;
const data = Buffer.alloc(44 + samples * 2);
const text = (offset, value) => data.write(value, offset, 'ascii');
text(0, 'RIFF'); data.writeUInt32LE(36 + samples * 2, 4); text(8, 'WAVE'); text(12, 'fmt ');
data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
data.writeUInt32LE(sampleRate, 24); data.writeUInt32LE(sampleRate * 2, 28);
data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); text(36, 'data'); data.writeUInt32LE(samples * 2, 40);
const root = mode === 'proposed' ? 220 : 196;
for (let index = 0; index < samples; index += 1) {
  const time = index / sampleRate;
  const envelope = Math.min(1, time * 16) * Math.min(1, (seconds - time) * 16);
  const tone = Math.sin(2 * Math.PI * root * time) * 0.18 + Math.sin(2 * Math.PI * root * 1.5 * time) * (mode === 'proposed' ? 0.1 : 0.04);
  data.writeInt16LE(Math.round(tone * envelope * 32767), 44 + index * 2);
}
await mkdir(outputDir, { recursive: true });
await writeFile(`${outputDir}/${mode}.wav`, data);
await writeFile(`${outputDir}/${mode}.json`, JSON.stringify({ mode, rendererVersion: 'github-actions-preview-0.1.0', engineCommit: input.engine_commit, baseSha: input.base_sha, headSha: input.head_sha }, null, 2));
console.log(`rendered ${mode} preview with fixed renderer`);
