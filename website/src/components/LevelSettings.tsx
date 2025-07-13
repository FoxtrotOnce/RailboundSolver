import React, { useState, useRef, useEffect } from "react";
import lvls from "../../../levels.json";
import { GridTile } from "./GridTile";
import { useGuiStore, useLevelStore } from "../store";

type LevelType = (typeof lvls)[keyof typeof lvls];

// Organize levels by world
const worlds = new Map<string, Map<string, LevelType>>();
for (const key in lvls) {
  const lvlName = key as keyof typeof lvls;
  const world: string = lvlName.slice(0, lvlName.indexOf("-"));
  const data: LevelType = lvls[lvlName];

  if (!worlds.has(world)) {
    worlds.set(world, new Map());
  }
  worlds.get(world)!.set(lvlName, data);
}

const Icons = {
  settings:
    <svg className={`w-7.25 h-7.25`} viewBox="0 0 29 29">
      <path fill="currentColor" d="M17.5 14.5a3 3 0 1 0-6 0 3 3 0 0 0 6 0Zm2 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"/>
      <path fill="currentColor" d="M16.208 1.5a3 3 0 0 1 2.752 1.806l.086.222.703 2.054 2.244-.446.235-.037a3 3 0 0 1 2.802 1.249l.13.199 1.683 2.837a3 3 0 0 1-.363 3.551L25.054 14.5l1.426 1.564a3 3 0 0 1 .363 3.552l-1.684 2.837a3 3 0 0 1-3.166 1.411l-2.244-.447-.703 2.055a3 3 0 0 1-2.838 2.028h-3.416a3 3 0 0 1-2.838-2.028l-.704-2.055-2.243.447a3 3 0 0 1-3.166-1.41l-1.684-2.838a3 3 0 0 1 .364-3.552L3.945 14.5l-1.424-1.565a3 3 0 0 1-.364-3.551l1.684-2.837a3 3 0 0 1 2.931-1.448l.235.037 2.243.446.704-2.054.086-.222A3 3 0 0 1 12.792 1.5v2a1 1 0 0 0-.945.676l-.988 2.882-.034.087a1 1 0 0 1-1.015.584l-.092-.014-3.102-.618a1 1 0 0 0-1.055.47l-1.683 2.837c-.224.379-.175.86.121 1.185l2.04 2.237a1 1 0 0 1 0 1.348l-2.04 2.237a1.001 1.001 0 0 0-.121 1.185l1.683 2.837c.189.319.537.503.899.489l.156-.019 3.102-.618a1 1 0 0 1 1.141.657l.988 2.882a1 1 0 0 0 .945.676h3.416a1 1 0 0 0 .883-.531l.062-.145.988-2.882a1 1 0 0 1 1.141-.657l3.102.618a1 1 0 0 0 .965-.342l.09-.128 1.683-2.837c.224-.378.175-.86-.121-1.185l-2.04-2.237a1 1 0 0 1 0-1.348l2.04-2.237c.296-.325.345-.806.121-1.185L23.44 7.567a1 1 0 0 0-1.055-.47l-3.102.618-.092.014a1 1 0 0 1-1.05-.671l-.987-2.882a1 1 0 0 0-.788-.663l-.157-.013v-2Zm0 0v2h-3.416v-2h3.416Z"/>
    </svg>,
  close:
    <svg className={`w-7 h-7.25`} viewBox="0 0 28 29">
      <path fill="currentColor" d="M4.414 22.086 12 14.5 4.414 6.914a1.414 1.414 0 0 1 2-2L14 12.5l7.586-7.586a1.414 1.414 0 1 1 2 2L16 14.5l7.586 7.586a1.414 1.414 0 0 1-2 2L14 16.5l-7.586 7.586a1.414 1.414 0 0 1-2-2Z"/>
    </svg>,
  delete:
    <svg className={`w-6.5 h-6.5`} viewBox="0 0 26 26">
      <path fill="currentColor" d="M14.25 2.5h-2.5a.75.75 0 0 0-.75.75.75.75 0 0 1-.75.75h-4a1.25 1.25 0 1 0 0 2.5h13.5a1.25 1.25 0 1 0 0-2.5h-4a.75.75 0 0 1-.75-.75.75.75 0 0 0-.75-.75ZM20 22.5v-12a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2l2-3a1 1 0 0 1-1-1v-8a1 1 0 1 1 2 0v8a1 1 0 0 1-1 1l-2 3h10l-2-3a1 1 0 0 1-1-1v-8a1 1 0 1 1 2 0v8a1 1 0 0 1-1 1l2 3a2 2 0 0 0 2-2Z"/>
    </svg>
}

