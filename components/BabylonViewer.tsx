"use client";

import { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const models = [
  { name: "Orange Chair", path: "./3d-orangechair-1.glb", position: new BABYLON.Vector3(0, 0, 0) },
  { name: "Blue Sofa", path: "./3d-armchair.glb", position: new BABYLON.Vector3(2, 0, 0) },
  { name: "Modern Table", path: "./3d-orangechair.glb", position: new BABYLON.Vector3(-2, 0, 0) },
];

export default function BabylonViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMesh, setSelectedMesh] = useState<BABYLON.AbstractMesh | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 4,
      Math.PI / 3,
      10,
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
    light.intensity = 1.2;

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
    ground.receiveShadows = true;

    let loadedCount = 0;
    models.forEach((model) => {
      BABYLON.SceneLoader.ImportMesh("", model.path, "", scene, (meshes) => {
        meshes.forEach((mesh) => {
          mesh.position = model.position;
          mesh.isPickable = true;
          mesh.actionManager = new BABYLON.ActionManager(scene);
          mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, () => {
              setSelectedMesh(mesh);
            })
          );
        });
        loadedCount++;
        if (loadedCount === models.length) setLoading(false);
      });
    });

    const handlePointerMove = () => {
      if (selectedMesh) {
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
        if (pickInfo.hit && pickInfo.pickedPoint) {
          selectedMesh.position.x = pickInfo.pickedPoint.x;
          selectedMesh.position.z = pickInfo.pickedPoint.z;
        }
      }
    };

    scene.onPointerMove = handlePointerMove;
    scene.onPointerUp = () => setSelectedMesh(null);

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => engine.resize());

    return () => {
      engine.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gradient-to-b from-gray-900 to-black p-6">
      <Card className="w-full max-w-4xl p-6 bg-gray-800 shadow-2xl rounded-3xl text-white border border-gray-700">
        <CardHeader className="text-center text-2xl font-bold text-white mb-4">
          3D Model Viewer
        </CardHeader>
        <CardContent className="relative flex flex-col items-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-3xl">
              <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
          )}
          <canvas ref={canvasRef} className="w-full h-[500px] rounded-xl shadow-lg border border-gray-700" />
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-transform hover:scale-105">
            Reset Scene
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
