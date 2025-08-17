import React, { useState, useRef, useEffect } from "react";
import lvls from "../../../levels.json";
import { GridTile } from "./GridTile";
import { useGuiStore, useLevelStore } from "../store";
import type { LevelData } from "../store/levelStore";

type LevelType = (typeof lvls)[keyof typeof lvls];

// Organize levels by world, and fetch levels via their id.
const worldsRaw = new Map<string, Record<string, LevelData>>();
for (const key in lvls) {
  const { convertJsonLevel } = useLevelStore.getState()
  const lvlName = key as keyof typeof lvls;
  const world: string = lvlName.slice(0, lvlName.indexOf("-"));
  const data: LevelType = lvls[lvlName];
  const jsonData = convertJsonLevel(data, lvlName)

  if (!worldsRaw.has(world)) {
    worldsRaw.set(world, {});
  }
  worldsRaw.set(world, {...worldsRaw.get(world)!, [jsonData.id.toString()]: jsonData})
}
worldsRaw.set("Custom", {})

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
    <svg className={`w-5 h-5`} viewBox="0 0 20 20">
      <path fill="currentColor" d="M11.136 0H8.864a.682.682 0 0 0-.682.682.682.682 0 0 1-.682.682H3.864a1.136 1.136 0 1 0 0 2.272h12.272a1.136 1.136 0 0 0 0-2.272H12.5a.682.682 0 0 1-.682-.682.682.682 0 0 0-.682-.682ZM16.364 18.182V7.272a1.818 1.818 0 0 0-1.819-1.817h-9.09a1.818 1.818 0 0 0-1.819 1.818v10.909c0 1.004.814 1.818 1.819 1.818l1.818-2.727a.91.91 0 0 1-.91-.91V9.092a.91.91 0 0 1 1.819 0v7.273a.91.91 0 0 1-.91.909L5.456 20h9.09l-1.818-2.727a.91.91 0 0 1-.909-.91V9.092a.91.91 0 1 1 1.818 0v7.273a.91.91 0 0 1-.909.909L14.545 20a1.818 1.818 0 0 0 1.819-1.818Z"/>
    </svg>,
  caution:
    <svg className={`w-5 h-4.5`} viewBox="0 0 20 18">
      <path fill="currentColor" fill-rule="evenodd" d="M8.284 1 .27 15c-.764 1.333.19 3 1.716 3h16.03c1.526 0 2.48-1.667 1.716-3L11.716 1a1.973 1.973 0 0 0-3.432 0Zm.5.253a1.403 1.403 0 0 1 2.431 0l8.176 14.026c.553.948-.125 2.144-1.215 2.144H1.824c-1.09 0-1.768-1.196-1.215-2.144L8.785 1.253Z" clip-rule="evenodd"/>
      <path fill="currentColor" d="M10.492 1.682a.569.569 0 0 0-.985 0L1.332 15.707c-.224.385.05.87.492.87l8.12-2.447a.979.979 0 0 1-.644-.24c-.185-.16-.277-.386-.277-.68 0-.293.092-.52.277-.68a.979.979 0 0 1 .644-.24l.575-.5h-1.13c-.066-.48-.122-.952-.168-1.42-.04-.466-.06-.969-.06-1.509v-1.79h1.576v1.79c0 .54-.02 1.043-.06 1.51-.04.466-.092.94-.158 1.42l-.575.5c.238 0 .45.08.634.24.192.16.288.386.288.68 0 .293-.096.52-.288.68a.942.942 0 0 1-.634.24l-8.12 2.446h16.352a.578.578 0 0 0 .492-.87L10.493 1.682Z"/>
    </svg>,
  warning:
    <svg className={`w-4.5 h-4.75`} viewBox="0 0 18 19">
      <path fill="currentColor" fill-rule="evenodd" d="M18 9.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-8.105 4.346c.27-.224.406-.541.406-.952 0-.41-.135-.728-.406-.952A1.338 1.338 0 0 0 9 11.606c-.336 0-.64.112-.91.336-.261.224-.392.541-.392.952 0 .41.13.728.392.952.27.224.574.336.91.336.336 0 .635-.112.896-.336Zm.224-7.042c0 .756-.028 1.46-.084 2.114-.056.653-.13 1.316-.224 1.988H8.215a52.235 52.235 0 0 1-.238-1.988 24.833 24.833 0 0 1-.084-2.114V4.298h2.226v2.506Z" clip-rule="evenodd"/>
    </svg>,
  newLevel:
    <svg className={`w-5 h-5`} viewBox="0 0 20 20">
      <path fill="currentColor" fill-rule="evenodd" d="M10 20c5.523 0 10-4.477 10-10S15.523 0 10 0 0 4.477 0 10s4.477 10 10 10Zm1.364-11.364v-4.09H8.636v4.09h-4.09v2.728h4.09v4.09h2.728v-4.09h4.09V8.636h-4.09Z" clip-rule="evenodd"/>
    </svg>,
  duplicate:
    <svg className={`w-5 h-5`} viewBox="0 0 20 20">
      <path fill="currentColor" d="M17.006 18.182V20H6.63v-1.818h10.375Zm1.176-1.176V6.63c0-.65-.527-1.176-1.176-1.176H6.63c-.65 0-1.176.527-1.176 1.176v10.375c0 .65.527 1.176 1.176 1.176V20l-.154-.004A2.995 2.995 0 0 1 3.64 17.16l-.004-.154V6.63a2.995 2.995 0 0 1 2.841-2.99l.154-.005h10.375l.154.004A2.995 2.995 0 0 1 20 6.631v10.375l-.004.154a2.994 2.994 0 0 1-2.836 2.836l-.154.004v-1.818c.65 0 1.176-.527 1.176-1.176Z"/>
      <path fill="currentColor" d="M12.728 8.636v2.728h2.726v1.818h-2.726V15.91h-1.819V13.182H8.182v-1.818h2.727V8.636h1.819Z"/>
      <path fill="currentColor" fill-rule="evenodd" d="M5.455 16.363h-2.46l-.154-.004a2.995 2.995 0 0 1-2.837-2.836L0 13.37V2.995A2.995 2.995 0 0 1 2.84.004L2.996 0H13.37l.154.004a2.995 2.995 0 0 1 2.84 2.991v2.46h-1.817v-2.46c0-.65-.527-1.177-1.177-1.177H2.995c-.65 0-1.177.527-1.177 1.177V13.37c0 .65.527 1.177 1.177 1.177h2.46v1.817Zm9.09-5v1.82h.91v-1.82h-.91Zm-3.636 3.183h1.819v1.363h-1.819v-1.363Z" clip-rule="evenodd"/>
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
  const { permLevelData } = useLevelStore()
  const [status, setStatus] = useState<"valid" | "caution" | "warning">("valid")
  const [isFocused, setFocus] = useState(false)
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
    onBlur(value)
  }, [permLevelData.id])

  const onBlur = (text: string | number) => {
    setFocus(false)

    if (typeof value === "string") {
      if ((text as string).length <= max) {
        setStatus("valid")
        setData(text)
      } else {
        setStatus("warning")
      }
    } else {
      const count = Number(text)
      // The number is valid if it is only made of numbers (0-9) and is between 0-max.
      if (/^[0-9]+$/.test(text.toString()) && 0 <= count && count <= max) {
        if (count >= cautionThreshold) {
          setStatus("caution")
        } else {
          setStatus("valid")
        }
        setData(count)
      } else {
        setStatus("warning")
      }
    }
  }

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
          onBlur={() => onBlur(text)}
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

