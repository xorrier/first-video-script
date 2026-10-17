import React from 'react';
import { C } from '../../theme';
import { mix, rnd } from '../../utils/animation';
import { Layer } from '../Camera';
import { Dust } from '../Particles';
import { Citadel, HouseRow, House } from './Buildings';
import { Walker } from './Characters';
import { GrassTuft, Pot } from './Props';
import { Birds, Clouds, Haze, Hills, Moon, SKY, Sky, Stars, SunDisc, TimeOfDay } from './Sky';

const BRICKS = ['#A0522D', '#B0643A', '#94502F', '#B86B45', '#A65B37'];
const SHADE: Record<TimeOfDay, number> = { dusk: 0.42, day: 0, overcast: 0.22, night: 0.72, dawn: 0.3 };

export type CityScapeProps = {
  frame: number;
  id: string;
  tod: TimeOfDay;
  to?: TimeOfDay;
  t?: number;
  decay?: number;
  crowd?: number; // 0..1
  ghost?: number; // 0..1 → crowd drawn as glowing translucent figures
  lit?: number;
  seed?: string;
  sun?: [number, number];
  dust?: number;
  birds?: boolean;
  foreground?: boolean;
};

/** Layered street-level panorama of a Harappan city, to be used inside <Camera>. */
export const CityScape: React.FC<CityScapeProps> = ({ frame, id, tod, to, t = 0, decay = 0, crowd = 0, ghost = 0, lit = 0, seed = 'c', sun, dust = 0.5, birds = true, foreground = true }) => {
  const a = SKY[tod];
  const b = to ? SKY[to] : a;
  const k = (key: keyof typeof a) => mix(a[key], b[key], t);
  const shade = SHADE[tod] + ((to ? SHADE[to] : SHADE[tod]) - SHADE[tod]) * t;
  const shadow = k('shadow');
  const haze = k('haze');
  const light = k('light');
  const cols = (amt: number, toward: string) => BRICKS.map((c) => mix(mix(c, shadow, shade), toward, amt));
  const isNight = (to ?? tod) === 'night' || tod === 'night';
  const sunPos = sun ?? (tod === 'day' ? [1500, 190] : tod === 'dawn' ? [420, 640] : [1320, 650]);
  const nWalk = Math.round(crowd * 16);
  const walkers = Array.from({ length: nWalk }, (_, i) => {
    const sp = (0.7 + rnd(`${seed}sp${i}`) * 0.9) * (rnd(`${seed}dir${i}`) > 0.5 ? 1 : -1);
    const y = 905 + rnd(`${seed}wy${i}`) * 95;
    const wrapped = ((((rnd(`${seed}wx${i}`) * 2600 + frame * sp) % 2600) + 2600) % 2600) - 340;
    return { i, sp, y, x: wrapped - frame * sp };
  }).sort((p, q) => p.y - q.y);
  const ground = k('ground');
  return (
    <g>
      <Layer depth={0}>
        <Sky tod={tod} to={to} t={t} id={id} />
        {isNight ? <Stars frame={frame} opacity={tod === 'night' ? 1 - t : t} /> : null}
        {isNight ? <Moon x={1450} y={210} /> : <SunDisc x={sunPos[0]} y={sunPos[1]} r={tod === 'day' ? 50 : 72} id={id} color={mix(light, '#ffffff', 0.3)} glow={light} />}
        <Clouds frame={frame} color={mix(haze, '#fff', 0.2)} opacity={tod === 'night' ? 0.08 : 0.35} y={140} seed={3} />
        {birds && !isNight ? <Birds frame={frame} count={6} color={mix(shadow, '#000', 0.3)} y={260} /> : null}
      </Layer>
      <Layer depth={0.12}>
        <Hills y={655} amp={70} color={mix(k('hill'), haze, 0.35)} seed={2} />
      </Layer>
      <Layer depth={0.3}>
        <Haze y={560} h={220} color={haze} opacity={0.55} id={`${id}h1`} />
        <Citadel x={1080} y={720} w={560} h={150} color={mix(mix(BRICKS[1], shadow, shade), haze, 0.4)} earth={mix(mix('#8C6440', shadow, shade), haze, 0.45)} rim={light} decay={decay} />
      </Layer>
      <Layer depth={0.55}>
        <HouseRow x0={-500} x1={2500} y={760} hMin={60} hMax={115} wMin={70} wMax={130} colors={cols(0.32, haze)} seed={`${seed}far`} decay={decay} decayVar={0.5} detail={false} rim={light} rimOpacity={0.4} lit={lit * 0.6} missing={decay * 0.35} />
        <Haze y={700} h={120} color={haze} opacity={0.4} id={`${id}h2`} />
      </Layer>
      <Layer depth={0.8}>
        <HouseRow x0={-600} x1={2600} y={845} hMin={150} hMax={235} wMin={120} wMax={210} colors={cols(0.1, haze)} seed={`${seed}mid`} decay={decay} decayVar={0.55} rim={light} rimOpacity={tod === 'day' ? 0.25 : 0.65} lit={lit} dark={mix('#2B170E', shadow, 0.3)} missing={decay * 0.3} />
      </Layer>
      <Layer depth={1}>
        {/* street */}
        <rect x={-800} y={840} width={3600} height={600} fill={ground} />
        <rect x={-800} y={840} width={3600} height={14} fill={mix(ground, '#000', 0.18)} />
        {/* covered drain along the street edge: brick slabs */}
        {Array.from({ length: 70 }, (_, i) => {
          const x = -800 + i * 52;
          const broken = decay > 0.3 && rnd(`${seed}dr${i}`) < decay * 0.6;
          return broken ? (
            <rect key={i} x={x} y={872} width={50} height={14} fill={mix(ground, '#000', 0.55)} />
          ) : (
            <rect key={i} x={x} y={870} width={50} height={16} fill={mix(mix(BRICKS[i % 5], shadow, shade), ground, 0.25)} stroke={mix(ground, '#000', 0.3)} strokeWidth={1.2} />
          );
        })}
        {/* street texture */}
        <rect x={-800} y={860} width={3600} height={560} fill={`url(#groundShade-${id})`} />
        <defs>
          <linearGradient id={`groundShade-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0} />
            <stop offset="0.45" stopColor="#000" stopOpacity={0.18} />
            <stop offset="1" stopColor="#000" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        {Array.from({ length: 50 }, (_, i) => (
          <ellipse key={i} cx={-600 + rnd(`${seed}st${i}`) * 3200} cy={900 + rnd(`${seed}sy${i}`) * 170} rx={8 + rnd(`${seed}sr${i}`) * 26} ry={2 + rnd(`${seed}sh${i}`) * 3} fill={mix(ground, '#000', 0.12)} opacity={0.6} />
        ))}
        {decay > 0.4
          ? Array.from({ length: 12 }, (_, i) => <GrassTuft key={i} x={-400 + rnd(`${seed}gt${i}`) * 2800} y={890 + rnd(`${seed}gy${i}`) * 120} frame={frame} seed={i} s={0.8} color={mix('#6B5A2E', shadow, shade)} />)
          : null}
        {walkers.map((w) => (
          <Walker
            key={w.i}
            frame={frame}
            x={w.x}
            y={w.y}
            speed={w.sp}
            seed={w.i + 3}
            scale={0.95 + ((w.y - 905) / 95) * 0.35}
            ghost={ghost}
            carry={w.i % 4 === 1 ? 'pot' : w.i % 5 === 2 ? 'basket' : w.i % 7 === 3 ? 'stick' : 'none'}
            female={w.i % 3 === 1}
            silhouette={ghost > 0 ? undefined : tod === 'night' ? '#0B0D16' : shade > 0.35 ? mix('#2A1712', shadow, 0.4) : undefined}
          />
        ))}
      </Layer>
      {dust > 0 ? (
        <Layer depth={1.1}>
          <Dust frame={frame} count={50} opacity={dust} color={mix(light, '#fff', 0.3)} area={[-200, 300, 2300, 1080]} seed={7} />
        </Layer>
      ) : null}
      {foreground ? (
        <Layer depth={1.45}>
          <House x={-260} y={1200} w={330} h={620} seed={`${seed}fg`} color={mix(mix(BRICKS[0], shadow, Math.min(1, shade + 0.25)), '#000', 0.1)} decay={decay * 0.8} rim={light} rimOpacity={0.5} lit={lit} />
          <Pot x={160} y={1150} s={1.6} color={mix(C.terracotta, shadow, Math.min(1, shade + 0.15))} variant={0} broken={decay > 0.5} />
          <Pot x={250} y={1170} s={1.2} color={mix(C.brick, shadow, Math.min(1, shade + 0.2))} variant={1} />
          <GrassTuft x={2050} y={1140} s={2} frame={frame} color={mix('#5C4A22', shadow, shade)} seed={4} />
        </Layer>
      ) : null}
    </g>
  );
};
