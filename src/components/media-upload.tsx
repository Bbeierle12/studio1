'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import NextImage from 'next/image';
import { 
  Upload, 
  ImageIcon, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Camera,
  Wand2,
  Eye,
  Trash2,
  Download,
  Copy,
  X,
  Video,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
  uploadProgress?: number;
  uploaded?: boolean;
  error?: string;
  url?: string;
  transcription?: {
    text: string;
    confidence: number;
    isHandwritten: boolean;
    structuredRecipe?: {
      title?: string;
      ingredients?: string[];
      instructions?: string[];
      notes?: string;
    };
    processing?: boolean;
  };
}

export function MediaUpload() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [copiedText, setCopiedText] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: MediaFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 'document'
    }));

    setMediaFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10
  });

  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const transcribeImage = async (mediaFile: MediaFile) => {
    if (mediaFile.type !== 'image') return;

    setMediaFiles(prev => prev.map(f => 
      f.id === mediaFile.id ? { 
        ...f, 
        transcription: { 
          ...f.transcription,
          processing: true,
          text: '',
          confidence: 0,
          isHandwritten: false
        }
      } : f
    ));

    try {
      const formData = new FormData();
      formData.append('image', mediaFile.file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { 
            ...f, 
            transcription: {
              text: result.text,
              confidence: result.confidence,
              isHandwritten: result.isHandwritten,
              structuredRecipe: result.structuredRecipe,
              processing: false
            }
          } : f
        ));
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      setMediaFiles(prev => prev.map(f => 
        f.id === mediaFile.id ? { 
          ...f, 
          transcription: {
            ...f.transcription,
            processing: false,
            text: 'Transcription failed. Please try again.',
            confidence: 0,
            isHandwritten: false
          }
        } : f
      ));
    }
  };

  const uploadFiles = async () => {
    setUploading(true);
    
    for (const mediaFile of mediaFiles) {
      if (mediaFile.uploaded) continue;

      try {
        const formData = new FormData();
        formData.append('file', mediaFile.file);
        formData.append('type', mediaFile.type);

        // Update progress
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploadProgress: 50 } : f
        ));

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setMediaFiles(prev => prev.map(f => 
            f.id === mediaFile.id ? { 
              ...f, 
              uploadProgress: 100, 
              uploaded: true,
              url: result.url 
            } : f
          ));
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { 
            ...f, 
            error: 'Upload failed',
            uploadProgress: 0 
          } : f
        ));
      }
    }

    setUploading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-8 h-8" />;
      case 'video': return <Video className="w-8 h-8" />;
      default: return <FileText className="w-8 h-8" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Media Upload & AI Transcription</h1>
        <p className="text-muted-foreground">Upload photos of recipes and let AI transcribe them automatically - perfect for handwritten family recipes!</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload & Transcribe</TabsTrigger>
          <TabsTrigger value="gallery">Media Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragActive
                ? 'border-info bg-info-muted'
                : 'border-border hover:border-border'
              }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-info text-lg font-medium">Drop files here...</p>
              ) : (
                <>
                  <p className="text-muted-foreground text-lg mb-2">
                    Drag and drop recipe photos here, or click to select
                  </p>
                  <p className="text-muted-foreground text-sm">
                    AI will automatically transcribe recipe text from images
                  </p>
                </>
              )}
            </div>
          </div>

          {/* File List with Transcription */}
          {mediaFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">
                  Uploaded Files ({mediaFiles.length})
                </h2>
                <Button
                  onClick={uploadFiles}
                  disabled={uploading || mediaFiles.every(f => f.uploaded)}
                  className="bg-info hover:bg-info disabled:bg-muted"
                >
                  {uploading ? 'Uploading...' : 'Upload All'}
                </Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {mediaFiles.map((mediaFile) => (
                  <Card key={mediaFile.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center relative">
                      {mediaFile.type === 'image' && mediaFile.preview ? (
                        <NextImage
                          src={mediaFile.preview}
                          alt={mediaFile.file.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground">
                          {getFileIcon(mediaFile.type)}
                        </div>
                      )}
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(mediaFile.id)}
                        className="absolute top-2 right-2 bg-danger hover:bg-danger text-white p-1 rounded-full transition-colors"
                        title="Remove file"
                        aria-label="Remove uploaded file"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Status badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {mediaFile.uploaded && (
                          <Badge className="bg-success text-white text-xs">
                            ✓ Uploaded
                          </Badge>
                        )}
                        {mediaFile.transcription?.isHandwritten && (
                          <Badge className="bg-info text-white text-xs">
                            📝 Handwritten
                          </Badge>
                        )}
                        {mediaFile.error && (
                          <Badge className="bg-danger text-white text-xs">
                            ✗ Error
                          </Badge>
                        )}
                      </div>

                      {/* View button */}
                      {mediaFile.type === 'image' && (
                        <button
                          onClick={() => setSelectedFile(mediaFile)}
                          className="absolute bottom-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
                          title="View image"
                          aria-label="View image in full size"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {mediaFile.file.name}
                      </h3>
                      <div className="flex justify-between text-sm text-muted-foreground mb-3">
                        <span className="capitalize">{mediaFile.type}</span>
                        <span>{formatFileSize(mediaFile.file.size)}</span>
                      </div>

                      {/* Progress bar */}
                      {mediaFile.uploadProgress !== undefined && !mediaFile.uploaded && (
                        <div className="w-full bg-muted rounded-full h-2 mb-3">
                          <div
                            className={`bg-info h-2 rounded-full transition-all duration-300`}
                            // eslint-disable-next-line react/forbid-dom-props
                            style={{width: `${mediaFile.uploadProgress}%`} as React.CSSProperties}
                          ></div>
                        </div>
                      )}

                      {/* AI Transcription Section */}
                      {mediaFile.type === 'image' && (
                        <div className="space-y-3">
                          {!mediaFile.transcription ? (
                            <Button
                              onClick={() => transcribeImage(mediaFile)}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <Wand2 className="w-4 h-4 mr-2" />
                              AI Transcribe Recipe
                            </Button>
                          ) : mediaFile.transcription.processing ? (
                            <div className="text-center py-4">
                              <div className="animate-spin w-6 h-6 border-2 border-info border-t-transparent rounded-full mx-auto mb-2"></div>
                              <p className="text-sm text-muted-foreground">
                                AI is reading your recipe...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Transcribed Text
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(mediaFile.transcription.confidence * 100)}% confidence
                                  </Badge>
                                  <button
                                    onClick={() => copyToClipboard(mediaFile.transcription?.text || '')}
                                    className="text-info hover:text-info"
                                  >
                                    {copiedText === mediaFile.transcription.text ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="max-h-40 overflow-y-auto bg-muted p-3 rounded text-sm text-muted-foreground whitespace-pre-wrap">
                                {mediaFile.transcription.text}
                              </div>
                              
                              {/* Structured Recipe Display */}
                              {mediaFile.transcription.structuredRecipe && (
                                <div className="mt-3 p-3 bg-success-muted rounded border border-success/30">
                                  <h4 className="font-medium text-success mb-2 flex items-center gap-2">
                                    <Wand2 className="w-4 h-4" />
                                    AI Structured Recipe
                                  </h4>
                                  {mediaFile.transcription.structuredRecipe.title && (
                                    <div className="mb-2">
                                      <span className="font-medium text-success">Title: </span>
                                      <span className="text-success">{mediaFile.transcription.structuredRecipe.title}</span>
                                    </div>
                                  )}
                                  {mediaFile.transcription.structuredRecipe.ingredients && (
                                    <div className="mb-2">
                                      <span className="font-medium text-success">Ingredients:</span>
                                      <ul className="mt-1 text-sm text-success">
                                        {mediaFile.transcription.structuredRecipe.ingredients.map((ingredient, idx) => (
                                          <li key={idx} className="ml-4">• {ingredient}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {mediaFile.transcription.structuredRecipe.instructions && (
                                    <div className="mb-2">
                                      <span className="font-medium text-success">Instructions:</span>
                                      <ol className="mt-1 text-sm text-success">
                                        {mediaFile.transcription.structuredRecipe.instructions.map((instruction, idx) => (
                                          <li key={idx} className="ml-4">{idx + 1}. {instruction}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {mediaFile.uploaded && (
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(mediaFile.id)}
                          className="text-danger hover:text-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery">
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4" />
            <p>Media gallery coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Features Info */}
      <div className="mt-8 bg-card bg-[radial-gradient(120%_90%_at_80%_0%,hsl(var(--meal-dinner)/0.12)_0%,transparent_55%)] rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-info" />
          AI Transcription Features
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">📸 Recipe Photos</h4>
            <ul className="space-y-1">
              <li>• Automatic text extraction from images</li>
              <li>• Special handling for handwritten recipes</li>
              <li>• Confidence scoring for accuracy</li>
              <li>• Copy transcribed text with one click</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">🧠 Smart Processing</h4>
            <ul className="space-y-1">
              <li>• AI structures ingredients and instructions</li>
              <li>• Enhanced reasoning for cursive handwriting</li>
              <li>• Recipe title detection</li>
              <li>• Perfect for digitizing family recipes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedFile(null)}>
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-4 right-4 bg-card/80 hover:bg-card text-foreground p-2 rounded-full z-10"
              title="Close viewer"
              aria-label="Close image viewer"
            >
              <X className="w-6 h-6" />
            </button>
            <NextImage
              src={selectedFile.preview}
              alt={selectedFile.file.name}
              width={800}
              height={600}
              className="object-contain max-h-[90vh]"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaUpload;