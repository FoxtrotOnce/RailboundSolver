import React from "react"
import { useGuiStore, useLevelStore } from "../store"
import { useEffect, useState, useRef } from "react"

const Icons = {
  settings:
    <svg className={`w-8 h-8`} viewBox="0 0 32 32">
      <g fill="currentColor" clip-path="url(#clip0_2314_42)">
        <path d="M20.4 16a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm2 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"/>
        <path d="M18.823.4a2.8 2.8 0 0 1 2.569 1.685l.08.208 1.104 3.225 3.484-.693.218-.034a2.8 2.8 0 0 1 2.616 1.166l.12.186 2.404 4.05a2.8 2.8 0 0 1-.339 3.315L28.81 16l2.27 2.492a2.8 2.8 0 0 1 .34 3.314l-2.404 4.051a2.8 2.8 0 0 1-2.955 1.317l-3.484-.694-1.104 3.228a2.8 2.8 0 0 1-2.649 1.892h-4.846a2.8 2.8 0 0 1-2.649-1.892l-1.105-3.228-3.483.694a2.8 2.8 0 0 1-2.955-1.317l-2.403-4.05a2.8 2.8 0 0 1 .339-3.315L3.99 16l-2.27-2.492a2.8 2.8 0 0 1-.339-3.314l2.403-4.05.12-.187A2.801 2.801 0 0 1 6.74 4.825l3.483.693 1.105-3.225.08-.208A2.8 2.8 0 0 1 13.977.4v2a.8.8 0 0 0-.757.541L11.775 7.16a.8.8 0 0 1-.914.525L6.35 6.787a.8.8 0 0 0-.844.376l-2.404 4.051a.8.8 0 0 0 .096.948l3.007 3.3a.8.8 0 0 1 0 1.077l-3.007 3.3a.8.8 0 0 0-.096.947l2.404 4.05a.8.8 0 0 0 .719.392l.125-.015 4.511-.898a.8.8 0 0 1 .914.525l1.445 4.22a.8.8 0 0 0 .63.53l.127.01h4.846a.8.8 0 0 0 .706-.425l.051-.116 1.445-4.219a.8.8 0 0 1 .913-.525l4.512.898a.8.8 0 0 0 .844-.377l2.403-4.05a.8.8 0 0 0-.016-.845l-.08-.102-3.006-3.3a.8.8 0 0 1 0-1.078l3.006-3.3a.8.8 0 0 0 .096-.947l-2.403-4.051a.8.8 0 0 0-.844-.376l-4.512.898a.8.8 0 0 1-.913-.525L19.58 2.94a.801.801 0 0 0-.63-.531l-.127-.01v-2Zm0 0v2h-4.846v-2h4.846Z"/>
      </g>
      <defs>
        <clipPath id="clip0_2314_42">
          <path fill="currentColor" d="M0 32V0h32v32z"/>
        </clipPath>
      </defs>
    </svg>,
  clear:
    <svg className={`w-8 h-8`} viewBox="0 0 32 32">
      <path fill="currentColor" d="M4 6v.672a2 2 0 0 0 .586 1.414L12.5 16l-7.914 7.914A2 2 0 0 0 4 25.328V26a2 2 0 0 0 2 2h.672a2 2 0 0 0 1.414-.586L16 19.5l7.914 7.914a2 2 0 0 0 1.414.586H26a2 2 0 0 0 2-2v-.672a2 2 0 0 0-.586-1.414L19.5 16l7.914-7.914A2 2 0 0 0 28 6.672V6a2 2 0 0 0-2-2h-.672a2 2 0 0 0-1.414.586L16 12.5 8.086 4.586A2 2 0 0 0 6.672 4H6a2 2 0 0 0-2 2Z"/>
    </svg>,
  refresh_rate: 
    <span className={`w-8 h-8 flex items-center font-bold text-[1.5rem]`}>Hz</span>,
  start:
    <svg className={`w-8 h-8`} viewBox="0 0 32 32">
      <path fill="currentColor" d="m8.231 3.867 17.772 10.268c1.435.83 1.435 2.9 0 3.73L8.231 28.133C6.795 28.963 5 27.926 5 26.268V5.732c0-1.658 1.795-2.695 3.231-1.865Z"/>
    </svg>,
  pause:
    <svg className={`w-8 h-8`} viewBox="0 0 32 32">
      <path fill="currentColor" d="M10.615 2H6.308c-1.19 0-2.154.964-2.154 2.154v23.692c0 1.19.964 2.154 2.154 2.154h4.307c1.19 0 2.154-.964 2.154-2.154V4.154c0-1.19-.964-2.154-2.154-2.154ZM25.692 2h-4.307c-1.19 0-2.154.964-2.154 2.154v23.692c0 1.19.964 2.154 2.154 2.154h4.307c1.19 0 2.154-.964 2.154-2.154V4.154c0-1.19-.964-2.154-2.154-2.154Z"/>
    </svg>,
  reset:
    <svg className={`w-8 h-8`} viewBox="0 0 32 32">
      <rect width="28" height="28" x="2" y="2" fill="currentColor" rx="4.308"/>
    </svg>,
  step:
    <svg className={`w-8.75 h-8`} viewBox="0 0 35 32">
      <path fill="currentColor" d="M12.308 3.867 30.08 14.135c1.435.83 1.435 2.9 0 3.73L12.308 28.133c-1.436.83-3.231-.207-3.231-1.865V5.732c0-1.658 1.795-2.695 3.231-1.865ZM5.846 26.23V5.77c0-1.19-.964-2.155-2.154-2.155h-.538C1.964 3.615 1 4.58 1 5.77v20.462c0 1.19.964 2.154 2.154 2.154h.538c1.19 0 2.154-.965 2.154-2.154Z"/>
    </svg>,
}

