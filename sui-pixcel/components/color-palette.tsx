"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pipette, Plus, Trash2 } from "lucide-react"

interface ColorPaletteProps {
  currentColor: string
  onColorChange: (color: string) => void
  onEyedropperToggle?: () => void
  isEyedropperActive?: boolean
}

const DEFAULT_COLORS = [
  "#000000",
  "#FFFFFF",
  "#808080",
  "#C0C0C0",
  "#FF0000",
  "#FF6B6B",
  "#FF8787",
  "#FFA5A5",
  "#FFA500",
  "#FFB84D",
  "#FFC266",
  "#FFD699",
  "#FFFF00",
  "#FFFF66",
  "#FFFF99",
  "#FFFFCC",
  "#00FF00",
  "#66FF66",
  "#99FF99",
  "#CCFFCC",
  "#00FFFF",
  "#66FFFF",
  "#99FFFF",
  "#CCFFFF",
  "#0000FF",
  "#6B6BFF",
  "#8787FF",
  "#A5A5FF",
  "#FF00FF",
  "#FF66FF",
  "#FF99FF",
  "#FFCCFF",
  "#800080",
  "#A020F0",
  "#9370DB",
  "#DDA0DD",
  "#A52A2A",
  "#CD853F",
  "#D2691E",
  "#F4A460",
]

const COLOR_SCHEMES = {
  pastel: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF", "#E0BBE4", "#FFDFD3", "#FEC8D8"],
  neon: ["#FF006E", "#FB5607", "#FFBE0B", "#8338EC", "#3A86FF", "#06FFA5", "#FF006E", "#FFBE0B"],
  earth: ["#8B4513", "#A0522D", "#CD853F", "#DEB887", "#D2691E", "#BC8F8F", "#F4A460", "#DAA520"],
  ocean: ["#006994", "#0582CA", "#00A6FB", "#0091D5", "#41EAD4", "#B1F8F2", "#7FCDCD", "#5AB9EA"],
  sunset: ["#FF6B35", "#F7931E", "#FDC830", "#F37335", "#FF5E5B", "#D62828", "#F77F00", "#FCBF49"],
  forest: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2", "#B7E4C7", "#D8F3DC", "#1B4332"],
}

export default function ColorPalette({
  currentColor,
  onColorChange,
  onEyedropperToggle,
  isEyedropperActive,
}: ColorPaletteProps) {
  const [customColors, setCustomColors] = useState<string[]>([])
  const [colorHistory, setColorHistory] = useState<string[]>([])
  const [hexInput, setHexInput] = useState(currentColor)

  const handleColorSelect = (color: string) => {
    onColorChange(color)
    setHexInput(color)

    if (!colorHistory.includes(color)) {
      setColorHistory((prev) => [color, ...prev].slice(0, 12))
    }
  }

  const handleHexInputChange = (value: string) => {
    setHexInput(value)
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      handleColorSelect(value)
    }
  }

  const addCustomColor = () => {
    if (!customColors.includes(currentColor)) {
      setCustomColors((prev) => [...prev, currentColor])
    }
  }

  const removeCustomColor = (color: string) => {
    setCustomColors((prev) => prev.filter((c) => c !== color))
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm md:text-base">Color Palette</h3>
        {onEyedropperToggle && (
          <Button
            variant={isEyedropperActive ? "default" : "outline"}
            size="sm"
            onClick={onEyedropperToggle}
            title="Eyedropper Tool"
          >
            <Pipette className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Current Color Display */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Current Color</Label>
          <div className="flex gap-2">
            <div
              className="w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <div className="flex-1 space-y-2">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-full h-8 rounded-lg cursor-pointer border-2 border-border"
              />
              <Input
                value={hexInput}
                onChange={(e) => handleHexInputChange(e.target.value.toUpperCase())}
                placeholder="#000000"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="default" className="w-full">
          <TabsList className="grid w-full grid-cols-4 text-xs md:text-sm">
            <TabsTrigger value="default">Default</TabsTrigger>
            <TabsTrigger value="schemes">Schemes</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="default" className="mt-4">
            <div className="grid grid-cols-6 md:grid-cols-8 gap-1.5 md:gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-full aspect-square rounded-md md:rounded-lg border-2 hover:scale-110 transition-transform ${
                    currentColor === color ? "border-primary ring-2 ring-primary/50" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schemes" className="mt-4 space-y-3">
            {Object.entries(COLOR_SCHEMES).map(([name, colors]) => (
              <div key={name}>
                <Label className="text-xs text-muted-foreground mb-2 block capitalize">{name}</Label>
                <div className="grid grid-cols-8 gap-1.5">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-full aspect-square rounded-md border-2 hover:scale-110 transition-transform ${
                        currentColor === color ? "border-primary ring-2 ring-primary/50" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="custom" className="mt-4 space-y-3">
            <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={addCustomColor}>
              <Plus className="w-4 h-4 mr-2" />
              Add Current Color
            </Button>
            {customColors.length > 0 ? (
              <div className="grid grid-cols-6 md:grid-cols-8 gap-1.5 md:gap-2">
                {customColors.map((color) => (
                  <div key={color} className="relative group">
                    <button
                      className={`w-full aspect-square rounded-md md:rounded-lg border-2 hover:scale-110 transition-transform ${
                        currentColor === color ? "border-primary ring-2 ring-primary/50" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    />
                    <button
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 md:p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeCustomColor(color)}
                    >
                      <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No custom colors yet</p>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {colorHistory.length > 0 ? (
              <div className="grid grid-cols-6 md:grid-cols-8 gap-1.5 md:gap-2">
                {colorHistory.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    className={`w-full aspect-square rounded-md md:rounded-lg border-2 hover:scale-110 transition-transform ${
                      currentColor === color ? "border-primary ring-2 ring-primary/50" : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No color history yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}
