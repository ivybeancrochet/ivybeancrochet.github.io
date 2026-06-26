#!/usr/bin/env node
const https = require('https');
const fs = require('fs/promises');
const path = require('path');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');

function requestJson(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET', headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Cloudinary API request failed with ${res.statusCode}: ${body}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Could not parse Cloudinary response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const query = new URLSearchParams({
    type: 'upload',
    prefix: 'pat/',
    max_results: '500',
  });

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${query}`;
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  const response = await requestJson(url, headers);
  const resources = Array.isArray(response.resources) ? response.resources : [];

  const collectionsMap = new Map();

  resources.forEach((resource) => {
    const publicId = resource.public_id;
    if (!publicId || !publicId.startsWith('pat/')) {
      return;
    }

    const name = publicId
      .replace(/^pat\//, '')
      .replace(/-\d+$/, '');

    if (!name) {
      return;
    }

    const version = resource.version;
    const versionString = version ? `v${version}` : null;
    const existing = collectionsMap.get(name);

    if (!existing || (versionString && existing.version && versionString > existing.version)) {
      collectionsMap.set(name, { name, version: versionString });
    }
  });

  const collections = Array.from(collectionsMap.values())
    .filter((entry) => entry.version)
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Discovered ${collections.length} collection entries. The site now uses the built-in collection list instead of collections.json.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
