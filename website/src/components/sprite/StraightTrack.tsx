import * as React from "react";

interface StraightTrackProps extends React.SVGProps<SVGSVGElement> {
  rotate?: number;
}

const StraightTrack: React.FC<StraightTrackProps> = ({
  rotate = 0,
  style,
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
  </svg>
);

export default StraightTrack;
