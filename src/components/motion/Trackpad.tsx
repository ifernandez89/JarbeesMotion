"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { MouseButtonType, MouseButtonAction } from "@/types/motion";

interface TrackpadProps {
  onMove: (deltaX: number, deltaY: number) => void;
  onButton: (button: MouseButtonType, action: MouseButtonAction) => void;
  onScroll: (deltaX: number, deltaY: number) => void;
  sensitivity?: number;
  enabled?: boolean;
}

export function Trackpad({
  onMove,
  onButton,
  onScroll,
  sensitivity = 1.5,
  enabled = true,
}: TrackpadProps) {
  const trackpadRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [touchMoved, setTouchMoved] = useState(false);

  // Touch handlers for trackpad
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || e.touches.length === 0) return;
      
      e.preventDefault();
      const touch = e.touches[0];
      
      setIsTracking(true);
      setLastPosition({ x: touch.clientX, y: touch.clientY });
      setTouchStartTime(Date.now());
      setTouchMoved(false);
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !isTracking || !lastPosition || e.touches.length === 0) return;
      
      e.preventDefault();
      const touch = e.touches[0];
      
      const deltaX = (touch.clientX - lastPosition.x) * sensitivity;
      const deltaY = (touch.clientY - lastPosition.y) * sensitivity;
      
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        onMove(Math.round(deltaX), Math.round(deltaY));
        setTouchMoved(true);
      }
      
      setLastPosition({ x: touch.clientX, y: touch.clientY });
    },
    [enabled, isTracking, lastPosition, sensitivity, onMove]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      
      e.preventDefault();
      
      // Detect tap (quick touch without movement)
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 200 && !touchMoved) {
        // Single tap = left click
        onButton(MouseButtonType.Left, MouseButtonAction.Press);
        setTimeout(() => {
          onButton(MouseButtonType.Left, MouseButtonAction.Release);
        }, 50);
      }
      
      setIsTracking(false);
      setLastPosition(null);
      setTouchMoved(false);
    },
    [enabled, touchStartTime, touchMoved, onButton]
  );

  // Two-finger gestures for scrolling
  const handleTwoFingerMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || e.touches.length !== 2) return;
      
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      if (lastPosition) {
        const deltaY = Math.round((centerY - lastPosition.y) * sensitivity * 0.5);
        if (Math.abs(deltaY) > 2) {
          // Scroll: negative delta = scroll down (like natural scrolling)
          onScroll(0, -deltaY);
        }
      }
      
      setLastPosition({ x: 0, y: centerY });
    },
    [enabled, lastPosition, sensitivity, onScroll]
  );

  useEffect(() => {
    const element = trackpadRef.current;
    if (!element) return;

    const touchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleTouchStart(e);
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        setLastPosition({ x: 0, y: centerY });
      }
    };

    const touchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleTouchMove(e);
      } else if (e.touches.length === 2) {
        handleTwoFingerMove(e);
      }
    };

    const touchEnd = (e: TouchEvent) => {
      handleTouchEnd(e);
    };

    element.addEventListener("touchstart", touchStart, { passive: false });
    element.addEventListener("touchmove", touchMove, { passive: false });
    element.addEventListener("touchend", touchEnd, { passive: false });
    element.addEventListener("touchcancel", touchEnd, { passive: false });

    return () => {
      element.removeEventListener("touchstart", touchStart);
      element.removeEventListener("touchmove", touchMove);
      element.removeEventListener("touchend", touchEnd);
      element.removeEventListener("touchcancel", touchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTwoFingerMove]);

  return (
    <div className="flex flex-col h-full">
      {/* Trackpad area */}
      <div
        ref={trackpadRef}
        className={`flex-1 relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden touch-none select-none ${
          enabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
        } ${isTracking ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
      >
        {/* Visual feedback */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`transition-all duration-300 ${
              isTracking ? "scale-110 opacity-100" : "scale-100 opacity-30"
            }`}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400 dark:text-gray-600"
            >
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
          </div>
        </div>

        {/* Instructions overlay */}
        {!isTracking && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-8">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
              Trackpad Area
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Slide to move • Tap to click
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Two fingers to scroll
            </p>
          </div>
        )}

        {/* Corner indicators */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-gray-300 dark:border-gray-700 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-gray-300 dark:border-gray-700 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-gray-300 dark:border-gray-700 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-gray-300 dark:border-gray-700 rounded-br-lg" />
      </div>

      {/* Button bar */}
      <div className="flex gap-3 mt-4 px-4">
        <button
          onClick={() => {
            if (!enabled) return;
            onButton(MouseButtonType.Left, MouseButtonAction.Press);
            setTimeout(() => {
              onButton(MouseButtonType.Left, MouseButtonAction.Release);
            }, 100);
          }}
          disabled={!enabled}
          className="flex-1 h-16 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg active:shadow-md transition-all duration-150 active:scale-95"
        >
          Left Click
        </button>

        <button
          onClick={() => {
            if (!enabled) return;
            onButton(MouseButtonType.Right, MouseButtonAction.Press);
            setTimeout(() => {
              onButton(MouseButtonType.Right, MouseButtonAction.Release);
            }, 100);
          }}
          disabled={!enabled}
          className="flex-1 h-16 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg active:shadow-md transition-all duration-150 active:scale-95"
        >
          Right Click
        </button>
      </div>
    </div>
  );
}
