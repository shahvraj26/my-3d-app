"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const ModelSelector = () => {
  const router = useRouter();
  const [models] = useState([
    { name: "EmptyRoom", preview: "/empty-room-preview.jpg" },
    { name: "room", preview: "/room-preview.jpg" },
  ]);

  const handleModelClick = (modelName: string) => {
    router.push(`/viewer/${modelName}`);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {models.map((model) => (
        <div
          key={model.name}
          onClick={() => handleModelClick(model.name)}
          className="cursor-pointer group"
        >
          <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
            <img
              src={`/api/placeholder/400/400`}
              alt={model.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <p className="text-center mt-2 text-gray-700 group-hover:text-gray-900">
            {model.name}
          </p>
        </div>
      ))}
    </div>
  );
}

export default ModelSelector;
