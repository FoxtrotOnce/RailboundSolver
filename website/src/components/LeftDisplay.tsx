import React from "react";
import { useGuiStore } from "../store";
import type { Hyperparameters } from "../store/guiStore";
import { useState, useEffect, useRef } from "react";

const Icons = {
  controls:
    <svg className={`w-7 h-7`} viewBox="0 0 28 28">
      <path fill="currentColor" d="M9 6C7.962 5 4.5 5 3.5 6S2 16.667 2 18c0 1.333 0 4 3.53 4 1.744 0 4.485-3.018 5.395-4.08.197-.23.482-.364.784-.364h4.681c.308 0 .597.14.794.376.894 1.072 3.548 4.068 5.287 4.068C26 22 26 19.333 26 18c0-1.333-.5-11-1.5-12S20.038 5 19 6l2.5 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3L19 6c-1.038 1-2 1-2 1v7a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0V7h-6s-.961 0-2-1v5.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H9a.5.5 0 0 0-.5.5v1a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 0-.5-.5H5a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 0 .5.5V6Z"/>
    </svg>,
  solve_history:
    <svg className={`w-7 h-7`} viewBox="0 0 28 28">
      <path fill="currentColor" d="M15 7v6.465l2.555 1.703-1.11 1.664L13 14.535V7h2Z"/>
      <path fill="currentColor" d="M4 14H2c0 6.75 5.5 12 12 12s12-5.5 12-12S20.75 2 14 2c-4 0-6.46 1.886-6.46 1.886L6 1 2 8.5h8L8.486 5.661S10.5 4 14 4c5.5 0 10 4.5 10 10s-4.5 10-10 10S4 19.5 4 14Z"/>
    </svg>,
  parameters:
    <svg className={`w-7 h-7`} viewBox="0 0 28 28">
      <path fill="currentColor" d="M11 23a2 2 0 1 0-2 2v2a4 4 0 1 1 0-8 4 4 0 0 1 0 8v-2a2 2 0 0 0 2-2Zm10-9a2 2 0 1 0-4 0 2 2 0 0 0 2 2v2a4 4 0 1 1 0-8 4 4 0 0 1 0 8v-2a2 2 0 0 0 2-2Zm-6-9a2 2 0 1 0-4 0 2 2 0 0 0 2 2v2a4 4 0 1 1 0-8 4 4 0 0 1 0 8V7a2 2 0 0 0 2-2Z"/>
      <path fill="currentColor" fill-rule="evenodd" d="M11.268 6H2a1 1 0 0 1 0-2h9.268A1.99 1.99 0 0 0 11 5c0 .364.097.706.268 1Zm3.464 0H26a1 1 0 1 0 0-2H14.732c.17.294.268.636.268 1s-.097.706-.268 1ZM17.268 15H2a1 1 0 1 1 0-2h15.268A1.99 1.99 0 0 0 17 14c0 .364.097.706.268 1Zm3.464 0H26a1 1 0 1 0 0-2h-5.268c.17.294.268.636.268 1s-.097.706-.268 1ZM7.268 24H2a1 1 0 1 1 0-2h5.268A1.99 1.99 0 0 0 7 23c0 .364.097.706.268 1Zm3.464 0H26a1 1 0 1 0 0-2H10.732c.17.294.268.636.268 1s-.097.706-.268 1Z" clip-rule="evenodd"/>
    </svg>,
  contact:
    <svg className={`w-7 h-7`} viewBox="0 0 28 28">
      <path fill="currentColor" fill-rule="evenodd" d="M4 3h20a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H13.937a2 2 0 0 0-1.537.72l-2.632 3.158c-.599.719-1.768.295-1.768-.64V23a2 2 0 0 0-2-2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4h16a1 1 0 1 1 0 2H6a1 1 0 0 1 0-2Zm0 4h16a1 1 0 1 1 0 2H6a1 1 0 1 1 0-2Zm0 4h10a1 1 0 1 1 0 2H6a1 1 0 1 1 0-2Z" clip-rule="evenodd"/>
    </svg>,
  credits:
    <svg className={`w-7 h-7`} viewBox="0 0 28 28">
      <g fill="currentColor" clip-path="url(#clip0_2196_81)">
        <path d="M14 27c8 0 8-3 8-3 0-2.943-.347-5.54-2.06-7.178a5.374 5.374 0 0 0-1.062-.788s-.038.04-.11.107a7.28 7.28 0 0 1-2.011 1.283A6.947 6.947 0 0 1 14 18a6.95 6.95 0 0 1-2.757-.576 7.285 7.285 0 0 1-2.01-1.283c-.073-.067-.11-.107-.11-.107-.403.23-.756.493-1.064.788C6.347 18.46 6 21.057 6 24c0 0 0 3 8 3Z"/>
        <path d="M19 11a5 5 0 0 1-9.465 2.254 5.018 5.018 0 0 1-.418-3.338A5.002 5.002 0 0 1 19 11Z"/>
        <path fill-rule="evenodd" d="M19 11a5 5 0 0 1-9.465 2.254 5.018 5.018 0 0 1-.418-3.338A5.002 5.002 0 0 1 19 11Zm2.676 4.736a3.75 3.75 0 1 0-1.121-7.198c.288.766.445 1.596.445 2.462 0 1.249-.33 2.42-.902 3.435.617.38 1.139.818 1.578 1.301ZM7.445 8.54A6.985 6.985 0 0 0 7 11c0 1.248.329 2.42.901 3.435a7.256 7.256 0 0 0-1.578 1.301 3.75 3.75 0 1 1 1.122-7.198Zm18.214 7.237s-1.117 1.169-2.95 1.425c1.102 2.041 1.286 4.509 1.29 6.7C28 23.467 28 21.75 28 21.75c0-2.604-.362-4.847-2.341-5.974Zm-5.718 1.046C21.653 18.46 22 21.057 22 24c0 0 0 3-8 3s-8-3-8-3c0-2.943.347-5.54 2.06-7.178.307-.295.66-.559 1.062-.788 0 0 .038.04.11.107.259.239.96.831 2.011 1.283A6.95 6.95 0 0 0 14 18a6.947 6.947 0 0 0 2.757-.576 7.28 7.28 0 0 0 2.01-1.283c.073-.067.11-.107.11-.107.403.23.756.493 1.064.788ZM4 23.902c.004-2.192.187-4.66 1.29-6.701-1.833-.257-2.95-1.425-2.95-1.425C.361 16.903 0 19.146 0 21.75c0 0 0 1.717 4 2.151Z" clip-rule="evenodd"/>
      </g>
      <defs>
        <clipPath id="clip0_2196_81">
          <path fill="currentColor" d="M0 28V0h28v28z"/>
        </clipPath>
      </defs>
    </svg>,
  discord: 
    <svg className={`w-6 h-4.5`} viewBox="0 0 24 18">
      <g clip-path="url(#clip0_2175_18)">
        <path fill="currentColor" d="M15.216 0c-.232.412-.44.838-.63 1.274a18.35 18.35 0 0 0-5.437 0A12.728 12.728 0 0 0 8.52 0a19.79 19.79 0 0 0-4.9 1.51C.52 6.1-.318 10.57.098 14.98a19.696 19.696 0 0 0 6.01 3.016c.488-.653.919-1.35 1.288-2.074a13.02 13.02 0 0 1-2.027-.966c.17-.123.337-.251.498-.374a14.11 14.11 0 0 0 12.014 0c.16.133.326.26.497.374-.649.384-1.326.706-2.032.97.37.725.8 1.421 1.288 2.075a19.687 19.687 0 0 0 6.01-3.012c.492-5.114-.843-9.547-3.528-13.473A19.486 19.486 0 0 0 15.22.01L15.216 0ZM7.928 12.265c-1.17 0-2.14-1.06-2.14-2.372 0-1.312.932-2.378 2.135-2.378 1.203 0 2.16 1.07 2.14 2.378-.019 1.307-.942 2.372-2.135 2.372Zm7.89 0c-1.175 0-2.137-1.06-2.137-2.372 0-1.312.933-2.378 2.136-2.378s2.155 1.07 2.136 2.378c-.02 1.307-.943 2.372-2.136 2.372Z"/>
      </g>
      <defs>
        <clipPath id="clip0_2175_18">
          <path fill="currentColor" d="M0 0h23.746v18H0z"/>
        </clipPath>
      </defs>
    </svg>,
  github:
    <svg className={`w-5 h-4.5`} viewBox="0 0 20 18">
      <g clip-path="url(#clip0_2175_13)">
        <path fill="currentColor" fill-rule="evenodd" d="M9.906 0C4.84 0 .746 4.125.746 9.228a9.22 9.22 0 0 0 6.263 8.755c.455.091.622-.199.622-.443 0-.214-.015-.948-.015-1.712-2.548.55-3.079-1.1-3.079-1.1-.41-1.07-1.016-1.344-1.016-1.344-.834-.565.06-.565.06-.565.926.06 1.411.947 1.411.947.82 1.405 2.138 1.008 2.67.764.075-.596.318-1.009.576-1.238-2.033-.214-4.17-1.008-4.17-4.553 0-1.008.363-1.833.94-2.475-.092-.229-.41-1.176.09-2.444 0 0 .774-.245 2.518.947a8.807 8.807 0 0 1 2.29-.306 8.81 8.81 0 0 1 2.29.306c1.744-1.192 2.517-.947 2.517-.947.501 1.268.182 2.215.091 2.444.592.642.94 1.467.94 2.475 0 3.545-2.138 4.324-4.185 4.553.334.29.622.84.622 1.711 0 1.238-.015 2.231-.015 2.537 0 .244.166.534.621.443a9.221 9.221 0 0 0 6.264-8.755C19.066 4.125 14.956 0 9.906 0Z" clip-rule="evenodd"/>
      </g>
      <defs>
        <clipPath id="clip0_2175_13">
          <path fill="currentColor" d="M.746 0H19.12v18H.746z"/>
        </clipPath>
      </defs>
    </svg>
}

