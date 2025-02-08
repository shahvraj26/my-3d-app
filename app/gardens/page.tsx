"use client";
import ModelSelector from "@/components/ModelSelector";
import { useState } from "react";

export default function GardensPage() {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // First, upload the GLB file
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file to the models directory
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Generate preview
      const previewResponse = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: file.name }),
      });

      if (!previewResponse.ok) {
        throw new Error('Failed to generate preview');
      }

      // Refresh the page to show the new model
      window.location.reload();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">3D Model Gallery</h1>
        <div className="relative">
          <input
            type="file"
            accept=".glb"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Uploading...' : 'Add Model'}
          </label>
        </div>
      </div>
      <ModelSelector />
    </div>
  );
}