import { useRef, useState, useEffect, useCallback } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { Loader2, Plus, Minus, Grid2x2, Upload, Undo, Redo, Trash2, Settings, Info, Car, Table, Sofa, Lamp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@radix-ui/react-tooltip";

type FurnitureType = "chair" | "table" | "sofa" | "lamp";

export default function PolycamClone() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const [scene, setScene] = useState<BABYLON.Scene | null>(null);
  const [camera, setCamera] = useState<BABYLON.ArcRotateCamera | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<BABYLON.Mesh | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragStartPosition, setDragStartPosition] = useState<BABYLON.Vector3 | null>(null);
  
  const [activeTab, setActiveTab] = useState<'furniture' | 'models' | 'settings'>('furniture');
  const [showGrid, setShowGrid] = useState(true);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  // Define functions before they're used in UI
  const zoomIn = useCallback(() => {
    if (camera) camera.radius -= 100;
  }, [camera]);

  const zoomOut = useCallback(() => {
    if (camera) camera.radius += 100;
  }, [camera]);

  const addObject = useCallback((type: FurnitureType) => {
    if (!scene) return;

    BABYLON.SceneLoader.ImportMesh("", `./${type}.glb`, "", scene, (meshes) => {
      if (meshes[0] instanceof BABYLON.Mesh) {
        const newMesh = meshes[0];
        newMesh.position = new BABYLON.Vector3(0, 0.01, 0);
        newMesh.isPickable = true;
        
        const mainLight = scene.lights.find(light => 
          light instanceof BABYLON.DirectionalLight
        ) as BABYLON.DirectionalLight | undefined;
        
        if (mainLight) {
          const shadowGenerator = new BABYLON.ShadowGenerator(1024, mainLight);
          shadowGenerator.addShadowCaster(newMesh);
        }
        
        const highlightLayer = new BABYLON.HighlightLayer("highlightLayer", scene);
        newMesh.actionManager = new BABYLON.ActionManager(scene);
        
        newMesh.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            () => highlightLayer.addMesh(newMesh, BABYLON.Color3.Yellow())
          )
        );
        
        newMesh.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            () => highlightLayer.removeMesh(newMesh)
          )
        );
      }
    });
  }, [scene]);
  useEffect(() => {
    if (!canvasRef.current) return;
  
    // Dispose existing engine before creating a new one
    if (engineRef.current) {
      engineRef.current.dispose();
    }
  
    const engine = new BABYLON.Engine(canvasRef.current, true);
    engineRef.current = engine;
    const newScene = new BABYLON.Scene(engine);
    setScene(newScene);
  
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 15, new BABYLON.Vector3(0, 2, 0), newScene);
    camera.attachControl(canvasRef.current, true);
    setCamera(camera);
  
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), newScene);
    light.intensity = 1.5;
  
    // ✅ Fix: Ensure room.glb loads properly
    setLoading(true);
    BABYLON.SceneLoader.ImportMesh("", "./room.glb", "", newScene, (meshes) => {
      if (meshes.length === 0) {
        console.error("Room model failed to load.");
      } else {
        meshes.forEach(mesh => {
          mesh.position = new BABYLON.Vector3(0, 0, 0);
          mesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
        });
        console.log("Room model loaded successfully!");
      }
      setTimeout(() => setLoading(false), 500); // Prevents UI blocking
    });
  
    // Enable object dragging
    newScene.onPointerDown = (evt, pickInfo) => {
      if (pickInfo.hit && pickInfo.pickedMesh instanceof BABYLON.Mesh) {
        setSelectedMesh(pickInfo.pickedMesh);
      }
    };
  
    newScene.onPointerMove = () => {
      if (selectedMesh) {
        const pickInfo = newScene.pick(newScene.pointerX, newScene.pointerY);
        if (pickInfo.hit && pickInfo.pickedPoint) {
          selectedMesh.position.x = pickInfo.pickedPoint.x;
          selectedMesh.position.z = pickInfo.pickedPoint.z;
        }
      }
    };
  
    newScene.onPointerUp = () => setSelectedMesh(null);
  
    engine.runRenderLoop(() => {
      newScene.render();
    });
  
    window.addEventListener("resize", () => engine.resize());
  
    return () => {
      engine.dispose();
    };
  }, []);
  
  const renderSidebarContent = useCallback(() => {
    switch (activeTab) {
      case 'furniture':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(['chair', 'table', 'sofa', 'lamp'] as FurnitureType[]).map((item) => (
                <Card 
                  key={item}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedObject === item ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedObject(item);
                    addObject(item);
                  }}
                >
                 <CardContent className="p-3 flex flex-col items-center">
                    {/* ✅ Icons instead of thumbnails */}
                    {item === "chair" && <Car className="w-12 h-12 text-gray-700" />}
                    {item === "table" && <Table className="w-12 h-12 text-gray-700" />}
                    {item === "sofa" && <Sofa className="w-12 h-12 text-gray-700" />}
                    {item === "lamp" && <Lamp className="w-12 h-12 text-gray-700" />}
                    <p className="text-sm font-medium text-center mt-2 capitalize">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Recently Used</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(['chair', 'table'] as FurnitureType[]).map((item) => (
                  <img 
                    key={item}
                    src={`./${item}-thumbnail.png`}
                    alt={item}
                    className="w-16 h-16 rounded-md border border-gray-200 cursor-pointer hover:border-blue-500"
                    onClick={() => addObject(item)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'models':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Drag and drop your 3D models here</p>
              <p className="text-xs text-gray-500 mt-1">or</p>
              <input 
                type="file" 
                accept=".glb,.gltf" 
                className="hidden" 
                id="model-upload" 
              />
              <label
                htmlFor="model-upload"
                className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 text-sm"
              >
                Browse Files
              </label>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Your Models</h3>
              <p className="text-sm text-gray-500">No models uploaded yet</p>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">View Options</h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid2x2 className="w-4 h-4 mr-2" />
                Show Grid {showGrid ? 'On' : 'Off'}
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Camera Settings</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={zoomIn}>
                  Zoom In
                </Button>
                <Button variant="outline" size="sm" onClick={zoomOut}>
                  Zoom Out
                </Button>
              </div>
            </div>
          </div>
        );
    }
  }, [activeTab, showGrid, selectedObject, addObject, zoomIn, zoomOut]);

  // Rest of the component remains the same...
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">3D Room Editor</h1>
        </div>
        
        <div className="flex border-b border-gray-200">
          {['furniture', 'models', 'settings'].map((tab) => (
            <button
              key={tab}
              className={`flex-1 p-3 text-sm font-medium ${
                activeTab === tab 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {renderSidebarContent()}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b border-gray-200 bg-white px-4 flex items-center gap-2">
          <div className="flex gap-1">
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex gap-1">
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid2x2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Grid</TooltipContent>
            </Tooltip>
            </TooltipProvider>
            
            {selectedMesh && (
              <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Selected</TooltipContent>
              </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-50">
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="mt-2 text-sm text-gray-600">Loading scene...</p>
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} className="w-full h-full" />
          
          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={zoomIn}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={zoomOut}
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}