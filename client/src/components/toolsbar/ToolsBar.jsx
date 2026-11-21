/* === FEATURE 1: CREATING DIFFERENT SHAPES === */
/* === FEATURE 2: UPLOADING IMAGES === */
/* === FEATURE 4: FREEFORM DRAWING === */
import { CanvasMode, LayerType } from "../../types";
import SelectionButton from "./SelectionButton";
import ShapesSelectionButton from "./ShapesSelectionButton";
import ZoomInButton from "./ZoomInButton";
import ZoomOutButton from "./ZoomOutButton";
import PencilButton from "./PencilButton";
import TextButton from "./TextButton";
import ImageUploadButton from "./ImageUploadButton";
import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";

export default function ToolsBar({
  canvasState,
  setCanvasState,
  zoomIn,
  zoomOut,
  resetView,
  zoom = 1,
  canZoomIn,
  canZoomOut,
  canUndo,
  canRedo,
  undo,
  redo,
  onInsertImage,
  penColor,
  setPenColor,
  penSize,
  setPenSize,
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-lg bg-white p-1 shadow-[0_0_3px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-center gap-2 px-1">
        {/* Selection / Move tool */}
        <SelectionButton
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Resizing ||
            canvasState.mode === CanvasMode.Dragging
          }
          canvasMode={canvasState.mode}
          onClick={(canvasMode) =>
            setCanvasState(
              canvasMode === CanvasMode.Dragging
                ? { mode: canvasMode, origin: null }
                : { mode: canvasMode },
            )
          }
        />

        {/* === FEATURE 1: CREATING DIFFERENT SHAPES === */}
        <ShapesSelectionButton
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            [
              LayerType.Rectangle,
              LayerType.Ellipse,
              LayerType.Triangle,
              LayerType.Star,
              LayerType.Line,
            ].includes(canvasState.layerType)
          }
          canvasState={canvasState}
          onClick={(layerType) =>
            setCanvasState({ mode: CanvasMode.Inserting, layerType })
          }
        />

        {/* === FEATURE 4: FREEFORM DRAWING (Pencil Button with brush controls) === */}
        <PencilButton
          isActive={canvasState.mode === CanvasMode.Pencil}
          onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
          penColor={penColor}
          setPenColor={setPenColor}
          penSize={penSize}
          setPenSize={setPenSize}
        />

        {/* Text tool */}
        <TextButton
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Text
          }
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Text,
            })
          }
        />

        {/* === FEATURE 2: UPLOADING IMAGES === */}
        <ImageUploadButton onInsertImage={onInsertImage} />

        <div className="w-[1px] self-stretch bg-black/10 mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center justify-center">
          <UndoButton onClick={undo} disabled={!canUndo} />
          <RedoButton onClick={redo} disabled={!canRedo} />
        </div>

        <div className="w-[1px] self-stretch bg-black/10 mx-1" />

        {/* Zoom & Canvas Center Reset */}
        <div className="flex items-center justify-center gap-0.5">
          <ZoomOutButton onClick={zoomOut} disabled={!canZoomOut} />
          <button
            onClick={resetView}
            className="px-1.5 py-0.5 text-[11px] font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded transition cursor-pointer"
            title="Reset View / Center Canvas"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ZoomInButton onClick={zoomIn} disabled={!canZoomIn} />
        </div>
      </div>
    </div>
  );
}
