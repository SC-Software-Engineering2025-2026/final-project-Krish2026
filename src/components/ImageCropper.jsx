import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ImageCropper = ({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 4 / 3,
  cropShape = "rect",
  allowRatioChange = false,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedRatio, setSelectedRatio] = useState(aspectRatio);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleDone = () => {
    onCropComplete(croppedAreaPixels);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black p-4 flex items-center justify-between">
        <h2 className="text-white text-xl font-semibold">Crop Image</h2>
        <button
          onClick={onCancel}
          className="text-white hover:text-gray-300 transition"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Cropper */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={selectedRatio}
          cropShape={cropShape}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteInternal}
        />
      </div>

      {/* Controls */}
      <div className="bg-black p-6 space-y-4">
        {/* Aspect Ratio Selector - Only show if allowed */}
        {allowRatioChange && (
          <div className="flex flex-col items-center">
            <label className="text-white text-sm mb-3 block">
              Aspect Ratio
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedRatio(1 / 1)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedRatio === 1 / 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                1:1
              </button>
              <button
                type="button"
                onClick={() => setSelectedRatio(4 / 3)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedRatio === 4 / 3
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                4:3
              </button>
              <button
                type="button"
                onClick={() => setSelectedRatio(3 / 4)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedRatio === 3 / 4
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                3:4
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center">
          <label className="text-white text-sm mb-2 block">Zoom</label>
          <div className="relative w-[500px]">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #EDE8DD 0%, #EDE8DD ${((zoom - 1) / 2) * 100}%, white ${((zoom - 1) / 2) * 100}%, white 100%)`,
                outline: "none",
              }}
            />
            <style jsx>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #54524d;
                cursor: pointer;
              }
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #54524d;
                cursor: pointer;
                border: none;
              }
            `}</style>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