const GridButton: React.FC<{
  content: React.ReactNode
  icon: React.ReactNode
  style: string
  onClick?: () => void
}> = ({content, icon, style, onClick}) => {
  const [hovering, setHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (content !== null && container !== null) {
      if (hovering) {
        container.style.width = `${content.scrollWidth}px`
      } else {
        container.style.width = "0px"
      }
    }
  }, [hovering])

  return (
    <button
      className={`transition-all flex flex-row p-1.5 rounded-[0.25rem] items-center select-none font-bold text-[1.5rem] whitespace-nowrap ${style} ${
        onClick !== undefined && "cursor-pointer"
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div ref={containerRef} className={`transition-all flex items-center justify-end h-full overflow-hidden`}>
        {/* pr-2 is used here instead of gap (on the button) so that the gap won't appear when the container's width is 0. */}
        <div ref={contentRef} className={`relative pr-2`}>
          {content}
        </div>
      </div>
      <div className={`w-8 h-8`}>
        {icon}
      </div>
    </button>
  )
}

export const GridButtons: React.FC = () => {
  const { styles, setHyperparams, hyperparameters, displayLevelSettings } = useGuiStore()
  const { clearLevel } = useLevelStore()

  return (
    <div className={`flex flex-col gap-3 rounded-[0.375rem] w-full items-end`}>
      <GridButton
        content={<span>Settings</span>}
        icon={Icons.settings}
        style={`${styles.text.text} ${styles.base.bg} border-b-1 ${styles.border.border}`}
        onClick={() => displayLevelSettings(true)}
      />
      <GridButton
        content={<span>Clear Grid</span>}
        icon={Icons.clear}
        style={`${styles.background.text} bg-red-500`}
        onClick={() => clearLevel()}
      />
      <GridButton
        content={
          <div className={`flex flex-row gap-2 items-center`}>
            <button
              className={`flex px-2 py-1.5 cursor-pointer rounded-[0.25rem] ${styles.text.bg} text-[1.25rem] ${styles.base.text} hover:${styles.text_hover.bg} active:${styles.text_active.bg}`}
              onClick={() => {
                const current_rate = hyperparameters.visualize_rate
                if (current_rate === 10000) {
                  setHyperparams(undefined, undefined, undefined, 10)
                } else {
                  setHyperparams(undefined, undefined, undefined, current_rate * 10)
                }
              }}
            >
              Toggle
            </button>
            <span className={`w-10.25 text-right`}>{1000 / hyperparameters.visualize_rate}</span>
          </div>
        }
        icon={Icons.refresh_rate}
        style={`${styles.text.text} ${styles.base.bg} border-b-1 ${styles.border.border}`}
      />
      <div className={`w-10.5 h-0.25 rounded-full ${styles.border.bg}`} />
      <GridButton
        content={<span>Solve</span>}
        icon={Icons.start}
        style={`${styles.background.text} bg-green-500`}
        onClick={() => null}
      />
      <GridButton
        content={<span>Pause</span>}
        icon={Icons.pause}
        style={`${styles.background.text} bg-yellow-500`}
        onClick={() => null}
      />
      <GridButton
        content={<span>Stop</span>}
        icon={Icons.reset}
        style={`${styles.background.text} bg-red-500`}
        onClick={() => null}
      />
      <GridButton
        content={<span>Step</span>}
        icon={Icons.step}
        style={`${styles.background.text} bg-blue-500`}
        onClick={() => null}
      />
    </div>
  )
}
