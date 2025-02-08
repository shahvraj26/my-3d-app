// app/components/RoomScanner.tsx

'use client'

import { useState } from 'react'

export default function RoomScanner() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return
    
    setIsProcessing(true)
    try {
      const video = event.target.files[0]
      // Here you would add code to split video into frames
      // For now, let's assume we have an array of image files
      
      const formData = new FormData()
      // Add each frame to formData
      // frames.forEach((frame, index) => {
      //   formData.append('images', frame, `frame-${index}.jpg`)
      // })

      const response = await fetch('/api/process-room', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        // Handle success - maybe show the 3D model
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleVideoUpload}
        disabled={isProcessing}
      />
      {isProcessing && <p>Processing your room scan...</p>}
    </div>
  )
}