// Selection Buttons for world selection and level selection
const SelectionButton: React.FC<{
  name: string
  selected: boolean
  onClick: () => void
}> = ({name, selected, onClick}) => {
  const { styles } = useGuiStore()
  // const testref = useRef<HTMLButtonElement | null>(null)

  // useEffect(() => {
  //   console.log(testref.current?.scrollHeight)
  // }, [])

  return (
    <button
      className={`transition-all flex justify-center w-full px-3 py-1 rounded-[0.25rem] font-bold border-1 cursor-pointer ${
        selected
        ? `${styles.text.bg} ${styles.base.text} ${styles.text.border}`
        : `${styles.text.text} ${styles.border.border}`
      }`}
      onClick={onClick}
    >
      <div className="truncate">
        {name || <span className="invisible">&nbsp;</span>}
      </div>
    </button>
  )
}

const StatisticSlider: React.FC<{
  name: string
  used: number
  max: number
}> = ({name, used, max}) => {
  const { styles } = useGuiStore()

  return (
    <div className={`flex flex-col gap-0.5`}>
      <div className={`flex flex-row justify-between font-medium text-[0.875rem] ${styles.text.text}`}>
        <span>{name}</span>
        <span>{used}/{max}</span>
      </div>
      <div className={`w-full h-4 p-0.5 rounded-[0.25rem] border-2 ${styles.text.border} bg-black`}>
        <div className={`h-full ${styles.mods[2].bg}`} style={{width: `${used / max * 100}%`}}/>
      </div>
    </div>
  )
}

