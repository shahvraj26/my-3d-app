"use client";
import { useRef, useState, useEffect } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { Loader2, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface BabylonViewerProps {
  modelName: string;
}

export default function BabylonViewer({ modelName }: BabylonViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scene, setScene] = useState<BABYLON.Scene | null>(null);
  const [camera, setCamera] = useState<BABYLON.ArcRotateCamera | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<BABYLON.AbstractMesh | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !modelName) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    setScene(scene);

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 3,
      15,
      new BABYLON.Vector3(-100, 200, -100),
      scene
    );
    camera.setPosition(new BABYLON.Vector3(-1000, 250, -1000));
    camera.attachControl(canvasRef.current, true);
    setCamera(camera);

    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1.5;

    // Load Model based on the modelName prop
    BABYLON.SceneLoader.ImportMesh(
      "",
      `/models/${modelName}.glb`,
      "",
      scene,
      (meshes) => {
        meshes.forEach((mesh) => {
          mesh.position = new BABYLON.Vector3(0, 0, 0);
          mesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
        });
        setLoading(false);
      }
    );

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
  }, [modelName]); // Add modelName to dependency array

  // Movement Controls
  const moveCamera = (direction: 'forward' | 'backward' | 'left' | 'right') => {
    if (!camera) return;
    
    const moveDistance = 100; // Adjust this value to change movement distance
    
    // Get the camera's forward direction but zero out the Y component to keep movement horizontal
    const forward = camera.getTarget().subtract(camera.position);
    forward.y = 100; // This keeps movement parallel to the ground
    forward.normalize();
    
    // Get the right vector (perpendicular to forward)
    const left = BABYLON.Vector3.Cross(forward, BABYLON.Vector3.Up()).normalize();
    
    // Create movement vector based on direction
    let movement = new BABYLON.Vector3(0, 0, 0);
  
    switch (direction) {
      case 'forward':
        movement = forward.scale(moveDistance);
        break;
      case 'backward':
        movement = forward.scale(-moveDistance);
        break;
      case 'left':
        movement = left.scale(moveDistance);
        break;
      case 'right':
        movement = left.scale(-moveDistance);
        break;
    }

    const originalPositionY = camera.position.y;
    const originalTargetY = camera.target.y;
  
    // Apply movement to both camera position and target
    camera.position.addInPlace(movement);
    camera.target.addInPlace(movement);

    // Restore the original Y values to maintain height
    camera.position.y = 200;
    camera.target.y = 200;
  };

  // Zoom Controls
  const zoomIn = () => {
    if (camera) camera.radius -= 300;
  };

  const zoomOut = () => {
    if (camera) camera.radius += 300;
  };

  // Add Objects (Chairs / Tables)
  const addObject = (type: "chair" | "table") => {
    if (!scene) return;

    BABYLON.SceneLoader.ImportMesh("", `./${type}.glb`, "", scene, (meshes) => {
      const newMesh = meshes[0];
      newMesh.position = new BABYLON.Vector3(0, 0, 0);
      newMesh.isPickable = true;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#fdfaf1]">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between p-4 bg-white shadow-md">
        <div className="text-xl font-bold text-gray-900">Polycam Clone</div>
        <div className="flex gap-6">
          <button className="text-gray-700 hover:text-black">Explore</button>
          <button className="text-gray-700 hover:text-black">Tools</button>
          <button className="text-gray-700 hover:text-black">Learn</button>
          <button className="px-4 py-2 text-white bg-black rounded-lg">Sign Up</button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-grow">
        {/* Left Panel - Model Selection */}
        <div className="w-1/4 p-4 border-r border-gray-300 bg-white">
          <h2 className="text-lg font-semibold mb-4">Add Objects</h2>
          <div className="flex flex-col gap-4">
            <div className="cursor-pointer" onClick={() => addObject("chair")}>
              <img src="./chair-thumbnail.png" alt="Chair" className="w-full rounded-lg border border-gray-300 hover:scale-105 transition-transform" />
              <p className="text-center mt-2 text-gray-700">Chair</p>
            </div>
            <div className="cursor-pointer" onClick={() => addObject("table")}>
              <img src="./table-thumbnail.png" alt="Table" className="w-full rounded-lg border border-gray-300 hover:scale-105 transition-transform" />
              <p className="text-center mt-2 text-gray-700">Table</p>
            </div>
          </div>
        </div>

        {/* Babylon.js 3D Viewer */}
        <div className="flex-grow flex items-center justify-center bg-gray-100 relative">
          {loading && <Loader2 className="w-12 h-12 animate-spin text-gray-700" />}
          <canvas ref={canvasRef} className="w-full h-full" />
          
          {/* Movement Controls */}
          <div className="absolute bottom-20 right-4 grid grid-cols-3 gap-2">
            <div></div>
            <button onClick={() => moveCamera('forward')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg">
              <ArrowUp className="w-5 h-5" />
            </button>
            <div></div>
            <button onClick={() => moveCamera('left')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => moveCamera('backward')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg">
              <ArrowDown className="w-5 h-5" />
            </button>
            <button onClick={() => moveCamera('right')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Zoom Controls */}
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