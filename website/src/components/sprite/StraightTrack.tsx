import * as React from "react";

interface StraightTrackProps extends React.SVGProps<SVGSVGElement> {
  rotate?: number;
  variant?: "default" | "fixed";
  isSwitch?: boolean;
}

const StraightTrack: React.FC<StraightTrackProps> = ({
  rotate = 0,
  style,
  variant = "default",
  isSwitch = false,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="90"
    height="90"
    fill="none"
    viewBox="0 0 90 90"
    style={{
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      ...style,
    }}
    {...props}
  >
    {variant === "default" && (
      <>
        <mask
          id="a"
          width="90"
          height="90"
          x="0"
          y="0"
          maskUnits="userSpaceOnUse"
          style={{ maskType: "alpha" }}
        >
          <path fill="#D9D9D9" d="M0 0h90v90H0z"></path>
        </mask>
        <g stroke="#000" strokeWidth="1.5" mask="url(#a)">
          <path
            fill="#CB8263"
            d="M16.25 16.25h11.5v57.5h-11.5zM62.25 16.25h11.5v57.5h-11.5z"
          ></path>
          <path
            fill="#E2F5FF"
            d="M-.75 54.25h91.5v11.5H-.75zM-.75 24.25h91.5v11.5H-.75z"
          ></path>
        </g>
      </>
    )}
    {variant === "fixed" && (
      <>
        <mask
          id="a"
          width="90"
          height="90"
          x="0"
          y="0"
          maskUnits="userSpaceOnUse"
          style={{ maskType: "alpha" }}
        >
          <path fill="#D9D9D9" d="M0 0h90v90H0z"></path>
        </mask>
        <g stroke="#000" strokeWidth="1.5" mask="url(#a)">
          <path
            fill="#8F8555"
            d="m1.715 15.407 17.497-.305 1.074 61.49-17.498.306zM26.503 10.966l17.49.61-2.496 71.457-17.49-.61zM46.715 15.407l17.497-.305 1.074 61.49-17.498.306zM70.503 10.966l17.49.61-2.496 71.457-17.49-.61z"
          ></path>
          <path
            fill="#E2F5FF"
            d="M-.75 54.25h91.5v11.5H-.75zM-.75 24.25h91.5v11.5H-.75z"
          ></path>
        </g>
      </>
    )}
    {isSwitch && (
      <>
        <mask
          id="a"
          width="90"
          height="90"
          x="0"
          y="0"
          maskUnits="userSpaceOnUse"
          style={{ maskType: "alpha" }}
        >
          <path fill="#D9D9D9" d="M0 0h90v90H0z"></path>
        </mask>
        <g mask="url(#a)">
          <rect
            width="22.5"
            height="22.5"
            x="33.75"
            y="33.75"
            fill="#0F0"
            stroke="#000"
            strokeWidth="2.5"
            rx="4.25"
          ></rect>
        </g>
      </>
    )}
  </svg>
);

export default StraightTrack;