export const LevelSettings: React.FC = () => {
  const { styles, displayLevelSettings } = useGuiStore()
  const [selectedWorld, setSelectedWorld] = useState('11')
  const { permLevelData, savedLevels, setLevelName, setTracks, setSemaphores, loadLevel, createDefaultLevel } = useLevelStore()
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [ bottomH, setBottomH ] = useState(0)  
  const [ worlds, setWorlds ] = useState(worldsRaw)

  // Use bottomH to set the height for the parent div to be the same as the grid, so world and level selection overflow at the same height.
  useEffect(() => {
    if (gridRef.current !== null) {
      setBottomH(gridRef.current.scrollHeight)
    }
  }, [gridRef, setBottomH])

  // Trigger a re-render when savedLevels are changed by setting updatedWorlds to a new variable (a copy of itself with the changes)
  useEffect(() => {
    const updatedWorlds = new Map(worlds)
    updatedWorlds.set("Custom", Object.fromEntries(Object.entries(savedLevels).map(([id, level]) => [id, level])))
    setWorlds(updatedWorlds)
  }, [savedLevels, permLevelData])

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
      <div className={`flex flex-col gap-0.5`}>
        {/* Inputs */}
        <div className={`flex flex-col w-full px-2 py-1`}>
          <EntryBox
            title="Name"
            value={permLevelData.name}
            setData={(input) => setLevelName(input as string)}
            max={100}
          />
          <div className={`flex flex-row w-full justify-between`}>
            <EntryBox
              title="Max Tracks"
              value={permLevelData.max_tracks}
              setData={(input) => setTracks(input as number)}
              cautionThreshold={16}
              max={142}
            />
            <EntryBox
              title="Max Semaphores"
              value={permLevelData.max_semaphores}
              setData={(input) => setSemaphores(input as number)}
              cautionThreshold={2}
              max={12}
            />
          </div>
        </div>
        {/* Selection + Grid Viewer + Statistics */}
        <div className={`flex flex-row gap-2`} style={{height: `${bottomH}px`}}>
          {/* World Selection */}
          <div className={`flex flex-col gap-0.75`}>
            <span className={`pl-4 ml-7 text-center font-medium text-[0.875rem] ${styles.text.text}`}>Worlds</span>
            <div className={`flex flex-col gap-0.75 pl-4 ml-7 overflow-y-auto grow-0`} dir="rtl">
              <SelectionButton name="Custom" selected={selectedWorld === "Custom"} onClick={() => setSelectedWorld("Custom")} />
              {[...worlds.entries()].map(([worldKey]) => (
                worldKey !== "Custom" &&
                <SelectionButton name={`World ${worldKey}`} selected={selectedWorld === worldKey} onClick={() => setSelectedWorld(worldKey)} />
              ))}
            </div>
          </div>
          <div className={`flex flex-row`}>
            {/* Grid */}
            <div ref={gridRef} className={`flex flex-col items-center gap-0.75 h-fit`}>
              <span className={`flex text-center font-medium text-[0.875rem] w-96 ${styles.text.text}`}>
                <span className={`w-full truncate`}>
                  Currently Selected:{" "}
                  <i>{permLevelData.name}</i>
                </span>
              </span>
              <div className={`relative ${styles.background.bg} rounded-[0.25rem] rounded-br-[0rem] p-3 overflow-hidden`}>
                <div className={`flex items-center justify-center w-90 h-90`}>
                  <div
                    className={`grid border-t-1 border-l-1 ${styles.highlight.border}`}
                    style={{
                      gridTemplateColumns: `repeat(${permLevelData.grid[0].length}, 30px)`,
                      gridTemplateRows: `repeat(${permLevelData.grid.length}, 30px)`,
                    }}
                  >
                    {permLevelData.grid.map((row, idx) =>
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
                </div>
              </div>
            </div>
            {/* Level Selection + Statistics */}
            <div className={`flex flex-col ${styles.background.bg} h-full`}>
              {/* Level Selection */}
              <div className={`flex w-50 flex-col gap-0.75 pb-1.5 rounded-bl-[0.25rem] ${styles.base.bg} h-full overflow-hidden`}>
                <span className={`text-center font-medium text-[0.875rem] ${styles.text.text}`}>Levels</span>
                <div className={`flex flex-col gap-0.75 px-2 overflow-y-auto h-full`}>
                  {Object.entries(worlds.get(selectedWorld)!).map(([levelKey]) => {
                    const level = worlds.get(selectedWorld)![levelKey]
                    return <SelectionButton
                      name={level.name}
                      selected={permLevelData.id === level.id}
                      onClick={() => loadLevel(level)
                    }/>
                  })}
                </div>
              </div>
              {/* Dashboard */}
              <div className={`${styles.base.bg}`}>
                <div className={`flex flex-col w-50 gap-1.5 pl-2 pr-4 pt-2 pb-2.5 rounded-tr-[0.25rem] rounded-br-[0.25rem] ${styles.background.bg}`}>
                  <div className={`flex flex-row gap-3 items-center`}>
                    <div className={`w-full h-0.25 ${styles.border.bg}`}/>
                    <span className={`font-medium text-[0.875rem] ${styles.text.text}`}>Dashboard</span>
                    <div className={`w-full h-0.25 ${styles.border.bg}`}/>
                  </div>
                  {/* Actions */}
                  <div className={`flex flex-row justify-between`}>
                    <div className={`flex flex-row gap-2 ${styles.text.text}`}>
                      <button
                        className={`transition-all cursor-pointer hover:brightness-85 active:brightness-70`}
                        onClick={() => {
                          setSelectedWorld("Custom")
                          const newLevel = createDefaultLevel()
                          savedLevels[newLevel.id] = newLevel
                          loadLevel(newLevel)
                        }}
                      >
                        {Icons.newLevel}
                      </button>
                      <button
                        className={`transition-all cursor-pointer hover:brightness-85 active:brightness-70`}
                        onClick={() => {
                          const newLevel = {...permLevelData}
                          newLevel.id = createDefaultLevel().id
                          savedLevels[newLevel.id] = newLevel
                          loadLevel(newLevel)
                        }}
                      >
                        {Icons.duplicate}
                      </button>
                    </div>
                    <button
                      className={`transition-all text-red-500 cursor-pointer hover:brightness-85 active:brightness-70`}
                      onClick={() => {
                        if (!(permLevelData.id in savedLevels)) {
                          console.log("Level is custom and therefore cannot be deleted.")
                          return
                        }
                        delete savedLevels[permLevelData.id]
                        const levels = Object.values(savedLevels)
                        if (levels.length === 0) {
                          setSelectedWorld("1")
                          loadLevel(Object.values(worlds.get("1")!)[0])
                        } else {
                          loadLevel(Object.values(savedLevels)[0])
                        }
                      }}
                    >
                      {Icons.delete}
                    </button>
                  </div>
                  {/* Statistics */}
                  <StatisticSlider name="Tracks Used" used={permLevelData.max_tracks} max={permLevelData.max_tracks} />
                  <StatisticSlider name="Semaphores Used" used={Math.floor(permLevelData.max_semaphores / 2)} max={permLevelData.max_semaphores} />
                  <div className={`flex flex-row justify-between font-medium text-[0.875rem] ${styles.text.text}`}>
                    <span>Iterations:</span>
                    <span>{"45,327,981,605"}</span>
                  </div>
                  <div className={`flex flex-row justify-between font-medium text-[0.875rem] ${styles.text.text}`}>
                    <span>Time Elapsed:</span>
                    <span>{"13:48:29.756"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
