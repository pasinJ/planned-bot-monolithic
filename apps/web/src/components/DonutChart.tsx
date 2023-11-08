import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import { isNotNil } from 'ramda';
import { useLayoutEffect, useRef, useState } from 'react';

import { mergeClassName } from '#shared/utils/tailwind';

type DonutChartProps = { data: DonutChartData[]; settings?: Partial<DonutChartSettings>; className?: string };
type DonutChartData = {
  name: string;
  value: number;
  pathClassName?: string;
  tooltipProps?: Partial<TooltipProps>;
};
type DonutChartSettings = { edgeOffset: number; percentageInnerCutout: number };

export default function DonutChart({ data, settings, className }: DonutChartProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (isNotNil(elementRef.current)) {
      setHeight(elementRef.current.clientHeight);
      setWidth(elementRef.current.clientWidth);
    }
  }, []);

  const _settings = { edgeOffset: 10, percentageInnerCutout: 80, ...settings };
  const centerX = width / 2;
  const centerY = height / 2;
  const doughnutRadius = Math.min(width / 2, height / 2) - _settings.edgeOffset;
  const cutoutRadius = doughnutRadius * (_settings.percentageInnerCutout / 100);

  return (
    <div ref={elementRef} className={mergeClassName('h-full min-h-[10rem] w-full min-w-[10rem]', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        {data.length === 0 ? (
          <Tooltip title="No data" followCursor placement="left">
            <path
              className="fill-gray-200"
              d={getHollowCirclePath(centerX, centerY, doughnutRadius, cutoutRadius)}
            />
          </Tooltip>
        ) : (
          <g opacity={1}>
            {calculatePieSegments(
              centerX,
              centerY,
              doughnutRadius,
              cutoutRadius,
              data.filter((x) => x.value > 0).sort((a, b) => b.value - a.value),
            ).map(({ name, cmd, pathClassName, tooltipProps }, index) => (
              <Tooltip key={index} title={name} followCursor placement="left" {...tooltipProps}>
                <path className={pathClassName} d={cmd} />
              </Tooltip>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

function calculatePieSegments(
  centerX: number,
  centerY: number,
  doughnutRadius: number,
  cutoutRadius: number,
  data: DonutChartData[],
): (DonutChartData & { cmd: string })[] {
  const segmentTotal = data.reduce((a, b) => a + b.value, 0);
  const startRadius = -Math.PI / 2;

  if (data.length === 1 && 4.7122 < (data[0].value / segmentTotal) * (Math.PI * 2) + startRadius) {
    return [{ ...data[0], cmd: getHollowCirclePath(centerX, centerY, doughnutRadius, cutoutRadius) }];
  } else {
    const { segments } = data.reduce(
      ({ startRadius, segments }, dataItem) => {
        const segmentAngle = (dataItem.value / segmentTotal) * (Math.PI * 2);
        const endRadius = startRadius + segmentAngle;
        const largeArc = (endRadius - startRadius) % (Math.PI * 2) > Math.PI ? 1 : 0;
        const startX = centerX + Math.cos(startRadius) * doughnutRadius;
        const startY = centerY + Math.sin(startRadius) * doughnutRadius;
        const endX2 = centerX + Math.cos(startRadius) * cutoutRadius;
        const endY2 = centerY + Math.sin(startRadius) * cutoutRadius;
        const endX = centerX + Math.cos(endRadius) * doughnutRadius;
        const endY = centerY + Math.sin(endRadius) * doughnutRadius;
        const startX2 = centerX + Math.cos(endRadius) * cutoutRadius;
        const startY2 = centerY + Math.sin(endRadius) * cutoutRadius;

        const cmd = [
          'M',
          startX,
          startY, //Move pointer
          'A',
          doughnutRadius,
          doughnutRadius,
          0,
          largeArc,
          1,
          endX,
          endY, //Draw outer arc path
          'L',
          startX2,
          startY2, //Draw line path(this line connects outer and innner arc paths)
          'A',
          cutoutRadius,
          cutoutRadius,
          0,
          largeArc,
          0,
          endX2,
          endY2, //Draw inner arc path
          'Z', //Cloth path
        ].join(' ');

        return { startRadius: startRadius + segmentAngle, segments: [...segments, { ...dataItem, cmd }] };
      },
      { startRadius, segments: [] as (DonutChartData & { cmd: string })[] },
    );

    return segments;
  }
}

function getHollowCirclePath(centerX: number, centerY: number, doughnutRadius: number, cutoutRadius: number) {
  const startRadius = -1.57; // -Math.PI/2
  const endRadius = 4.7131; // startRadius + segmentAngle
  const startX = centerX + Math.cos(startRadius) * doughnutRadius;
  const startY = centerY + Math.sin(startRadius) * doughnutRadius;
  const endX2 = centerX + Math.cos(startRadius) * cutoutRadius;
  const endY2 = centerY + Math.sin(startRadius) * cutoutRadius;
  const endX = centerX + Math.cos(endRadius) * doughnutRadius;
  const endY = centerY + Math.sin(endRadius) * doughnutRadius;
  const startX2 = centerX + Math.cos(endRadius) * cutoutRadius;
  const startY2 = centerY + Math.sin(endRadius) * cutoutRadius;

  const cmd = [
    'M',
    startX,
    startY,
    'A',
    doughnutRadius,
    doughnutRadius,
    0,
    1,
    1,
    endX,
    endY, //Draw outer circle
    'Z', //Close path
    'M',
    startX2,
    startY2, //Move pointer
    'A',
    cutoutRadius,
    cutoutRadius,
    0,
    1,
    0,
    endX2,
    endY2, //Draw inner circle
    'Z',
  ].join(' ');

  return cmd;
}
