import * as React from "react";

interface CurvesTrackProps extends React.SVGProps<SVGSVGElement> {
  rotate?: number;
  isSwitch?: boolean;
}

const CurvesTrack: React.FC<CurvesTrackProps> = ({
  rotate = 0,
  style,
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
        fill="#CB8263"
        stroke="#000"
        strokeWidth="1.5"
        d="m64.043 20.73 24.3 52.113-10.422 4.86-24.3-52.113zM25.59 53.621l52.113 24.3-4.86 10.423-52.113-24.3z"
      ></path>
      <mask
        id="b"
        width="74"
        height="74"
        x="53"
        y="53"
        fill="#000"
        maskUnits="userSpaceOnUse"
      >
        <path fill="#fff" d="M53 53h74v74H53z"></path>
        <path
          fillRule="evenodd"
          d="M90 125c19.33 0 35-15.67 35-35s-15.67-35-35-35-35 15.67-35 35 15.67 35 35 35m0-10c13.807 0 25-11.193 25-25s-11.193-25-25-25-25 11.193-25 25 11.193 25 25 25"
          clipRule="evenodd"
        ></path>
      </mask>
      <path
        fill="#E2F5FF"
        fillRule="evenodd"
        d="M90 125c19.33 0 35-15.67 35-35s-15.67-35-35-35-35 15.67-35 35 15.67 35 35 35m0-10c13.807 0 25-11.193 25-25s-11.193-25-25-25-25 11.193-25 25 11.193 25 25 25"
        clipRule="evenodd"
      ></path>
      <path
        fill="#000"
        d="M123.5 90c0 18.502-14.998 33.5-33.5 33.5v3c20.158 0 36.5-16.342 36.5-36.5zM90 56.5c18.502 0 33.5 14.999 33.5 33.5h3c0-20.158-16.342-36.5-36.5-36.5zM56.5 90c0-18.501 14.999-33.5 33.5-33.5v-3c-20.158 0-36.5 16.342-36.5 36.5zM90 123.5c-18.501 0-33.5-14.998-33.5-33.5h-3c0 20.158 16.342 36.5 36.5 36.5zM113.5 90c0 12.979-10.521 23.5-23.5 23.5v3c14.636 0 26.5-11.864 26.5-26.5zM90 66.5c12.979 0 23.5 10.521 23.5 23.5h3c0-14.635-11.864-26.5-26.5-26.5zM66.5 90c0-12.979 10.521-23.5 23.5-23.5v-3c-14.635 0-26.5 11.865-26.5 26.5zM90 113.5c-12.979 0-23.5-10.521-23.5-23.5h-3c0 14.636 11.865 26.5 26.5 26.5z"
        mask="url(#b)"
      ></path>
      <mask
        id="c"
        width="134"
        height="134"
        x="23"
        y="23"
        fill="#000"
        maskUnits="userSpaceOnUse"
      >
        <path fill="#fff" d="M23 23h134v134H23z"></path>
        <path
          fillRule="evenodd"
          d="M90 155c35.899 0 65-29.101 65-65s-29.101-65-65-65-65 29.102-65 65c0 35.899 29.102 65 65 65m0-10c30.376 0 55-24.624 55-55s-24.624-55-55-55-55 24.624-55 55 24.624 55 55 55"
          clipRule="evenodd"
        ></path>
      </mask>
      <path
        fill="#E2F5FF"
        fillRule="evenodd"
        d="M90 155c35.899 0 65-29.101 65-65s-29.101-65-65-65-65 29.102-65 65c0 35.899 29.102 65 65 65m0-10c30.376 0 55-24.624 55-55s-24.624-55-55-55-55 24.624-55 55 24.624 55 55 55"
        clipRule="evenodd"
      ></path>
      <path
        fill="#000"
        d="M153.5 90c0 35.07-28.43 63.5-63.5 63.5v3c36.727 0 66.5-29.773 66.5-66.5zM90 26.5c35.07 0 63.5 28.43 63.5 63.5h3c0-36.727-29.773-66.5-66.5-66.5zM26.5 90c0-35.07 28.43-63.5 63.5-63.5v-3c-36.727 0-66.5 29.773-66.5 66.5zM90 153.5c-35.07 0-63.5-28.43-63.5-63.5h-3c0 36.727 29.773 66.5 66.5 66.5zM143.5 90c0 29.547-23.953 53.5-53.5 53.5v3c31.204 0 56.5-25.296 56.5-56.5zM90 36.5c29.547 0 53.5 23.953 53.5 53.5h3c0-31.204-25.296-56.5-56.5-56.5zM36.5 90c0-29.547 23.953-53.5 53.5-53.5v-3c-31.204 0-56.5 25.296-56.5 56.5zM90 143.5c-29.547 0-53.5-23.953-53.5-53.5h-3c0 31.204 25.296 56.5 56.5 56.5z"
        mask="url(#c)"
      ></path>
    </g>
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

export default CurvesTrack;
