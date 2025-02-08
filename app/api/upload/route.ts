import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to public/models directory
    const filename = file.name.toLowerCase();
    const filepath = path.join(process.cwd(), 'public', 'models', filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in upload:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
} 