import { useRef, useState, useEffect } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { Loader2, Plus, Minus, Upload } from "lucide-react";

export default function PolycamClone() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scene, setScene] = useState<BABYLON.Scene | null>(null);
  const [camera, setCamera] = useState<BABYLON.ArcRotateCamera | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<BABYLON.AbstractMesh | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    setScene(scene);

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 15, new BABYLON.Vector3(0, 2, 0), scene);
    camera.attachControl(canvasRef.current, true);
    setCamera(camera);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.5;

    // Enable object dragging
    scene.onPointerDown = (evt, pickInfo) => {
      if (pickInfo.hit && pickInfo.pickedMesh) {
        setSelectedMesh(pickInfo.pickedMesh);
      }
    };

    scene.onPointerMove = (evt) => {
      if (selectedMesh) {
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
        if (pickInfo.hit && pickInfo.pickedPoint) {
          selectedMesh.position.x = pickInfo.pickedPoint.x;
          selectedMesh.position.z = pickInfo.pickedPoint.z;
        }
      }
    };

    scene.onPointerUp = () => setSelectedMesh(null);

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => engine.resize());

    return () => {
      engine.dispose();
    };
  }, []);

  // Zoom Controls
  const zoomIn = () => {
    if (camera) camera.radius -= 100;
  };

  const zoomOut = () => {
    if (camera) camera.radius += 100;
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Upload started");
    const file = event.target.files?.[0];
    if (!file || !scene) {
        console.log("No file selected or scene not ready");
        return;
    }

    setLoading(true);

    try {
        const formData = new FormData();
        formData.append('video', file);

        const response = await fetch('/api/process-room', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        // Get the PLY data as a blob
        const plyBlob = await response.blob();
        
        // Convert blob to array buffer
        const arrayBuffer = await plyBlob.arrayBuffer();
        
        // Create a data URL from the PLY content
        const plyUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/octet-stream' }));
        
        // Clear existing meshes except ground and lights
        scene.meshes.forEach(mesh => {
            if (mesh.name !== "ground" && !mesh.name.includes("light")) {
                mesh.dispose();
            }
        });

        // Load the PLY file using Babylon's PLY loader
        BABYLON.SceneLoader.ImportMesh("", "", plyUrl, scene, 
            (meshes) => {
                // Successfully loaded the PLY
                console.log("PLY loaded successfully", meshes);
                
                // Center the model
                const rootMesh = meshes[0];
                const boundingBox = rootMesh.getBoundingInfo().boundingBox;
                const center = boundingBox.centerWorld;
                
                // Adjust position to center
                rootMesh.position = new BABYLON.Vector3(-center.x, -center.y, -center.z);
                
                // Adjust camera to focus on the model
                if (camera) {
                    camera.setTarget(BABYLON.Vector3.Zero());
                    camera.alpha = Math.PI / 2;
                    camera.beta = Math.PI / 3;
                    
                    // Set camera radius based on model size
                    const diagonal = boundingBox.maximumWorld.subtract(boundingBox.minimumWorld).length();
                    camera.radius = diagonal * 1.5;
                }
                
                setLoading(false);
            },
            (progressEvent) => {
                // Loading progress
                console.log("Loading progress: ", progressEvent);
            },
            (error) => {
                // Error handling
                console.error("Error loading PLY:", error);
                setLoading(false);
            },
            ".ply"
        );

    } catch (error) {
        console.error('Error during upload:', error);
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#fdfaf1]">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between p-4 bg-white shadow-md">
        <div className="text-xl font-bold text-gray-900">RoomScAN</div>
        <div className="flex gap-6">
          <button className="text-gray-700 hover:text-black">Explore</button>
          <button className="text-gray-700 hover:text-black">Tools</button>
          <button className="text-gray-700 hover:text-black">Learn</button>
          <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
          />
          <label
              htmlFor="video-upload"
              className="px-4 py-2 text-white bg-black rounded-lg cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Video
          </label>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-grow">
        {/* Left Panel - Model Selection */}
        <div className="w-1/4 p-4 border-r border-gray-300 bg-white">
          <h2 className="text-lg font-semibold mb-4">Add Objects</h2>
          <div className="flex flex-col gap-4">
            <div className="cursor-pointer">
              <img src="./chair-thumbnail.png" alt="Chair" className="w-full rounded-lg border border-gray-300 hover:scale-105 transition-transform" />
              <p className="text-center mt-2 text-gray-700">Chair</p>
            </div>
            <div className="cursor-pointer">
              <img src="./table-thumbnail.png" alt="Table" className="w-full rounded-lg border border-gray-300 hover:scale-105 transition-transform" />
              <p className="text-center mt-2 text-gray-700">Table</p>
            </div>
          </div>
        </div>

        {/* Babylon.js 3D Viewer */}
        <div className="flex-grow flex items-center justify-center bg-gray-100 relative">
          {loading && <Loader2 className="w-12 h-12 animate-spin text-gray-700" />}
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button onClick={zoomIn} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg">
              <Plus className="w-5 h-5" />
            </button>
            <button onClick={zoomOut} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg">
              <Minus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Panel - Upload Models */}
        <div className="w-1/4 p-4 border-l border-gray-300 bg-white">
          <h2 className="text-lg font-semibold mb-4">Upload 3D Model</h2>
          <input type="file" accept=".glb,.gltf" className="hidden" id="model-upload" />
          <label
            htmlFor="model-upload"
            className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            Select 3D Model
          </label>
        </div>
      </div>
    </div>
  );
}