const Separator: React.FC = () => {
  const { styles } = useGuiStore();

  return (
    <div className={`flex-shrink-0 ${styles.border.bg} h-0.25 rounded-full`} />
  )
}

const AccordionCard: React.FC<{
  title: string;
  icon: React.ReactElement
  children?: React.ReactNode
}> = ({title, icon, children}) => {
  const { styles } = useGuiStore();
  const ref = useRef<HTMLDivElement | null>(null);
  // Make Controls display by default when the page is loaded
  const [collapsed, setCollapsed] = useState(title === "Controls");

  // Content height is set here so that h-0 <-> h-fit can be animated
  useEffect(() => {
    const content = ref.current
    if (content !== null) {
      if (collapsed) {
        content.style.height = `${content.scrollHeight / 16}rem`
      } else {
        content.style.height = "0"
      }
    }
  }, [collapsed])

  return (
    <div className={`flex flex-col justify-center gap-2 p-2`}>
      <div className={`flex flex-row items-center justify-between`}>
        <div className={`flex flex-row items-center gap-2`}>
          <div className={`${styles.text.text}`}>
            {icon}
          </div>
          <span className={`${styles.text.text} font-medium text-[1.5rem] whitespace-nowrap`}>
            {title}
          </span>
        </div>
        {/* Collapse/expand button */}
        <div className={`flex flex-row justify-end cursor-pointer w-full py-2`} onClick={() => {setCollapsed(!collapsed)}}>
          <svg
            className={`transition-all ${styles.text.text} w-5.5 h-4 ${
              collapsed ? "rotate-0" : "rotate-180"
            }`}
            viewBox="0 0 22 12"
          >
            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 1 11 11 1 1"/>
          </svg>
        </div>
      </div>
      <div ref={ref} className={`transition-all overflow-hidden`}>
        {children}
      </div>
    </div>
  )
}

