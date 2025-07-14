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
worlds.set("Custom", new Map())

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
    </svg>,
  caution:
    <svg className={`w-5 h-4.5`} viewBox="0 0 20 18">
      <path fill="currentColor" fill-rule="evenodd" d="M8.284 1 .27 15c-.764 1.333.19 3 1.716 3h16.03c1.526 0 2.48-1.667 1.716-3L11.716 1a1.973 1.973 0 0 0-3.432 0Zm.5.253a1.403 1.403 0 0 1 2.431 0l8.176 14.026c.553.948-.125 2.144-1.215 2.144H1.824c-1.09 0-1.768-1.196-1.215-2.144L8.785 1.253Z" clip-rule="evenodd"/>
      <path fill="currentColor" d="M10.492 1.682a.569.569 0 0 0-.985 0L1.332 15.707c-.224.385.05.87.492.87l8.12-2.447a.979.979 0 0 1-.644-.24c-.185-.16-.277-.386-.277-.68 0-.293.092-.52.277-.68a.979.979 0 0 1 .644-.24l.575-.5h-1.13c-.066-.48-.122-.952-.168-1.42-.04-.466-.06-.969-.06-1.509v-1.79h1.576v1.79c0 .54-.02 1.043-.06 1.51-.04.466-.092.94-.158 1.42l-.575.5c.238 0 .45.08.634.24.192.16.288.386.288.68 0 .293-.096.52-.288.68a.942.942 0 0 1-.634.24l-8.12 2.446h16.352a.578.578 0 0 0 .492-.87L10.493 1.682Z"/>
    </svg>,
  warning:
    <svg className={`w-4.5 h-4.75`} viewBox="0 0 18 19">
      <path fill="currentColor" fill-rule="evenodd" d="M18 9.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-8.105 4.346c.27-.224.406-.541.406-.952 0-.41-.135-.728-.406-.952A1.338 1.338 0 0 0 9 11.606c-.336 0-.64.112-.91.336-.261.224-.392.541-.392.952 0 .41.13.728.392.952.27.224.574.336.91.336.336 0 .635-.112.896-.336Zm.224-7.042c0 .756-.028 1.46-.084 2.114-.056.653-.13 1.316-.224 1.988H8.215a52.235 52.235 0 0 1-.238-1.988 24.833 24.833 0 0 1-.084-2.114V4.298h2.226v2.506Z" clip-rule="evenodd"/>
    </svg>
}

// NOTE: max is a max number for number entries, AND the max characters in a string entry.
const EntryBox: React.FC<{
  title: string
  value: string | number
  setData: (input: string | number) => void
  cautionThreshold?: number
  max?: number
}> = ({title, value, setData, cautionThreshold=999, max=100}) => {
  const { styles } = useGuiStore()
  const [status, setStatus] = useState<"valid" | "caution" | "warning">("valid")
  const [isFocused, setFocus] = useState(false)
  const [text, setText] = useState(value)
  const nums = new Set<string>(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])

  useEffect(() => {
    setText(value)
  }, [value])

  return (
    <div className={`flex flex-col px-2 py-1 w-full ${styles.text.text}`}>
      <span className={`font-medium text-[0.875rem] pb-0.5`} >{title}</span>
      <div className={`transition-all flex flex-row gap-2 w-full px-2 py-1 rounded-[0.25rem] border-1 ${styles.border.border} ${
        status === "warning" ? styles.warning.border : (isFocused && "border-white")
      }`}>
        <input
          maxLength={150}
          value={text}
          className={`w-full focus:outline-none`}
          onChange={(e) => setText(e.currentTarget.value)}
          onFocus={() => setFocus(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.currentTarget.blur()
            }
          }}
          onBlur={(e) => {
            setFocus(false)
            const input = e.currentTarget.value
            if (typeof value === "string") {
              if (input.length <= max) {
                setStatus("valid")
              } else {
                setStatus("warning")
              }
            } else {
              const count = Number(e.currentTarget.value)
              if (/^[0-9]+$/.test(input) && 0 <= count && count <= max) {
                if (count >= cautionThreshold) {
                  setStatus("caution")
                } else {
                  setStatus("valid")
                }
              } else {
                setStatus("warning")
              }
            }
          }}
        />
        {status === "warning" ?
        <div className={`${styles.warning.text}`}>
          {Icons.warning}
        </div> : (status === "caution" &&
          <div className={`${styles.caution.text}`}>
            {Icons.caution}
          </div>
        )}
      </div>
      {/* Caution/Warning Message */}
      <span className={`font-medium text-[0.625rem] ${
        status === "warning" ? styles.warning.text : (status === "caution" && styles.caution.text)
      } ${
        status !== "valid" ? "opacity-100" : "opacity-0 select-none"
      }`}>{
        status === "caution"
        ? (`Generation typically takes a while on levels with ${cautionThreshold}+ ${title}.`)
        : (typeof value === "string"
          ? `${title} must be ${max} or fewer characters.`
          : `${title} must be an integer between 0 and ${max}.`)
      }</span>
    </div>
  )
}

