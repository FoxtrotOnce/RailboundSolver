import React from "react";
import LeftClick from "../assets/LeftClick.svg"
import RightClick from "../assets/RightClick.svg"

export const RightControlDisplay: React.FC = () => {
    return (
        <div className="absolute items-center items-stretch grid grid-cols-2 grid-rows-3 w-35 h-40 bottom-2 p-2 right-2 rounded-xl bg-gray-800 border-2 border-gray-600 z-40 select-none">
            <div className="flex justify-center items-center border-b-1 border-gray-600">
                <img src={LeftClick} className="w-6" />
            </div>
            <div className="flex justify-center items-center border-b-1 border-gray-600">
                <div className="gap-5 text-white text-md">
                    Place
                </div>
            </div>
            <div className="flex justify-center items-center border-b-1 border-gray-600">
                <img src={RightClick} className="w-6"/>
            </div>
            <div className="flex justify-center items-center border-b-1 border-gray-600">
                <div className="gap-5 text-white text-md">
                    Delete
                </div>
            </div>
            <div className="flex gap-1 items-center">
                <div className="flex w-6 h-6 rounded border-2 border-gray-500 bg-gray-600 items-center justify-center text-s text-white font-bold select-none">
                    Q
                </div>
                <div className="flex text-white text-lg justify-center">
                    /
                </div>
                <div className="flex w-6 h-6 rounded border-2 border-gray-500 bg-gray-600 items-center justify-center text-s text-white font-bold select-none">
                    E
                </div>
            </div>
            <div className="flex items-center justify-center text-white text-md">
                Rotate
            </div>
        </div>
    )
}
