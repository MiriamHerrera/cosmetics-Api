'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, Image, X } from 'lucide-react';

interface DragAndDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export default function DragAndDropZone({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  maxFiles = 10,
  disabled = false,
  className = ''
}: DragAndDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Limpiar el input para permitir seleccionar el mismo archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const baseClasses = `
    relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
    ${isDragOver ? 'border-blue-500 bg-blue-100 scale-105' : 'border-gray-300 bg-gray-50'}
    ${className}
  `;

  return (
    <div
      className={baseClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Contenido visual */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className={`p-3 rounded-full ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
            {isDragOver ? (
              <Upload className="w-8 h-8 text-blue-600" />
            ) : (
              <Image className="w-8 h-8 text-gray-600" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className={`text-lg font-medium ${isDragOver ? 'text-blue-700' : 'text-gray-700'}`}>
            {isDragOver ? 'Suelta las imágenes aquí' : 'Arrastra y suelta imágenes aquí'}
          </h3>
          
          <p className="text-sm text-gray-500">
            o <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
          </p>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Máximo {maxFiles} archivos</p>
            <p>• Formatos: JPG, PNG, WebP, GIF</p>
            <p>• Tamaño máximo: 5MB por imagen</p>
          </div>
        </div>

        {/* Indicador de arrastre */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg border-2 border-blue-500 border-dashed flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-700 font-medium text-lg">Suelta para subir</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
