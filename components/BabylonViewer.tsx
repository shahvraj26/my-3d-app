"use client";

import { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const models = [
  { name: "Orange Chair", path: "./3d-orangechair-1.glb", position: new BABYLON.Vector3(0, 0, 0) },
  { name: "Blue Sofa", path: "./3d-armchair.glb", position: new BABYLON.Vector3(2, 0, 0) },
  { name: "Modern Table", path: "./3d-orangechair.glb", position: new BABYLON.Vector3(-2, 0, 0) },
];

export default function BabylonViewer() {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 4,
      Math.PI / 3,
      10,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
    light.intensity = 0.8;

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
    ground.receiveShadows = true;

    // Load multiple models
    let loadedCount = 0;
    models.forEach((model) => {
      BABYLON.SceneLoader.ImportMesh("", model.path, "", scene, (meshes) => {
        meshes.forEach((mesh) => {
          mesh.position = model.position;
          mesh.isPickable = true;
          if (!mesh.actionManager) {
            mesh.actionManager = new BABYLON.ActionManager(scene);
          }
          mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (evt) => {
              const pickedMesh = evt.meshUnderPointer;
              if (pickedMesh && pickedMesh.actionManager) {
                pickedMesh.actionManager.registerAction(
                  new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (moveEvt) => {
                    pickedMesh.position.x += moveEvt.sourceEvent.movementX * 0.01;
                    pickedMesh.position.z += moveEvt.sourceEvent.movementY * 0.01;
                  })
                );
              }
            })
          );
        });
        loadedCount++;
        if (loadedCount === models.length) setLoading(false);
      });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => engine.resize());

    return () => {
      engine.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-900 p-4">
      <Card className="w-full max-w-4xl p-6 bg-gray-800 shadow-xl rounded-3xl text-white">
        <CardContent className="relative flex flex-col items-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-3xl">
              <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
          )}
          <canvas ref={canvasRef} className="w-full h-[500px] rounded-xl shadow-lg" />
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold">
            Reset Scene
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
