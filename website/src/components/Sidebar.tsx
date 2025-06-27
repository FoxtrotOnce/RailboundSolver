import React from "react";
import { useGuiStore } from "../store";

export const Sidebar: React.FC = () => {
    const { toggleLeftDisplay } = useGuiStore();
    return (
        <div className="absolute left-0 top-10 z-40">
            <button
            onClick={() => (
                toggleLeftDisplay()
            )}
            className="cursor-pointer h-12 w-4 border-2 border-l-0 border-gray-600 transition-all duration-300 rounded-tr rounded-br bg-gray-800 text-white">
                {">"}
            </button>
        </div>
    )
}
