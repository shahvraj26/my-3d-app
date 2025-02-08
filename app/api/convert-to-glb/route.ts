// pages/api/convert-to-glb.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import util from 'util';

const execPromise = util.promisify(exec);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const form = formidable();
    const [fields, files] = await form.parse(req);
    const plyFile = files.ply[0];

    // Create temp directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ply-conversion-'));
    const tempPlyPath = path.join(tempDir, 'input.ply');
    const tempGlbPath = path.join(tempDir, 'output.glb');

    // Copy PLY to temp location
    await fs.copyFile(plyFile.filepath, tempPlyPath);

    // Convert PLY to GLB using your preferred conversion tool
    // This example uses meshlab-server, but you could use other tools like Open3D
    await execPromise(`meshlab-server -i ${tempPlyPath} -o ${tempGlbPath} -m sa`);

    // Read the GLB file
    const glbData = await fs.readFile(tempGlbPath);

    // Clean up temp files
    await fs.rm(tempDir, { recursive: true });

    // Send the GLB file
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Disposition', 'attachment; filename=model.glb');
    res.send(glbData);

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
}