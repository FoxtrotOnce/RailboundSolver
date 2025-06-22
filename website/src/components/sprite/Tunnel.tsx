import * as React from "react";

interface TunnelProps extends React.SVGProps<SVGSVGElement> {
  rotate?: number;
}

const Tunnel: React.FC<TunnelProps> = ({ rotate = 0, style, ...props }) => (
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
    <g mask="url(#a)">
      <path
        fill="#8F8555"
        stroke="#000"
        strokeWidth="1.5"
        d="m46.715 15.407 17.497-.305 1.074 61.49-17.498.306zM70.503 10.966l17.49.61-2.496 71.457-17.49-.61z"
      ></path>
      <path
        fill="#E2F5FF"
        stroke="#000"
        strokeWidth="1.5"
        d="M44.25 54.25h46.5v11.5h-46.5zM44.25 24.25h46.5v11.5h-46.5z"
      ></path>
      <path
        fill="#fff"
        d="M43 58V32c0-11.427 5.99-21.455 15-27.116H42.116C19.96 4.884 2 22.844 2 45s17.96 40.116 40.116 40.116H58C48.99 79.455 43 69.426 43 58"
      ></path>
      <path
        fill="#fff"
        d="M59.465 59.465A5 5 0 0 1 58 55.929V34.07a5 5 0 0 1 1.465-3.535l14.07-14.071A5 5 0 0 1 77.072 15H88V2H75c-6.246 0-12.074-.21-17 2.884C48.99 10.545 43 20.574 43 32v26c0 11.427 5.99 21.455 15 27.116C62.926 88.21 68.754 88 75 88h13V75H77.071a5 5 0 0 1-3.535-1.465z"
      ></path>
      <path
        stroke="#000"
        strokeWidth="1.5"
        d="M58 85.116C62.926 88.21 68.754 88 75 88h13V75H77.071a5 5 0 0 1-3.535-1.465l-14.071-14.07A5 5 0 0 1 58 55.929V34.07a5 5 0 0 1 1.465-3.535l14.07-14.071A5 5 0 0 1 77.072 15H88V2H75c-6.246 0-12.074-.21-17 2.884m0 80.232C48.99 79.455 43 69.426 43 58V32c0-11.427 5.99-21.455 15-27.116m0 80.232H42.116C19.96 85.116 2 67.156 2 45S19.96 4.884 42.116 4.884H58"
      ></path>
    </g>
  </svg>
);

export default Tunnel;
