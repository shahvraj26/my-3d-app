import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    console.log('Received video file:', videoFile.name, videoFile.size, 'bytes');

    const GPU_SERVER_URL = 'http://192.222.54.160:8000';
    const gpuResponse = await fetch(`${GPU_SERVER_URL}/process-room`, {
      method: 'POST',
      body: formData,
    });

    console.log('GPU server response status:', gpuResponse.status);
    console.log('GPU server response headers:', Object.fromEntries(gpuResponse.headers));
    
    const data = await gpuResponse.json();
    console.log('GPU server response data:', data);

    // Get PLY file
    const plyResponse = await fetch(`${GPU_SERVER_URL}/result/${data.session_id}`);
    console.log('PLY response status:', plyResponse.status);
    console.log('PLY response headers:', Object.fromEntries(plyResponse.headers));
    
    const plyData = await plyResponse.arrayBuffer();
    console.log('PLY file size:', plyData.byteLength, 'bytes');

    return new NextResponse(plyData, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="model.ply"'
      }
    });
  } catch (error) {
    console.error('Error in process-room:', error);
    return NextResponse.json(
      { error: 'Failed to process room', details: error.message },
      { status: 500 }
    );
  }
}