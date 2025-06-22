import * as React from "react";

interface CarProps extends React.SVGProps<SVGSVGElement> {
  rotate?: number;
  carId?: string | number;
}

const Car: React.FC<CarProps> = ({
  rotate = 0,
  carId = 1,
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
    <g mask="url(#a)">
      <path
        fill="#D6592C"
        fillRule="evenodd"
        d="M76 67a5 5 0 0 0 5-5V28a5 5 0 0 0-5-5H19a5 5 0 0 0-5 5v34a5 5 0 0 0 5 5zM32.6 52.8A1 1 0 0 1 31 52V38a1 1 0 0 1 1.6-.8l9.333 7a1 1 0 0 1 0 1.6z"
        clipRule="evenodd"
      ></path>
      <path
        fill="#fff"
        d="M32.6 37.2a1 1 0 0 0-1.6.8v14a1 1 0 0 0 1.6.8l9.333-7a1 1 0 0 0 0-1.6z"
      ></path>
      <path
        stroke="#000"
        strokeWidth="1.5"
        d="M76 67a5 5 0 0 0 5-5V28a5 5 0 0 0-5-5H19a5 5 0 0 0-5 5v34a5 5 0 0 0 5 5zM32.6 52.8A1 1 0 0 1 31 52V38a1 1 0 0 1 1.6-.8l9.333 7a1 1 0 0 1 0 1.6z"
        clipRule="evenodd"
      ></path>
      <path
        stroke="#000"
        strokeWidth="1.5"
        d="M32.6 37.2a1 1 0 0 0-1.6.8v14a1 1 0 0 0 1.6.8l9.333-7a1 1 0 0 0 0-1.6z"
      ></path>
      <text
        x="60"
        y="55"
        fill="#fff"
        stroke="#000"
        strokeWidth="1.5"
        fontFamily="monospace"
        fontSize="22"
        fontWeight="bold"
        textAnchor="middle"
        transform="rotate(90 61.5 46)"
      >
        {carId}
      </text>
    </g>
  </svg>
);

export default Car;
