"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Upload, Wand2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ImageConverterProps {
  onConvert: (pixels: string[][]) => void
}

export default function ImageConverter({ onConvert }: ImageConverterProps) {
  const [image, setImage] = useState<string | null>(null)
  const [pixelDensity, setPixelDensity] = useState([32])
  const [colorCount, setColorCount] = useState([16])
  const [ditherStrength, setDitherStrength] = useState([50])
  const [contrast, setContrast] = useState([100])
  const [isConverting, setIsConverting] = useState(false)
  const [conversionMode, setConversionMode] = useState<"standard" | "dithered" | "edge">("standard")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const quantizeColors = (imageData: ImageData, numColors: number): Map<string, string> => {
    const pixels: [number, number, number][] = []

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      const a = imageData.data[i + 3]
      if (a > 128) {
        pixels.push([r, g, b])
      }
    }

    // Simple k-means clustering for color quantization
    const palette: [number, number, number][] = []
    const step = Math.floor(pixels.length / numColors)

    for (let i = 0; i < numColors && i * step < pixels.length; i++) {
      palette.push(pixels[i * step])
    }

    // Map original colors to palette
    const colorMap = new Map<string, string>()

    for (const [r, g, b] of pixels) {
      const originalColor = `${r},${g},${b}`
      if (!colorMap.has(originalColor)) {
        let minDist = Number.POSITIVE_INFINITY
        let closestColor = palette[0]

        for (const paletteColor of palette) {
          const dist = Math.sqrt(
            Math.pow(r - paletteColor[0], 2) + Math.pow(g - paletteColor[1], 2) + Math.pow(b - paletteColor[2], 2),
          )
          if (dist < minDist) {
            minDist = dist
            closestColor = paletteColor
          }
        }

        const hex = `#${((1 << 24) + (closestColor[0] << 16) + (closestColor[1] << 8) + closestColor[2]).toString(16).slice(1)}`
        colorMap.set(originalColor, hex)
      }
    }

    return colorMap
  }

  const applyDithering = (imageData: ImageData, strength: number): ImageData => {
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height
    const factor = strength / 100

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4

        for (let i = 0; i < 3; i++) {
          const oldPixel = data[idx + i]
          const newPixel = oldPixel < 128 ? 0 : 255
          data[idx + i] = newPixel
          const error = (oldPixel - newPixel) * factor

          if (x + 1 < width) {
            data[idx + 4 + i] += (error * 7) / 16
          }
          if (y + 1 < height) {
            if (x > 0) {
              data[idx + width * 4 - 4 + i] += (error * 3) / 16
            }
            data[idx + width * 4 + i] += (error * 5) / 16
            if (x + 1 < width) {
              data[idx + width * 4 + 4 + i] += (error * 1) / 16
            }
          }
        }
      }
    }

    return new ImageData(data, width, height)
  }

  const detectEdges = (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height
    const output = new Uint8ClampedArray(imageData.data)

    // Sobel operator
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ]
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
          gy = 0

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
            gx += gray * sobelX[ky + 1][kx + 1]
            gy += gray * sobelY[ky + 1][kx + 1]
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy)
        const idx = (y * width + x) * 4
        const value = Math.min(255, magnitude)
        output[idx] = output[idx + 1] = output[idx + 2] = value
      }
    }

    return new ImageData(output, width, height)
  }

  const convertToPixelArt = () => {
    if (!image || !canvasRef.current) return

    setIsConverting(true)

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!
      const gridSize = pixelDensity[0]

      canvas.width = gridSize
      canvas.height = gridSize

      // Apply contrast adjustment
      ctx.filter = `contrast(${contrast[0]}%)`
      ctx.drawImage(img, 0, 0, gridSize, gridSize)
      ctx.filter = "none"

      let imageData = ctx.getImageData(0, 0, gridSize, gridSize)

      if (conversionMode === "dithered") {
        imageData = applyDithering(imageData, ditherStrength[0])
        ctx.putImageData(imageData, 0, 0)
        imageData = ctx.getImageData(0, 0, gridSize, gridSize)
      } else if (conversionMode === "edge") {
        const edges = detectEdges(imageData)
        ctx.putImageData(edges, 0, 0)
        imageData = ctx.getImageData(0, 0, gridSize, gridSize)
      }

      const colorMap = quantizeColors(imageData, colorCount[0])
      const pixels: string[][] = []

      for (let y = 0; y < gridSize; y++) {
        const row: string[] = []
        for (let x = 0; x < gridSize; x++) {
          const index = (y * gridSize + x) * 4
          const r = imageData.data[index]
          const g = imageData.data[index + 1]
          const b = imageData.data[index + 2]
          const a = imageData.data[index + 3]

          if (a < 128) {
            row.push("transparent")
          } else {
            const colorKey = `${r},${g},${b}`
            const quantizedColor =
              colorMap.get(colorKey) || `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
            row.push(quantizedColor)
          }
        }
        pixels.push(row)
      }

      onConvert(pixels)
      setIsConverting(false)
    }
    img.src = image
  }

  useEffect(() => {
    if (image) {
      convertToPixelArt()
    }
  }, [pixelDensity, colorCount, ditherStrength, contrast, conversionMode])

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Image to Pixel Converter</h3>

      <div className="space-y-6">
        {/* File Upload */}
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <Button variant="outline" className="w-full bg-transparent" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        </div>

        {/* Image Preview */}
        {image && (
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
              <img src={image || "/placeholder.svg"} alt="Preview" className="w-full h-full object-contain" />
            </div>

            <Tabs value={conversionMode} onValueChange={(v) => setConversionMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="standard">Standard</TabsTrigger>
                <TabsTrigger value="dithered">Dithered</TabsTrigger>
                <TabsTrigger value="edge">Edge</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Pixel Density Slider */}
            <div className="space-y-2">
              <Label>
                Pixel Density: {pixelDensity[0]}x{pixelDensity[0]}
              </Label>
              <Slider
                value={pixelDensity}
                onValueChange={setPixelDensity}
                min={16}
                max={64}
                step={8}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Lower values create more pixelated art</p>
            </div>

            <div className="space-y-2">
              <Label>Color Palette: {colorCount[0]} colors</Label>
              <Slider value={colorCount} onValueChange={setColorCount} min={4} max={32} step={4} className="w-full" />
              <p className="text-xs text-muted-foreground">Fewer colors for retro pixel art style</p>
            </div>

            {conversionMode === "dithered" && (
              <div className="space-y-2">
                <Label>Dither Strength: {ditherStrength[0]}%</Label>
                <Slider
                  value={ditherStrength}
                  onValueChange={setDitherStrength}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Adjust dithering effect intensity</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Contrast: {contrast[0]}%</Label>
              <Slider value={contrast} onValueChange={setContrast} min={50} max={200} step={10} className="w-full" />
              <p className="text-xs text-muted-foreground">Enhance or reduce image contrast</p>
            </div>

            {/* Convert Button */}
            <Button className="w-full" onClick={convertToPixelArt} disabled={isConverting}>
              <Wand2 className="w-4 h-4 mr-2" />
              {isConverting ? "Converting..." : "Convert to Pixel Art"}
            </Button>
          </div>
        )}

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Card>
  )
}