const SelectionButton: React.FC<{
  name: string
  selected: boolean
  onClick: () => void
}> = ({name, selected, onClick}) => {
  const { styles } = useGuiStore()

  return (
    <button
      className={`transition-all flex justify-center w-full px-3 py-1 rounded-[0.25rem] font-bold border-1 cursor-pointer ${
        selected
        ? `${styles.text.bg} ${styles.base.text} ${styles.text.border}`
        : `${styles.text.text} ${styles.border.border}`
      }`}
      onClick={onClick}
    >
      {name}
    </button>
  )
}

export const LevelSettings: React.FC = () => {
  const { styles, displayLevelSettings } = useGuiStore()
  const [selectedWorld, setSelectedWorld] = useState('11')
  const { levelData, setLevelName, setTracks, setSemaphores, loadLevel } = useLevelStore()

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
        <div className={`flex flex-col w-full px-2 py-1`}>
          <EntryBox
            title="Name"
            value={levelData.name}
            setData={(input) => setLevelName(input as string)}
            max={50}
          />
          <div className={`flex flex-row w-full justify-between`}>
            <EntryBox
              title="Max Tracks"
              value={levelData.max_tracks}
              setData={(input) => setTracks(input as number)}
              cautionThreshold={16}
              max={142}
            />
            <EntryBox
              title="Max Semaphores"
              value={levelData.max_semaphores}
              setData={(input) => setSemaphores(input as number)}
              cautionThreshold={2}
              max={12}
            />
          </div>
        </div>
        <div className={`flex flex-row gap-2`}>
          {/* World Selection */}
          <div className={`flex flex-col gap-0.75 pl-4 ml-7 overflow-y-auto h-96`} dir="rtl">
            <SelectionButton name="Custom" selected={selectedWorld === "Custom"} onClick={() => setSelectedWorld("Custom")} />
            {[...worlds.entries()].map(([worldKey]) => (
              <SelectionButton name={`World ${worldKey}`} selected={selectedWorld === worldKey} onClick={() => setSelectedWorld(worldKey)} />
            ))}
          </div>
          {/* Grid */}
          <div className={`flex flex-col items-center gap-1`}>
            <div className={`relative ${styles.background.bg} rounded-[0.25rem] p-3`}>
              <div className={`group flex items-center justify-center w-90 h-90`}>
                <div
                  className={`grid border-t-1 border-l-1 ${styles.highlight.border}`}
                  style={{
                    gridTemplateColumns: `repeat(${levelData.width}, 30px)`,
                    gridTemplateRows: `repeat(${levelData.height}, 30px)`,
                  }}
                >
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
                          disabled={true}
                        />
                      </div>
                    ))
                  )}
                </div>
                <div className={`transition-all w-full h-full duration-300 absolute flex flex-col gap-2 items-center justify-center opacity-0 group-hover:opacity-100`}>
                  <div className={`absolute w-full h-full bg-black opacity-50 rounded-[0.25rem]`} />
                  <button
                    className={`cursor-pointer w-fit px-2.5 py-2 rounded-[0.25rem] text-[1.5rem] font-bold ${styles.background.text} ${styles.text.bg} z-1`}
                  >
                    Select
                  </button>
                  <button
                    className={`cursor-pointer w-fit px-2.5 py-2 rounded-[0.25rem] text-[1.5rem] font-bold ${styles.background.text} bg-green-500 z-1`}
                  >
                    View Solution
                  </button>
                </div>
              </div>
            </div>
            <span className={`${styles.text_active.text}`}>Last Modified: 2025-07-12 17:18</span>
          </div>
          {/* Level Selection */}
          <div className={`flex flex-col gap-0.75 w-48 overflow-y-auto h-96`}>
            {[...worlds.get(selectedWorld)!.entries()].map(([levelKey]) => (
              <div className={`group flex flex-row gap-1 mr-3`}>
                <div className={`w-37.5`}>
                  <SelectionButton name={levelKey} selected={levelData.name === levelKey} onClick={() => loadLevel(worlds.get(selectedWorld)!.get(levelKey)!, levelKey)} />
                </div>
                <div className={`text-red-500 hover:brightness-90 active:brightness-80 opacity-0 ${
                  selectedWorld === "Custom" && "cursor-pointer group-hover:opacity-100"
                }`}>
                  {Icons.delete}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
