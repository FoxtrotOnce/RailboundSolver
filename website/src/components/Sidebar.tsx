import React from "react";
import { useGuiStore } from "../store";

export const Sidebar: React.FC = () => {
  const { toggleLeftDisplay, showLeftDisplay } = useGuiStore();
  return (
    <div className="absolute left-0 top-10 z-40">
      <button
        onClick={() => toggleLeftDisplay()}
        className="cursor-pointer h-12 border-2 border-l-0 border-gray-600 transition-all duration-300 rounded-tr rounded-br bg-gray-800 text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          className={`${
            showLeftDisplay ? "rotate-180" : "rotate-0"
          } transition-all duration-300`}
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="m9 5l6 7l-6 7"
          />
        </svg>
      </button>
    </div>
  );
};
