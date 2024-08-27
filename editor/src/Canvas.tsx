import React, { useRef, useEffect, useState } from "react";

interface CanvasState {
  isDrawing: boolean;
  lastX: number;
  lastY: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setContext(ctx);

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initial draw
    draw(ctx, canvasState);
  }, []);

  const draw = (ctx: CanvasRenderingContext2D, state: CanvasState) => {
    const { scale, offsetX, offsetY } = state;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Your drawing logic here
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 100, 100);

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setCanvasState((prevState) => ({
      ...prevState,
      isDrawing: true,
      lastX: e.nativeEvent.offsetX,
      lastY: e.nativeEvent.offsetY,
    }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasState.isDrawing || !context) return;

    const newOffsetX =
      canvasState.offsetX + (e.nativeEvent.offsetX - canvasState.lastX);
    const newOffsetY =
      canvasState.offsetY + (e.nativeEvent.offsetY - canvasState.lastY);

    const newState = {
      ...canvasState,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
      lastX: e.nativeEvent.offsetX,
      lastY: e.nativeEvent.offsetY,
    };

    setCanvasState(newState);
    draw(context, newState);
  };

  const handleMouseUp = () => {
    setCanvasState((prevState) => ({ ...prevState, isDrawing: false }));
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!context || !canvasRef.current) return;

    const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = canvasState.scale * scaleAmount;

    // Calculate zoom center
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newOffsetX = canvasState.offsetX - mouseX * (scaleAmount - 1);
    const newOffsetY = canvasState.offsetY - mouseY * (scaleAmount - 1);

    const newState = {
      ...canvasState,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    };

    setCanvasState(newState);
    draw(context, newState);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="flex-1"
    />
  );
};

export default Canvas;
