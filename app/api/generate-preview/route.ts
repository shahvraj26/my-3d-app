import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json();
    
    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    // Run the Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'createPreview.py');
    const { stdout, stderr } = await execAsync(`python ${scriptPath} "${filename}"`);

    if (stderr) {
      console.error('Script error:', stderr);
      return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }

    return NextResponse.json({ success: true, output: stdout });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
} 