"use client";

import React, { useMemo } from "react";
import DottedMap from "https://esm.sh/dotted-map";

// Define the Pin type for our component's props
export type Pin = {
  lat: number;
  lng: number;
  svgOptions?: {
    color?: string;
    radius?: number;
  };
};

// Define the props for our React component
type DottedMapProps = {
  /**
   * Height of the map.
   * @default 60
   */
  height?: number;
  /**
   * Grid type for the map.
   * @default "diagonal"
   */
  grid?: "diagonal" | "horizontal" | "vertical";
  /**
   * An array of Pin objects to display on the map.
   */
  pins: Pin[];
  /**
   * Default radius for all dots.
   * @default 0.22
   */
  dotRadius?: number;
  /**
   * Default color for all dots.
   * @default "#423B38"
   */
  dotColor?: string;
  /**
   * Shape of the dots.
   * @default "circle"
   */
  dotShape?: "circle" | "hexagon";
  /**
   * Background color of the SVG.
   * @default "#020300"
   */
  backgroundColor?: string;
  /**
   * Optional className for the wrapper div.
   */
  className?: string;
};

/**
 * A React component to render a map from the 'dotted-map' library.
 */
export const DottedMapComponent: React.FC<DottedMapProps> = ({
  height = 60,
  grid = "diagonal",
  pins,
  dotRadius = 0.22,
  dotColor = "#423B38",
  dotShape = "circle",
  backgroundColor = "#020300",
  className,
}) => {
  // Use useMemo to re-generate the SVG only when props change
  const svgMapString = useMemo(() => {
    // 1. Create a new map instance
    const map = new DottedMap({ height, grid });

    // 2. Add all the pins from the prop
    pins.forEach((pin) => {
      map.addPin(pin);
    });

    // 3. Generate the SVG string
    const svgMap = map.getSVG({
      radius: dotRadius,
      color: dotColor,
      shape: dotShape,
      backgroundColor: backgroundColor,
    });

    return svgMap;
  }, [
    height,
    grid,
    pins,
    dotRadius,
    dotColor,
    dotShape,
    backgroundColor,
  ]);

  // 4. Render the SVG string using dangerouslySetInnerHTML
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgMapString }}
    />
  );
};

export default DottedMapComponent;