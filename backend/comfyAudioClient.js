const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { Readable } = require('stream');
const { randomUUID } = require('crypto');
const { getMoodFilters } = require('./config/moods');

const WORKFLOW_PATH = path.join(__dirname, 'audio-workflow.json');
const WORKFLOW = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));

// Configuration for timeouts and retries
const REQUEST_TIMEOUT = 30000; // 30 seconds
const WS_TIMEOUT = 120000; // 2 minutes for audio generation
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

function buildPrompt(text) {
  const prompt = JSON.parse(JSON.stringify(WORKFLOW));
  if (prompt['1'] && prompt['1'].inputs && Object.prototype.hasOwnProperty.call(prompt['1'].inputs, 'text')) {
    prompt['1'].inputs.text = text;
  }
  return prompt;
}

async function queuePrompt(prompt, host, clientId, retries = 0) {
  try {
    await axios.post(`http://${host}/prompt`, { prompt, client_id: clientId }, {
      timeout: REQUEST_TIMEOUT
    });
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
      return queuePrompt(prompt, host, clientId, retries + 1);
    }
    throw new Error(`Failed to queue prompt after ${MAX_RETRIES} retries: ${error.message}`);
  }
}

function waitForResult(host, clientId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${host}/ws?clientId=${clientId}`);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout waiting for audio generation'));
    }, WS_TIMEOUT);

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'executed' && data.data?.output?.audio?.length) {
          clearTimeout(timeout);
          ws.close();
          resolve(data.data.output.audio[0]);
        } else if (data.type === 'execution_error') {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(`ComfyUI execution error: ${JSON.stringify(data.data)}`));
        }
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket error: ${err.message}`));
    });
  });
}

async function fetchAudio(host, fileInfo, retries = 0) {
  try {
    const url = `http://${host}/view?filename=${encodeURIComponent(fileInfo.filename)}&subfolder=${fileInfo.subfolder}&type=${fileInfo.type}`;
    const { data } = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: REQUEST_TIMEOUT
    });
    return Buffer.from(data);
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
      return fetchAudio(host, fileInfo, retries + 1);
    }
    throw new Error(`Failed to fetch audio after ${MAX_RETRIES} retries: ${error.message}`);
  }
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function generateAndStream(text, res, host = '127.0.0.1:8188', mood = '') {
  const clientId = randomUUID();
  const prompt = buildPrompt(text);

  await queuePrompt(prompt, host, clientId);
  const fileInfo = await waitForResult(host, clientId);
  const audioBuffer = await fetchAudio(host, fileInfo);

  const audioStream = bufferToStream(audioBuffer);
  const filters = getMoodFilters(mood);

  ffmpeg(audioStream)
    .setFfmpegPath(ffmpegPath)
    .inputOptions(['-f wav'])
    .complexFilter(filters)
    .audioChannels(2)
    .audioCodec('aac')
    .audioBitrate('128k')
    .format('adts')
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      if (!res.headersSent) {
        res.status(500).end('Error processing audio');
      }
    })
    .pipe(res);
}

// Health check function
async function checkComfyHealth(host) {
  try {
    await axios.get(`http://${host}/system_stats`, { timeout: 5000 });
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = { generateAndStream, checkComfyHealth };
