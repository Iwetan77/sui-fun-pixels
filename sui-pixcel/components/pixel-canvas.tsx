"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ZoomIn,
  ZoomOut,
  Download,
  Eraser,
  Pencil,
  PaintBucket,
  Grid3x3,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Brush,
} from "lucide-react"
import ImageConverter from "./image-converter"
import ColorPalette from "./color-palette"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const INITIAL_GRID_SIZE = 32
const INITIAL_PIXEL_SIZE = 16

type Tool = "pencil" | "eraser" | "fill" | "eyedropper"
type BrushSize = 1 | 2 | 3

export default function PixelCanvas() {
  const [gridSize, setGridSize] = useState(INITIAL_GRID_SIZE)
  const [pixelSize, setPixelSize] = useState(INITIAL_PIXEL_SIZE)
  const [pixels, setPixels] = useState<string[][]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState("#000000")
  const [currentTool, setCurrentTool] = useState<Tool>("pencil")
  const [brushSize, setBrushSize] = useState<BrushSize>(1)
  const [showGrid, setShowGrid] = useState(true)
  const [history, setHistory] = useState<string[][][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize grid
  useEffect(() => {
    const newPixels = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("transparent"))
    setPixels(newPixels)
    setHistory([newPixels])
    setHistoryIndex(0)
  }, [gridSize])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault()
          handleUndo()
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault()
          handleRedo()
        } else if (e.key === "s") {
          e.preventDefault()
          handleSaveProject()
        }
      } else if (e.key === "g") {
        setShowGrid((prev) => !prev)
      } else if (e.key === "e") {
        setCurrentTool("eraser")
      } else if (e.key === "p") {
        setCurrentTool("pencil")
      } else if (e.key === "f") {
        setCurrentTool("fill")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [historyIndex, history])

  const saveToHistory = (newPixels: string[][]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newPixels.map((row) => [...row]))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setPixels(history[historyIndex - 1].map((row) => [...row]))
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setPixels(history[historyIndex + 1].map((row) => [...row]))
    }
  }

  const handleImageConvert = (convertedPixels: string[][]) => {
    setGridSize(convertedPixels.length)
    setPixels(convertedPixels)
    saveToHistory(convertedPixels)
  }

  const floodFill = (row: number, col: number, targetColor: string, replacementColor: string) => {
    if (targetColor === replacementColor) return
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return
    if (pixels[row][col] !== targetColor) return

    const newPixels = [...pixels.map((r) => [...r])]
    const stack: [number, number][] = [[row, col]]

    while (stack.length > 0) {
      const [r, c] = stack.pop()!
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue
      if (newPixels[r][c] !== targetColor) continue

      newPixels[r][c] = replacementColor

      stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1])
    }

    setPixels(newPixels)
    saveToHistory(newPixels)
  }

  const drawPixel = (row: number, col: number, newPixels: string[][]) => {
    const color = currentTool === "pencil" ? currentColor : "transparent"
    const offset = Math.floor(brushSize / 2)

    for (let i = 0; i < brushSize; i++) {
      for (let j = 0; j < brushSize; j++) {
        const r = row - offset + i
        const c = col - offset + j
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          newPixels[r][c] = color
        }
      }
    }
  }

  const handlePixelClick = (row: number, col: number) => {
    if (currentTool === "eyedropper") {
      const color = pixels[row][col]
      if (color !== "transparent") {
        setCurrentColor(color)
      }
      setCurrentTool("pencil")
      return
    }

    if (currentTool === "fill") {
      floodFill(row, col, pixels[row][col], currentColor)
      return
    }

    const newPixels = pixels.map((r) => [...r])
    drawPixel(row, col, newPixels)
    setPixels(newPixels)
    saveToHistory(newPixels)
  }

  const handleMouseDown = (row: number, col: number) => {
    if (currentTool === "fill" || currentTool === "eyedropper") {
      handlePixelClick(row, col)
      return
    }
    setIsDrawing(true)
    handlePixelClick(row, col)
  }

  const handleMouseEnter = (row: number, col: number) => {
    if (isDrawing && currentTool !== "fill" && currentTool !== "eyedropper") {
      const newPixels = pixels.map((r) => [...r])
      drawPixel(row, col, newPixels)
      setPixels(newPixels)
    }
  }

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveToHistory(pixels)
    }
  }

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    e.preventDefault()
    handleMouseDown(row, col)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return

    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    if (element && element.hasAttribute("data-row")) {
      const row = Number.parseInt(element.getAttribute("data-row")!)
      const col = Number.parseInt(element.getAttribute("data-col")!)
      handleMouseEnter(row, col)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseUp()
  }

  const handleZoomIn = () => {
    setPixelSize((prev) => Math.min(prev + 2, 24))
  }

  const handleZoomOut = () => {
    setPixelSize((prev) => Math.max(prev - 2, 6))
  }

  const handleClear = () => {
    const newPixels = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill("transparent"))
    setPixels(newPixels)
    saveToHistory(newPixels)
  }

  const handleSaveProject = () => {
    const project = {
      pixels,
      gridSize,
      timestamp: Date.now(),
    }
    const projectData = JSON.stringify(project)
    const blob = new Blob([projectData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.download = `sui-pixcel-project-${Date.now()}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string)
        setGridSize(project.gridSize)
        setPixels(project.pixels)
        saveToHistory(project.pixels)
      } catch (error) {
        console.error("Failed to load project:", error)
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleDownload = () => {
    const canvas = downloadCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const exportPixelSize = 20
    canvas.width = gridSize * exportPixelSize
    canvas.height = gridSize * exportPixelSize

    pixels.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        if (color !== "transparent") {
          ctx.fillStyle = color
          ctx.fillRect(colIndex * exportPixelSize, rowIndex * exportPixelSize, exportPixelSize, exportPixelSize)
        }
      })
    })

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = `sui-pixcel-${Date.now()}.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  const getCursorStyle = () => {
    switch (currentTool) {
      case "pencil":
        return "crosshair"
      case "eraser":
        return "cell"
      case "fill":
        return "pointer"
      case "eyedropper":
        return "copy"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <canvas ref={downloadCanvasRef} className="hidden" />

      <Card className="p-3 md:p-4">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* First Row: Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={currentTool === "pencil" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentTool("pencil")}
              className="flex-1 sm:flex-none"
            >
              <Pencil className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Pencil</span>
            </Button>
            <Button
              variant={currentTool === "eraser" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentTool("eraser")}
              className="flex-1 sm:flex-none"
            >
              <Eraser className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Eraser</span>
            </Button>
            <Button
              variant={currentTool === "fill" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentTool("fill")}
              className="flex-1 sm:flex-none"
            >
              <PaintBucket className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Fill</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
                  <Brush className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {brushSize}x{brushSize}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setBrushSize(1)}>1x1 (Small)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBrushSize(2)}>2x2 (Medium)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBrushSize(3)}>3x3 (Large)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Second Row: Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>

            <div className="hidden sm:block h-8 w-px bg-border" />

            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid (G)"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>

            <div className="hidden sm:block h-8 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round((pixelSize / INITIAL_PIXEL_SIZE) * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <div className="hidden sm:block h-8 w-px bg-border" />

            <Button variant="outline" size="sm" onClick={handleSaveProject} title="Save Project (Ctrl+S)">
              <Save className="w-4 h-4 sm:mr-2" />
              <span className="hidden md:inline">Save</span>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <FolderOpen className="w-4 h-4 sm:mr-2" />
                <span className="hidden md:inline">Load</span>
                <input type="file" accept=".json" onChange={handleLoadProject} className="hidden" />
              </label>
            </Button>

            <div className="hidden sm:block h-8 w-px bg-border" />

            <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1 sm:flex-none bg-transparent">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleClear} className="flex-1 sm:flex-none bg-transparent">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <div className="overflow-auto">
            <div
              ref={canvasRef}
              className="inline-block border-2 border-border rounded-lg overflow-hidden shadow-lg touch-none min-w-[600px] min-h-[600px]"
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              style={{
                cursor: getCursorStyle(),
              }}
            >
              {pixels.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((color, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      data-row={rowIndex}
                      data-col={colIndex}
                      className={`transition-colors hover:ring-1 hover:ring-primary/50 ${
                        showGrid ? "border border-muted/20" : ""
                      }`}
                      style={{
                        width: pixelSize,
                        height: pixelSize,
                        backgroundColor: color === "transparent" ? "#ffffff" : color,
                      }}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4 md:space-y-6">
          <ColorPalette
            currentColor={currentColor}
            onColorChange={setCurrentColor}
            onEyedropperToggle={() => setCurrentTool(currentTool === "eyedropper" ? "pencil" : "eyedropper")}
            isEyedropperActive={currentTool === "eyedropper"}
          />

          <ImageConverter onConvert={handleImageConvert} />
        </div>
      </div>
    </div>
  )
}