const ParameterInfo: React.FC<{
  info: React.ReactNode
  color?: string
}> = ({info, color}) => {
  const { styles } = useGuiStore()
  info

  return (
    // Note: description text should be text-sm (or whatever rem size) when it gets added
    <div className={`flex flex-row items-center w-4.5 h-4.5 justify-center rounded-full border-1 font-medium text-[0.875rem] select-none ${
      color ? color : styles.border.border
    }`}>
      ?
    </div>
  )
}

const Parameter: React.FC<{
  param: keyof Hyperparameters;
  description: React.ReactNode
  resetFunc: CallableFunction;
  children?: React.ReactNode
}> = ({param, description, resetFunc, children}) => {
  const { styles, hyperparameters } = useGuiStore()

  return (
    <div className={`flex flex-col gap-1.5`}>
      <div className={`flex flex-row text-[1.25rem] justify-between`}>
        <div className={`font-mono`}>
          {`${param.toString().toUpperCase()} = ${hyperparameters[param]}`}
        </div>
        <div className={`flex flex-row items-center gap-4 font-medium text-[0.875rem] select-none`}>
          <ParameterInfo info={description} />
          <button
            className={`transition-all flex flex-row items-center justify-center px-2 py-0.25 bg-white rounded-[0.25rem] ${styles.base.text} cursor-pointer hover:${styles.text_hover.bg} active:${styles.text_active.bg}`}
            onClick={() => resetFunc()}
          >
            Reset
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

const ParameterSlider: React.FC<{
  param: "heatmap_limit_limit" | "decoy_heatmap_limit";
  min: number;
  max: number;
}> = ({param, min, max}) => {
  const { styles, setHyperparams, hyperparameters } = useGuiStore()
  const [ sliderSelected, selectSlider ] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const value = hyperparameters[param]

  const setWidth = (newValue: number) => {
    const slider = sliderRef.current
    const track = trackRef.current

    if (slider !== null && track !== null) {
      const trackWidth = track.scrollWidth

      slider.style.width = `${newValue / max * trackWidth}px`
    }
  }

  useEffect(() => {
    const mouseup = () => {
      selectSlider(false)
      document.body.style.userSelect = ""
    }
    const mousemove = (e: MouseEvent) => {
      const slider = sliderRef.current
      const track = trackRef.current
      if (sliderSelected && slider !== null && track !== null) {
        document.body.style.userSelect = "none"
        const sliderRect = slider.getBoundingClientRect()
        const trackWidth = track.scrollWidth
        const newValue = Math.round(Math.min(Math.max(e.clientX - sliderRect.left, 0), trackWidth) / trackWidth * max)

        setWidth(newValue)

        if (param === "heatmap_limit_limit") {
          setHyperparams(newValue)
        } else {
          setHyperparams(undefined, newValue)
        }
      }
    }
    

    window.addEventListener("mouseup", mouseup)
    window.addEventListener("mousemove", mousemove)
    return () => {
      removeEventListener("mouseup", mouseup)
      removeEventListener("mousemove", mousemove)
    }
  }, [selectSlider, setWidth, sliderRef, trackRef])

  useEffect(() => {
    setWidth(value)
  }, [value])

  return (
    <div className={`flex flex-row gap-3.5 items-center font-mono`}>
      {min}
      <div className={`flex flex-row items-center w-full p-0.25 h-1.5 relative`}>
        <div ref={trackRef} className={`w-full h-full ${styles.border.bg} rounded-full`} />
        <div ref={sliderRef} className={`absolute flex h-full items-center`} >
          <div className={`absolute w-full h-full ${styles.text.text} rounded-full bg-white`} />
          <div className={`absolute flex items-center justify-center group right-0`} >
            <div className={`transition-all absolute w-3 h-3 ${styles.text.text} rounded-full bg-white group-hover:w-4 group-hover:h-4 group-active:w-4 group-active:h-4`} />
            <div
              className={`transition-all absolute w-7 h-7 ${styles.text.text} rounded-full bg-white cursor-pointer opacity-20`}
              onMouseDown={() => selectSlider(true)}
            />
          </div>
        </div>
      </div>
      {max}
    </div>
  )
}

const CreditsUser: React.FC<{
  name: string;
  details: string;
  github_name: string;
  discord_uid: number;
}> = ({name, details, github_name, discord_uid}) => {
  const { styles } = useGuiStore();

  return (
    <div className={`flex flex-row w-full gap-1 ${styles.text.text}`}>
      <div className={`flex flex-row gap-1`}>
        <a className={`cursor-pointer w-fit h-fit`} href={`https://discord.com/users/${discord_uid}`} target="_blank" rel="noopener noreferrer">
          {Icons.discord}
        </a>
        <a className={`cursor-pointer w-fit h-fit`} href={`https://github.com/${github_name}`} target="_blank" rel="noopener noreferrer">
          {Icons.github}
        </a>
      </div>
      <span>
        <span className={`font-medium`}>{name}</span> - {details}
      </span>
    </div>
  )
}

export const LeftDisplay: React.FC = () => {
  const { styles, setHyperparams, getDefaultHyperparams, showLeftDisplay, toggleLeftDisplay } = useGuiStore();
  const flexRef = useRef<HTMLDivElement | null>(null);
  const widthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const flexFrame = flexRef.current
    const widthFrame = widthRef.current
    if (flexFrame !== null && widthFrame !== null) {
      if (showLeftDisplay) {
        flexFrame.style.width = `${widthFrame.offsetWidth}px`
      } else {
        flexFrame.style.width = "0px"
      }
    }
  }, [showLeftDisplay])

  return (
    // <div className="absolute flex flex-col inset-3 right-0 text-white gap-2 overflow-auto">
    //   <div className="flex flex-col h-fit p-3 bg-gray-800 border-2 rounded-lg border-gray-600 gap-2">
    //     <div className="flex justify-center font-bold text-xl">
    //       RailboundSolver
    //     </div>
    //     <div className="text-md">
    //       RailboundSolver is a logic-based solving algorithm designed to find
    //       the "best" solution that{" "}
    //       <span className="font-semibold text-yellow-300">
    //         uses the least tracks
    //       </span>{" "}
    //       for any level configuration from the game{" "}
    //       <a
    //         href="https://store.steampowered.com/app/1967510/Railbound/"
    //         className="text-blue-400 hover:underline"
    //         target="_blank"
    //       >
    //         Railbound
    //       </a>
    //       .
    //     </div>
    //   </div>
    //   {/* TODO: make this a popup when the page is loaded instead */}
    //   {/* <div className="flex flex-col h-fit p-3 bg-gray-800 border-2 rounded-lg border-gray-600 gap-2">
    //             <div className="flex justify-center font-bold text-xl">
    //                 How To Use
    //             </div>
    //             <div className="text-md">
    //                 Set the board dimensions and track count above the level editor,
    //                 and design the level you would like to solve.
    //             </div>
    //             <div className="text-md">
    //                 Once you're finished, solve the level by pressing the <span className="font-semibold text-green-400">"Start Simulation"</span> button.
    //                 The solution for the level will be displayed once the solver is finished!
    //             </div>
    //         </div> */}
    //   <div className="flex flex-col h-fit p-3 bg-gray-800 border-2 rounded-lg border-gray-600 gap-2">
    //     <div className="flex justify-center font-bold text-xl">
    //       Hyperparameters
    //     </div>
    //     <div className="text-sm">
    //       These settings affect the solving algorithm. The defaults are ideal
    //       for nearly any level, so
    //       <span className="font-semibold text-red-400">
    //         {" "}
    //         only change them if you know what you are doing and it is absolutely
    //         necessary!
    //       </span>
    //     </div>
    //     {/* HEATMAP_LIMIT_LIMIT */}
    //     <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
    //       <div className="font-mono text-lg">
    //         HEATMAP_LIMIT_LIMIT = {hyperparameters.heatmap_limit_limit}
    //       </div>
    //       <button
    //         className={`transition-all absolute cursor-pointer right-0 border-2 rounded ${accent} font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60`}
    //         onClick={() =>
    //           setHyperparams(getDefaultHyperparams().heatmap_limit_limit)
    //         }
    //       >
    //         Reset
    //       </button>
    //       <div className="text-sm">
    //         How many times a car can <i>reasonably</i> loop before the generated
    //         branch is cut.{" "}
    //         <span className="font-semibold text-red-400">
    //           Only increase if you know a car must loop more than{" "}
    //           {getDefaultHyperparams().heatmap_limit_limit} times.
    //         </span>
    //       </div>
    //       <input
    //         className={`relative ${accent} w-full`}
    //         type="range"
    //         min="0"
    //         max="30"
    //         step="1"
    //         value={hyperparameters.heatmap_limit_limit}
    //         onChange={(e) => {
    //           const val = Number(e.target.value);
    //           setHyperparams(val);
    //         }}
    //       />
    //     </div>
    //     {/* DECOY_HEATMAP_LIMIT */}
    //     <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
    //       <div className="font-mono text-lg">
    //         DECOY_HEATMAP_LIMIT = {hyperparameters.decoy_heatmap_limit}
    //       </div>
    //       <button
    //         className={`transition-all absolute cursor-pointer right-0 border-2 rounded ${accent} font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60`}
    //         onClick={() =>
    //           setHyperparams(
    //             undefined,
    //             getDefaultHyperparams().decoy_heatmap_limit
    //           )
    //         }
    //       >
    //         Reset
    //       </button>
    //       <div className="text-sm">
    //         How many times a decoy can loop before the generated branch is cut.{" "}
    //         <span className="font-semibold text-red-400">
    //           Only increase if you know a decoy must loop more than{" "}
    //           {getDefaultHyperparams().decoy_heatmap_limit} times.
    //         </span>
    //       </div>
    //       <input
    //         className={accent}
    //         type="range"
    //         min="0"
    //         max="30"
    //         step="1"
    //         value={hyperparameters.decoy_heatmap_limit}
    //         onChange={(e) => {
    //           const val = Number(e.target.value);
    //           setHyperparams(undefined, val);
    //         }}
    //       />
    //     </div>
    //     {/* GEN_TYPE */}
    //     <div className="relative flex flex-col gap-2 border-t-2 border-dashed border-gray-600 pt-2">
    //       <div className="font-mono text-lg">
    //         GEN_TYPE = {hyperparameters.gen_type}
    //       </div>
    //       <button
    //         className={`transition-all absolute cursor-pointer right-0 border-2 rounded ${accent} font-semibold whitespace-nowrap px-3 hover:brightness-80 active:brightness-60`}
    //         onClick={() =>
    //           setHyperparams(
    //             undefined,
    //             undefined,
    //             getDefaultHyperparams().gen_type
    //           )
    //         }
    //       >
    //         Reset
    //       </button>
    //       <div className="text-sm">The tree traversal technique the algorithm uses.</div>
    //       <div className="flex flex-row items-center">
    //         <button
    //           className="flex cursor-pointer transition-all border-2 rounded w-fit h-fit px-2 border-green-300 text-green-300 font-semibold hover:brightness-80 active:brightness-60"
    //           onClick={() => setHyperparams(undefined, undefined, "DFS")}
    //         >
    //           DFS
    //         </button>
    //         <div className="ml-2 text-sm">
    //           <span className="text-green-300 font-semibold">
    //             Depth-First Search;
    //           </span>{" "}
    //           the algorithm tries configurations with more tracks first, often
    //           finding a solution before BFS because not <b>all</b> low-track
    //           configurations are tried.
    //         </div>
    //       </div>
    //       <div className="flex flex-row items-center">
    //         <button
    //           className="flex cursor-pointer transition-all border-2 rounded w-fit h-fit px-2 border-blue-300 text-blue-300 font-semibold hover:brightness-80 active:brightness-60"
    //           onClick={() => setHyperparams(undefined, undefined, "BFS")}
    //         >
    //           BFS
    //         </button>
    //         <div className="ml-2 text-sm">
    //           <span className="text-blue-300 font-semibold">
    //             Breadth-First Search;
    //           </span>{" "}
    //           the algorithm tries configurations with the least tracks until a
    //           solution is found.
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
    <div ref={flexRef} className={`transition-all relative`}>
      <div ref={widthRef} className={`absolute flex flex-row w-100 h-full right-0`}>
        {/* Menu Button */}
        <div className={`absolute flex left-12.5 w-full h-12.5 justify-end ${styles.base.bg} border-b-1 ${styles.border.border} rounded-[0.5rem]`}>
          <button
            className={`relative flex flex-row items-center justify-center w-12.5 h-12.5 cursor-pointer`}
            title={showLeftDisplay ? "Collapse Sidebar" : "Open Sidebar"}
            onClick={() => toggleLeftDisplay()}
          >
            {/* Menu Icon */}
            <svg className={`${styles.text.text} w-8 h-6`} viewBox="0 0 32 24">
              <path fill="currentColor" d="M30 0H2a2 2 0 0 0 0 4h28a2 2 0 1 0 0-4ZM30 20H2a2 2 0 1 0 0 4h28a2 2 0 1 0 0-4ZM30 10H2a2 2 0 1 0 0 4h28a2 2 0 1 0 0-4Z"/>
            </svg>
          </button>
        </div>
        {/* Accordion */}
        <div className={`relative flex flex-col w-full h-full p-4 rounded-[1rem] ${styles.base.bg} border-b-1 ${styles.border.border} ${styles.text.text} ${
          showLeftDisplay ? "overflow-auto" : "overflow-hidden"
        }`}>
          <AccordionCard title="Controls" icon={Icons.controls}>
            <div className={`${styles.text.text}`}>
              <span className="font-bold">Left Click</span> - Place item<br />
              <span className="font-bold">Right Click</span> - Remove item<br />
              <span className="font-bold">Q / E</span> - Rotate item<br />
              <span className="font-bold">W</span> - Modify item color/type<br />
              <span className="font-bold">R</span> - Clear grid
            </div>
          </AccordionCard>
          <Separator />
          <AccordionCard title="Solve History" icon={Icons.solve_history}>
            <div className={`${styles.text.text}`}>
              
            </div>
          </AccordionCard>
          <Separator />
          <AccordionCard title="Parameters" icon={Icons.parameters}>
            <div className={`flex flex-col ${styles.text.text} gap-2`}>
              <span>
                These settings affect the solving algorithm. The defaults are ideal for nearly any level, so{" "}
                <span className={`font-bold ${styles.warning.text}`}>
                  only change them if you know what you are doing and it is absolutely necessary!
                </span>
              </span>
              <div className={`flex flex-col gap-4`}>
                <Parameter
                  param={"heatmap_limit_limit"}
                  description={
                    <div>
                      How many times a car can <i>reasonably</i> loop before the generated
                      branch is cut.{" "}
                      <span className={`font-medium ${styles.warning.text}`}>
                        Only increase if you know a car must loop more than{" "}
                        {getDefaultHyperparams().heatmap_limit_limit} times.
                      </span>
                    </div>
                  }
                  resetFunc={() => setHyperparams(getDefaultHyperparams().heatmap_limit_limit)}
                >
                  <ParameterSlider
                    param={"heatmap_limit_limit"}
                    min={0}
                    max={30}
                  />
                </Parameter>
                <Parameter
                  param={"decoy_heatmap_limit"}
                  description={
                    <div>
                      How many times a decoy can loop before the generated branch is cut.{" "}
                      <span className={`font-medium ${styles.warning.text}`}>
                        Only increase if you know a decoy must loop more than{" "}
                        {getDefaultHyperparams().decoy_heatmap_limit} times.
                      </span>
                    </div>
                  }
                  resetFunc={() => setHyperparams(undefined, getDefaultHyperparams().decoy_heatmap_limit)}
                >
                  <ParameterSlider
                    param={"decoy_heatmap_limit"}
                    min={0}
                    max={30}
                  />
                </Parameter>
                <Parameter
                  param={"gen_type"}
                  description={
                    <div>
                      The generation method the algorithm uses.
                    </div>
                  }
                  resetFunc={() => setHyperparams(undefined, undefined, getDefaultHyperparams().gen_type)}
                >
                  <div className={`flex flex-row gap-8`}>
                    <div className={`flex flex-row gap-1 items-center`}>
                      <button
                        className={`transition-all flex flex-row items-center justify-center bg-green-500 px-4 py-0.5 rounded-[0.25rem] font-medium ${styles.base.text} cursor-pointer hover:bg-green-600 active:bg-green-700`}
                        onClick={() => setHyperparams(undefined, undefined, "DFS")}
                      >
                        DFS
                      </button>
                      <ParameterInfo info={
                        <span>
                          <span className="text-green-300 font-semibold">
                            Depth-First Search;
                          </span>
                          the algorithm tries configurations with more tracks first, often
                          finding a solution before BFS because not <b>all</b> low-track
                          configurations are tried.
                        </span>
                      } color="border-green-500 text-green-500" />
                    </div>
                    <div className={`flex flex-row gap-1 items-center`}>
                      <button
                        className={`transition-all flex flex-row items-center justify-center bg-blue-500 px-4 py-0.5 rounded-[0.25rem] font-medium ${styles.base.text} cursor-pointer hover:bg-blue-600 active:bg-blue-700`}
                        onClick={() => setHyperparams(undefined, undefined, "BFS")}
                      >
                        BFS
                      </button>
                      <ParameterInfo info={
                        <span>
                          <span className="text-blue-300 font-semibold">
                            Breadth-First Search;
                          </span>{" "}
                          the algorithm tries configurations with the least tracks until a
                          solution is found.
                        </span>
                      } color="border-blue-500 text-blue-500" />
                    </div>
                  </div>
                </Parameter>
              </div>
            </div>
          </AccordionCard>
          <Separator />
          <AccordionCard title="Contact" icon={Icons.contact}>
            <div className={`flex flex-col ${styles.text.text} gap-2`}>
              <div>Feel free to join{" "}
                <a
                  className={styles.link.text}
                  href="https://discord.gg/afterburn"
                  target="_blank"
                >
                  Afterburn's Discord server
                </a> and send a message or suggestion in the{" "}
                <a
                  className={styles.link.text}
                  href="https://discord.com/channels/441217491612598272/1142318326136180796"
                  target="_blank"
                >
                  RailboundSolver thread.
                </a>
              </div>
              <div>
                If you think the solver gave faulty results on your level configuration, or there's an issue with the website, report it below.
              </div>
              <div className={`flex flex-row justify-center gap-3`}>
                <a
                  className={`transition-all flex flex-row items-center justify-center px-4 py-0.5 bg-red-500 rounded-[0.25rem] cursor-pointer select-none hover:brightness-85 active:brightness-70`}
                >
                  <span className={`font-medium whitespace-nowrap`}>
                    { /* TBA */ }
                    Faulty Results
                  </span>
                </a>
                <div className={`w-0.25 ${styles.border.bg}`} />
                <a
                  className={`transition-all flex flex-row items-center justify-center px-4 py-0.5 bg-red-500 rounded-[0.25rem] cursor-pointer select-none hover:brightness-85 active:brightness-70`}
                >
                  <span className={`font-medium whitespace-nowrap`}>
                    { /* TBA */ }
                    Website Issue
                  </span>
                </a>
              </div>
            </div>
          </AccordionCard>
          <Separator />
          <AccordionCard title="Credits" icon={Icons.credits}>
            <div className={`flex flex-col gap-3`}>
              <div className={`flex flex-col gap-1`}>
                <span className={`font-medium`}>Lead Developer</span>
                <CreditsUser
                  name="FoxtrotOnce"
                  details="Wrote solving algorithm, designed website and graphics"
                  discord_uid={522924451302604814}
                  github_name="FoxtrotOnce"
                />
              </div>
              <div className={`flex flex-col gap-1`}>
                <span className={`font-medium`}>Contributors</span>
                <CreditsUser
                  name="Th1ngNg0"
                  details="Assisted with website front-end"
                  discord_uid={335602055441940481}
                  github_name="Th1nhNg0"
                />
                <CreditsUser
                  name="theheadofabroom"
                  details="Provided coding advice for the solving algorithm"
                  discord_uid={770633042909462530}
                  github_name="alistair-broomhead"
                />
                <CreditsUser
                  name="Nakuya"
                  details="Provided advice on website design"
                  discord_uid={237608444201271297}
                  github_name="nack098"
                />
              </div>
              <div className={`flex flex-col gap-1`}>
                <span className={`font-medium`}>Acknowledgements</span>
                <div className={`flex flex-row px-6`}>
                  <span>
                    RailboundSolver is based on the game <a
                      className={`italic ${styles.link.text}`}
                      href="https://store.steampowered.com/app/1967510/Railbound/"
                      target="_blank">
                    Railbound
                  </a> by Afterburn. All rights to the original game belong to Afterburn.
                  </span>
                </div>
              </div>
            </div>
          </AccordionCard>
        </div>
      </div>
    </div>
  );
};
