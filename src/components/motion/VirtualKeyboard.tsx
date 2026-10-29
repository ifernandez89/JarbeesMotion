"use client";

import { useState } from "react";
import { KeyAction, VirtualKeys, type KeyboardKeyPayload } from "@/types/motion";

interface VirtualKeyboardProps {
  onText: (text: string) => void;
  onKey: (payload: KeyboardKeyPayload) => void;
  onClose: () => void;
  enabled?: boolean;
}

type KeyboardMode = "text" | "special" | "function";

export function VirtualKeyboard({
  onText,
  onKey,
  onClose,
  enabled = true,
}: VirtualKeyboardProps) {
  const [mode, setMode] = useState<KeyboardMode>("text");
  const [shift, setShift] = useState(false);
  const [ctrl, setCtrl] = useState(false);
  const [alt, setAlt] = useState(false);
  const [inputText, setInputText] = useState("");

  const handleTextKey = (char: string) => {
    if (!enabled) return;
    const finalChar = shift ? char.toUpperCase() : char;
    onText(finalChar);
    if (shift) setShift(false); // Auto-disable shift after one character
  };

  const handleSpecialKey = (keyName: string) => {
    if (!enabled) return;

    const payload: KeyboardKeyPayload = {
      key: keyName,
      action: KeyAction.Press,
      modifiers: {
        shift,
        ctrl,
        alt,
        win: false,
      },
    };

    // Press
    onKey(payload);

    // Release after 50ms
    setTimeout(() => {
      onKey({ ...payload, action: KeyAction.Release });
    }, 50);

    // Reset modifiers after special key
    if (["ENTER", "ESCAPE", "TAB"].includes(keyName)) {
      setShift(false);
      setCtrl(false);
      setAlt(false);
    }
  };

  const handleTextInput = () => {
    if (!enabled || !inputText.trim()) return;
    onText(inputText);
    setInputText("");
  };

  const toggleModifier = (modifier: "shift" | "ctrl" | "alt") => {
    if (!enabled) return;
    switch (modifier) {
      case "shift":
        setShift(!shift);
        break;
      case "ctrl":
        setCtrl(!ctrl);
        break;
      case "alt":
        setAlt(!alt);
        break;
    }
  };

  // Text mode layout
  const textKeys = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  // Special keys layout
  const specialKeys = [
    [VirtualKeys.ESCAPE, VirtualKeys.TAB, VirtualKeys.BACKSPACE, VirtualKeys.DELETE],
    [VirtualKeys.UP, VirtualKeys.DOWN, VirtualKeys.LEFT, VirtualKeys.RIGHT],
    [VirtualKeys.ENTER, VirtualKeys.SPACE],
  ];

  // Function keys layout
  const functionKeys = [
    [VirtualKeys.F1, VirtualKeys.F2, VirtualKeys.F3, VirtualKeys.F4],
    [VirtualKeys.F5, VirtualKeys.F6, VirtualKeys.F7, VirtualKeys.F8],
    [VirtualKeys.F9, VirtualKeys.F10, VirtualKeys.F11, VirtualKeys.F12],
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto pb-safe">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Virtual Keyboard
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-600 dark:text-gray-400"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setMode("text")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "text"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            ABC
          </button>
          <button
            onClick={() => setMode("special")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "special"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            ⌨️ Special
          </button>
          <button
            onClick={() => setMode("function")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "function"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            F1-F12
          </button>
        </div>

        {/* Text input for paste */}
        {mode === "text" && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleTextInput();
                  }
                }}
                placeholder="Type text to send..."
                disabled={!enabled}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
              />
              <button
                onClick={handleTextInput}
                disabled={!enabled || !inputText.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Type longer text here and press Send
            </p>
          </div>
        )}

        {/* Modifiers */}
        <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => toggleModifier("shift")}
            disabled={!enabled}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              shift
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            } disabled:opacity-50`}
          >
            ⇧ Shift
          </button>
          <button
            onClick={() => toggleModifier("ctrl")}
            disabled={!enabled}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              ctrl
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            } disabled:opacity-50`}
          >
            Ctrl
          </button>
          <button
            onClick={() => toggleModifier("alt")}
            disabled={!enabled}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              alt
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            } disabled:opacity-50`}
          >
            Alt
          </button>
        </div>

        {/* Keyboard layout */}
        <div className="p-4">
          {mode === "text" && (
            <div className="space-y-2">
              {textKeys.map((row, i) => (
                <div key={i} className="flex gap-2 justify-center">
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleTextKey(key)}
                      disabled={!enabled}
                      className="w-10 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 rounded-lg font-medium text-gray-900 dark:text-white transition-colors disabled:opacity-50"
                    >
                      {shift ? key.toUpperCase() : key}
                    </button>
                  ))}
                </div>
              ))}
              {/* Bottom row with space */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleTextKey(",")}
                  disabled={!enabled}
                  className="w-10 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium text-gray-900 dark:text-white transition-colors disabled:opacity-50"
                >
                  ,
                </button>
                <button
                  onClick={() => handleSpecialKey(VirtualKeys.SPACE)}
                  disabled={!enabled}
                  className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium text-gray-900 dark:text-white transition-colors disabled:opacity-50"
                >
                  Space
                </button>
                <button
                  onClick={() => handleTextKey(".")}
                  disabled={!enabled}
                  className="w-10 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium text-gray-900 dark:text-white transition-colors disabled:opacity-50"
                >
                  .
                </button>
              </div>
            </div>
          )}

          {mode === "special" && (
            <div className="space-y-2">
              {specialKeys.map((row, i) => (
                <div key={i} className="flex gap-2 justify-center">
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSpecialKey(key)}
                      disabled={!enabled}
                      className="flex-1 h-12 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 active:bg-blue-300 dark:active:bg-blue-900/70 rounded-lg font-medium text-blue-900 dark:text-blue-100 transition-colors disabled:opacity-50"
                    >
                      {key === VirtualKeys.SPACE ? "Space" : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {mode === "function" && (
            <div className="space-y-2">
              {functionKeys.map((row, i) => (
                <div key={i} className="flex gap-2">
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSpecialKey(key)}
                      disabled={!enabled}
                      className="flex-1 h-12 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 active:bg-purple-300 dark:active:bg-purple-900/70 rounded-lg font-medium text-purple-900 dark:text-purple-100 transition-colors disabled:opacity-50"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Helper text */}
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {mode === "text" && "Tap keys to type • Hold modifiers for combinations"}
            {mode === "special" && "Navigation and control keys"}
            {mode === "function" && "Function keys F1-F12"}
          </p>
        </div>
      </div>
    </div>
  );
}
