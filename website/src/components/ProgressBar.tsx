import React from "react";
import { useGuiStore } from "../store";

export const ProgressBar: React.FC = () => {
  const { styles } = useGuiStore()

  return (
    <div className={`flex flex-col font-bold text-[1.25rem] leading-[1.625rem] ${styles.text.as_text()}`}>
      <div className={`flex flex-row w-full justify-between`}>
        <div className={`flex flex-col`}>
          <span>Iterations: ??,???,???,???</span>
          <span>Estimated 99:59:59 remaining</span>
        </div>
        <div className={`flex flex-row items-end`}>
          <span className={`text-[3rem] leading-[3rem]`}>100</span>
          <span>%</span>
        </div>
      </div>
      <div className={`flex p-0.5 w-150 h-4 bg-black border-3 border-white rounded-full`}>
        <div className={`w-92 h-full rounded-full bg-green-500`} />
      </div>
    </div>
  )
}
