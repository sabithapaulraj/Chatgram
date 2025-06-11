import React, { useState, useRef } from 'react';
import { Image, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelected, 
  selectedImage,
  onClear
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleClear = () => {
    setPreviewUrl(null);
    onClear();
  };
  
  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {previewUrl ? (
        <div className="relative mb-2">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-32 rounded-md object-contain" 
          />
          <button 
            onClick={handleClear}
            className="absolute -top-2 -right-2 bg-gray-800 dark:bg-gray-700 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Image size={20} />
        </button>
      )}
    </div>
  );
};
