import React, { useState, useRef, useCallback } from "react";
import { 
  Image as ImageIcon, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Quote,
  Trash2,
  GripVertical,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ContentBlock {
  id: string;
  type: 'paragraph' | 'image' | 'heading' | 'list' | 'quote';
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  imageAlign?: 'left' | 'center' | 'right';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  level?: number; // for headings
  listType?: 'bullet' | 'numbered'; // for lists
}

interface DragDropContentEditorProps {
  content: ContentBlock[];
  onChange: (content: ContentBlock[]) => void;
  onImageInsert?: (afterBlockId?: string) => void;
  placeholder?: string;
  className?: string;
}

export function DragDropContentEditor({
  content,
  onChange,
  onImageInsert,
  placeholder = "Start writing...",
  className = ""
}: DragDropContentEditorProps) {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
    const newContent = content.map(block => 
      block.id === id ? { ...block, ...updates } : block
    );
    onChange(newContent);
  }, [content, onChange]);

  const deleteBlock = useCallback((id: string) => {
    const newContent = content.filter(block => block.id !== id);
    onChange(newContent);
  }, [content, onChange]);

  const addBlock = useCallback((type: ContentBlock['type'], afterId?: string) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: type === 'paragraph' ? '' : undefined,
      level: type === 'heading' ? 2 : undefined,
      listType: type === 'list' ? 'bullet' : undefined,
    };

    if (afterId) {
      const index = content.findIndex(block => block.id === afterId);
      const newContent = [...content];
      newContent.splice(index + 1, 0, newBlock);
      onChange(newContent);
    } else {
      onChange([...content, newBlock]);
    }
  }, [content, onChange]);

  const moveBlock = useCallback((fromId: string, toId: string) => {
    const fromIndex = content.findIndex(block => block.id === fromId);
    const toIndex = content.findIndex(block => block.id === toId);
    
    if (fromIndex === -1 || toIndex === -1) return;

    const newContent = [...content];
    const [movedBlock] = newContent.splice(fromIndex, 1);
    newContent.splice(toIndex, 0, movedBlock);
    onChange(newContent);
  }, [content, onChange]);

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDragOverBlock(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverBlock(blockId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverBlock(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    if (draggedBlock && draggedBlock !== targetId) {
      moveBlock(draggedBlock, targetId);
    }
    
    setDraggedBlock(null);
    setDragOverBlock(null);
  };

  const handleImageDrop = (e: React.DragEvent, afterBlockId?: string) => {
    e.preventDefault();
    
    // Check if dropping an image from external source
    const imageUrl = e.dataTransfer.getData('text/uri-list');
    if (imageUrl && imageUrl.startsWith('http')) {
      const newBlock: ContentBlock = {
        id: generateId(),
        type: 'image',
        imageUrl,
        imageAlign: 'center',
        imageSize: 'medium',
        imageCaption: ''
      };

      if (afterBlockId) {
        const index = content.findIndex(block => block.id === afterBlockId);
        const newContent = [...content];
        newContent.splice(index + 1, 0, newBlock);
        onChange(newContent);
      } else {
        onChange([...content, newBlock]);
      }
    }
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    const isBeingDragged = draggedBlock === block.id;
    const isDragTarget = dragOverBlock === block.id;

    return (
      <div
        key={block.id}
        className={`group relative transition-all ${
          isBeingDragged ? 'opacity-50' : ''
        } ${
          isDragTarget ? 'ring-2 ring-blue-500' : ''
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragEnd={handleDragEnd}
        onDragEnter={(e) => handleDragEnter(e, block.id)}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, block.id)}
      >
        {/* Drag Handle */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => deleteBlock(block.id)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Block Content */}
        <Card className="mb-4">
          <CardContent className="p-4">
            {block.type === 'paragraph' && (
              <div>
                <Textarea
                  value={block.content || ''}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder="Write your paragraph..."
                  className="border-none p-0 resize-none min-h-[80px] focus-visible:ring-0"
                  onDrop={(e) => handleImageDrop(e, block.id)}
                  onDragOver={(e) => e.preventDefault()}
                />
                <BlockControls blockId={block.id} onAddBlock={addBlock} onImageInsert={onImageInsert} />
              </div>
            )}

            {block.type === 'heading' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={block.level || 2}
                    onChange={(e) => updateBlock(block.id, { level: parseInt(e.target.value) })}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={1}>H1</option>
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                </div>
                <Input
                  value={block.content || ''}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder="Heading text..."
                  className={`border-none p-0 font-bold ${
                    block.level === 1 ? 'text-3xl' : 
                    block.level === 2 ? 'text-2xl' : 'text-xl'
                  } focus-visible:ring-0`}
                />
                <BlockControls blockId={block.id} onAddBlock={addBlock} onImageInsert={onImageInsert} />
              </div>
            )}

            {block.type === 'image' && (
              <div>
                <div className="space-y-4">
                  {block.imageUrl ? (
                    <div className={`flex ${
                      block.imageAlign === 'center' ? 'justify-center' :
                      block.imageAlign === 'right' ? 'justify-end' : 'justify-start'
                    }`}>
                      <div className={`${
                        block.imageSize === 'small' ? 'w-1/4' :
                        block.imageSize === 'medium' ? 'w-1/2' :
                        block.imageSize === 'large' ? 'w-3/4' : 'w-full'
                      }`}>
                        <img 
                          src={block.imageUrl} 
                          alt={block.imageCaption || 'Content image'}
                          className="w-full h-auto rounded"
                        />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center"
                      onDrop={(e) => handleImageDrop(e)}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Drop an image here or{' '}
                        <Button 
                          variant="link" 
                          className="p-0 h-auto"
                          onClick={() => onImageInsert?.(block.id)}
                        >
                          browse CDN
                        </Button>
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Input
                      value={block.imageCaption || ''}
                      onChange={(e) => updateBlock(block.id, { imageCaption: e.target.value })}
                      placeholder="Image caption..."
                      className="text-sm"
                    />
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Align:</span>
                        <div className="flex border rounded">
                          {(['left', 'center', 'right'] as const).map((align) => (
                            <Button
                              key={align}
                              size="sm"
                              variant={block.imageAlign === align ? "default" : "ghost"}
                              onClick={() => updateBlock(block.id, { imageAlign: align })}
                              className="px-2"
                            >
                              {align === 'left' && <AlignLeft className="h-3 w-3" />}
                              {align === 'center' && <AlignCenter className="h-3 w-3" />}
                              {align === 'right' && <AlignRight className="h-3 w-3" />}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Size:</span>
                        <select
                          value={block.imageSize || 'medium'}
                          onChange={(e) => updateBlock(block.id, { imageSize: e.target.value as any })}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                          <option value="full">Full Width</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <BlockControls blockId={block.id} onAddBlock={addBlock} onImageInsert={onImageInsert} />
              </div>
            )}

            {block.type === 'list' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant={block.listType === 'bullet' ? "default" : "ghost"}
                    onClick={() => updateBlock(block.id, { listType: 'bullet' })}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={block.listType === 'numbered' ? "default" : "ghost"}
                    onClick={() => updateBlock(block.id, { listType: 'numbered' })}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={block.content || ''}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder="• List item 1&#10;• List item 2&#10;• List item 3"
                  className="border-none p-0 resize-none min-h-[80px] focus-visible:ring-0"
                />
                <BlockControls blockId={block.id} onAddBlock={addBlock} onImageInsert={onImageInsert} />
              </div>
            )}

            {block.type === 'quote' && (
              <div>
                <div className="border-l-4 border-muted-foreground pl-4">
                  <Textarea
                    value={block.content || ''}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Quote text..."
                    className="border-none p-0 resize-none min-h-[80px] italic focus-visible:ring-0"
                  />
                </div>
                <BlockControls blockId={block.id} onAddBlock={addBlock} onImageInsert={onImageInsert} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {content.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Type className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{placeholder}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => addBlock('paragraph')}>
                <Type className="h-4 w-4 mr-2" />
                Add Paragraph
              </Button>
              <Button variant="outline" onClick={() => onImageInsert?.()}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="pl-8">
          {content.map((block, index) => renderBlock(block, index))}
        </div>
      )}

      {/* Add Block Button */}
      {content.length > 0 && (
        <div className="flex justify-center pt-4">
          <AddBlockMenu onAddBlock={addBlock} onImageInsert={onImageInsert} />
        </div>
      )}
    </div>
  );
}

function BlockControls({ 
  blockId, 
  onAddBlock, 
  onImageInsert 
}: { 
  blockId: string; 
  onAddBlock: (type: ContentBlock['type'], afterId?: string) => void;
  onImageInsert?: (afterBlockId?: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onAddBlock('paragraph', blockId)}
        className="h-6 px-2"
      >
        <Type className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onImageInsert?.(blockId)}
        className="h-6 px-2"
      >
        <ImageIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}

function AddBlockMenu({ 
  onAddBlock, 
  onImageInsert 
}: { 
  onAddBlock: (type: ContentBlock['type']) => void;
  onImageInsert?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
      <Button size="sm" variant="ghost" onClick={() => onAddBlock('paragraph')}>
        <Type className="h-4 w-4 mr-1" />
        Text
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onAddBlock('heading')}>
        <Bold className="h-4 w-4 mr-1" />
        Heading
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onImageInsert?.()}>
        <ImageIcon className="h-4 w-4 mr-1" />
        Image
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onAddBlock('list')}>
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onAddBlock('quote')}>
        <Quote className="h-4 w-4 mr-1" />
        Quote
      </Button>
    </div>
  );
}