// NOTE: max is a max number for number entries, AND the max characters in a string entry.
const EntryBox: React.FC<{
  title: string
  inputType: "string" | "number"
  warningThreshold?: number
  max?: number
}> = ({title, inputType, warningThreshold, max=100}) => {
  const { styles } = useGuiStore()

  return (
    <div className={`flex flex-col gap-1 px-2 py-1 w-full ${styles.text.text}`}>
      <span className={`font-medium`} >{title}</span>
      <input
        className={`transition-all w-full px-2 py-1 rounded-[0.25rem] border-1 ${styles.border.border} focus:outline-none focus:border-white`}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}

const SelectionButton: React.FC<{
  name: string
  onClick: () => void
}> = ({name, onClick}) => {
  const { styles } = useGuiStore()
  const [selected, setSelected] = useState(false)

  return (
    <button
      className={`transition-all flex justify-center w-full px-3 py-1 rounded-[0.25rem] font-bold border-1 cursor-pointer ${
        selected
        ? `${styles.text.bg} ${styles.base.text} ${styles.text.border}`
        : `${styles.text.text} ${styles.border.border}`
      }`}
      onClick={() => setSelected(true)}
    >
      {name}
    </button>
  )
}

export const LevelSettings: React.FC = () => {
  const { styles, displayLevelSettings } = useGuiStore()
  const { levelData } = useLevelStore()

  return (
    <div className={`relative flex flex-col gap-2 p-4 rounded-[1rem] ${styles.base.bg} border-b-1 ${styles.border.border}`}>
      <div className={`relative flex flex-row items-center justify-center gap-2 ${styles.text.text} font-bold text-[2rem]`}>
        {Icons.settings}
        <span>Level Settings</span>
        <button
          className={`absolute flex right-0 cursor-pointer ${styles.border.text} hover:brightness-85 active:brightness-70`}
          onClick={() => displayLevelSettings(false)}
        >
          {Icons.close}
        </button>
      </div>
      <div className={`flex flex-col gap-4`}>
        {/* Entries */}
        <div className={`flex flex-col w-full px-2 py-1 gap-3`}>
          <EntryBox title="Name" inputType="string" max={50} />
          <div className={`flex flex-row w-full justify-between`}>
            <EntryBox title="Max Tracks" inputType="number" warningThreshold={20} max={144} />
            <EntryBox title="Max Semaphores" inputType="number" warningThreshold={2} max={50} />
          </div>
        </div>
        <div className={`flex flex-row gap-2 h-101.5`}>
          {/* World Selection */}
          <div className={`flex flex-col gap-0.75 pl-8.5 overflow-y-auto`}>
            <SelectionButton name="Custom" onClick={() => null} />
            {[...worlds.entries()].map(([worldKey]) => (
              <SelectionButton name={`World ${worldKey}`} onClick={() => null} />
            ))}
          </div>
          {/* Grid */}
          <div className={`flex flex-col items-center gap-1`}>
            <div className={`${styles.background.bg} rounded-[0.25rem] p-3`}>
              <div className={`grid grid-cols-[repeat(12,_30px)] grid-rows-[repeat(12,_30px)] border-t-1 border-l-1 ${styles.highlight.border}`}>
                {levelData.grid.map((row, idx) =>
                  row.map((tile, jdx) => (
                    <div
                      key={`${idx}-${jdx}`}
                      className={`relative border-b-1 border-r-1 ${styles.highlight.border}`}
                    >
                      <GridTile
                        pos={{ y: idx, x: jdx }}
                        car={tile.car}
                        track={tile.track}
                        mod={tile.mod}
                        mod_num={tile.mod_num}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className={`${styles.text_active.text}`}>Last Modified: 2025-07-12 17:18</span>
          </div>
          {/* Level Selection */}
          <div className={`flex flex-col w-37.5 gap-0.75 overflow-y-auto`}>
            {[...worlds.get('11')!.entries()].map(([levelKey]) => (
              <SelectionButton name={levelKey} onClick={() => null} />
            ))}
          </div>
          {/* Delete Level Icons */}
          <div className={`flex flex-col gap-0.75 text-red-500`}>
            {[...worlds.get('11')!.entries()].map(() => (
              <div className={`cursor-pointer hover:brightness-90 active:brightness-80`}>
                {Icons.delete}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
