import React from "react";
import {
    LeftClick,
    RightClick
} from "../assets/svgs"

export const RightControlDisplay: React.FC = () => {
    return (
        <div className="relative items-center items-stretch gap-y-1 grid grid-cols-2 grid-rows-5 w-40 h-fit bottom-2 p-2 right-2 rounded-xl bg-gray-800 border-2 border-gray-600 z-40 select-none">
            <div className="flex justify-center items-center py-1 border-b-1 border-gray-600">
                <div className="w-6">{LeftClick}</div>
            </div>
            <div className="flex justify-center items-center py-1 border-b-1 border-gray-600">
                <div className="gap-5 text-white text-md">
                    Place
                </div>
            </div>
            <div className="flex justify-center items-center border-b-1 border-gray-600">
                <div className="w-6">{RightClick}</div>
            </div>
            <div className="flex justify-center items-center border-b-1 border-gray-600">
                <div className="gap-5 text-white text-md">
                    Delete
                </div>
            </div>
            <div className="flex gap-1 items-center border-b-1 border-gray-600">
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
            <div className="flex items-center justify-center text-white text-md border-b-1 border-gray-600">
                Rotate
            </div>
            <div className="flex border-b-1 border-gray-600">
                <div className="flex m-auto w-6 h-6 rounded border-2 border-gray-500 bg-gray-600 items-center justify-center text-s text-white font-bold select-none">
                    W
                </div>
            </div>
            <div className="flex items-center text-center justify-center text-white text-sm leading-tight border-b-1 border-gray-600">
                Change Mod Color
            </div>
            <div className="flex m-auto w-6 h-6 rounded border-2 border-gray-500 bg-gray-600 items-center justify-center text-s text-white font-bold select-none">
                R
            </div>
            <div className="flex items-center text-center justify-center text-white text-md leading-tight whitespace-nowrap">
                Clear Grid
            </div>
        </div>
    )
}
