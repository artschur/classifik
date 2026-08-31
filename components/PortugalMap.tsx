'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { DISTRICT_SHAPES, type DistrictShape } from './portugal-map-data';
import './PortugalMap.css';

/**
 * Edit here to change where each district navigates to.
 * Keys are the SVG path ids (see components/portugal-map-data.ts).
 */
export const DISTRICT_ROUTES: Record<string, string> = {
  PT01: '/location/aveiro',
  PT02: '/location/beja',
  PT03: '/location/braga',
  PT04: '/location/braganca',
  PT05: '/location/castelo-branco',
  PT06: '/location/coimbra',
  PT07: '/location/evora',
  PT08: '/location/faro',
  PT09: '/location/guarda',
  PT10: '/location/leiria',
  PT11: '/location/lisboa',
  PT12: '/location/portalegre',
  PT13: '/location/porto',
  PT14: '/location/santarem',
  PT15: '/location/setubal',
  PT16: '/location/viana-do-castelo',
  PT17: '/location/vila-real',
  PT18: '/location/viseu',
  PT30: '/location/madeira',
};

/** Edit here to change the label shown in the tooltip / aria-label. */
export const DISTRICT_NAMES: Record<string, string> = {
  PT01: 'Aveiro',
  PT02: 'Beja',
  PT03: 'Braga',
  PT04: 'Bragança',
  PT05: 'Castelo Branco',
  PT06: 'Coimbra',
  PT07: 'Évora',
  PT08: 'Faro',
  PT09: 'Guarda',
  PT10: 'Leiria',
  PT11: 'Lisboa',
  PT12: 'Portalegre',
  PT13: 'Porto',
  PT14: 'Santarém',
  PT15: 'Setúbal',
  PT16: 'Viana do Castelo',
  PT17: 'Vila Real',
  PT18: 'Viseu',
  PT30: 'Madeira',
};

type Box = { minX: number; minY: number; width: number; height: number };
type Point = { xPct: number; yPct: number };

/**
 * Tight crops of public/pt.svg's own coordinate system, not a rescale, so
 * nothing gets distorted. Madeira sits far to the west of the mainland
 * cluster in this projection (it had its own inset spot in the original
 * 1000x601 canvas), so sharing one viewBox with the mainland would leave a
 * huge empty gap between them. It gets its own small inset box instead,
 * same as most Portugal maps draw it.
 */
const MAINLAND_BOX: Box = { minX: 827, minY: 19, width: 136, height: 261 };
const MADEIRA_BOX: Box = { minX: 552, minY: 440, width: 39, height: 31 };

const MAINLAND_SHAPES = DISTRICT_SHAPES.filter((d) => d.id !== 'PT30');
const MADEIRA_SHAPES = DISTRICT_SHAPES.filter((d) => d.id === 'PT30');

function useHoverCapability() {
  const [hasHover, setHasHover] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setHasHover(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setHasHover(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return hasHover;
}

interface DistrictMapProps {
  shapes: DistrictShape[];
  box: Box;
  hasHover: boolean;
  hoveredId: string | null;
  armedId: string | null;
  onHoverEnter: (id: string) => void;
  onHoverLeave: (id: string) => void;
  onActivate: (id: string) => void;
  onBackgroundClick: () => void;
}

function DistrictMap({
  shapes,
  box,
  hasHover,
  hoveredId,
  armedId,
  onHoverEnter,
  onHoverLeave,
  onActivate,
  onBackgroundClick,
}: DistrictMapProps) {
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const [centers, setCenters] = useState<Record<string, Point>>({});

  useEffect(() => {
    const next: Record<string, Point> = {};
    pathRefs.current.forEach((el, id) => {
      const b = el.getBBox();
      next[id] = {
        xPct: ((b.x + b.width / 2 - box.minX) / box.width) * 100,
        yPct: ((b.y + b.height / 2 - box.minY) / box.height) * 100,
      };
    });
    setCenters(next);
  }, [box]);

  const activeId = hasHover ? hoveredId : armedId;
  const activeCenter = activeId ? centers[activeId] : undefined;
  const viewBox = `${box.minX} ${box.minY} ${box.width} ${box.height}`;

  const handleKeyDown = (id: string) => (event: ReactKeyboardEvent<SVGPathElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate(id);
    }
  };

  return (
    <div className="portugal-map__local-stage">
      <svg
        viewBox={viewBox}
        className="portugal-map__svg"
        role="group"
        aria-label="Mapa de Portugal, escolha um distrito"
        onClick={(event) => {
          if (event.target === event.currentTarget) onBackgroundClick();
        }}
      >
        {shapes.map((district) => {
          const label = DISTRICT_NAMES[district.id] ?? district.name;
          const isActive = activeId === district.id;
          const isArmed = armedId === district.id;

          return (
            <path
              key={district.id}
              ref={(el) => {
                if (el) pathRefs.current.set(district.id, el);
                else pathRefs.current.delete(district.id);
              }}
              d={district.d}
              className={
                'portugal-map__district' +
                (isActive ? ' is-active' : '') +
                (isArmed ? ' is-armed' : '')
              }
              role="button"
              tabIndex={0}
              aria-label={`Ver acompanhantes em ${label}`}
              onMouseEnter={() => hasHover && onHoverEnter(district.id)}
              onMouseLeave={() => hasHover && onHoverLeave(district.id)}
              onFocus={() => onHoverEnter(district.id)}
              onBlur={() => onHoverLeave(district.id)}
              onClick={() => onActivate(district.id)}
              onKeyDown={handleKeyDown(district.id)}
            />
          );
        })}
      </svg>

      {activeId && activeCenter && (
        <div
          className="portugal-map__tooltip"
          style={{ left: `${activeCenter.xPct}%`, top: `${activeCenter.yPct}%` }}
        >
          <span className="portugal-map__tooltip-label">
            {DISTRICT_NAMES[activeId] ?? activeId}
          </span>
          {!hasHover && armedId === activeId && (
            <button
              type="button"
              className="portugal-map__confirm-btn"
              onClick={() => onActivate(activeId)}
            >
              Ver distrito
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortugalMap() {
  const router = useRouter();
  const hasHover = useHoverCapability();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);

  const navigateTo = (id: string) => {
    const route = DISTRICT_ROUTES[id];
    if (route) router.push(route);
  };

  const handleActivate = (id: string) => {
    if (hasHover) {
      navigateTo(id);
      return;
    }
    if (armedId === id) {
      navigateTo(id);
      setArmedId(null);
    } else {
      setArmedId(id);
    }
  };

  const handleHoverEnter = (id: string) => setHoveredId(id);
  const handleHoverLeave = (id: string) =>
    setHoveredId((current) => (current === id ? null : current));
  const clearArmed = () => {
    if (!hasHover) setArmedId(null);
  };

  return (
    <div className="portugal-map">
      <div className="portugal-map__stage">
        <div className="portugal-map__inset">
          <DistrictMap
            shapes={MADEIRA_SHAPES}
            box={MADEIRA_BOX}
            hasHover={hasHover}
            hoveredId={hoveredId}
            armedId={armedId}
            onHoverEnter={handleHoverEnter}
            onHoverLeave={handleHoverLeave}
            onActivate={handleActivate}
            onBackgroundClick={clearArmed}
          />
          <span className="portugal-map__inset-label">Madeira</span>
        </div>

        <div className="portugal-map__mainland-wrap">
          <DistrictMap
            shapes={MAINLAND_SHAPES}
            box={MAINLAND_BOX}
            hasHover={hasHover}
            hoveredId={hoveredId}
            armedId={armedId}
            onHoverEnter={handleHoverEnter}
            onHoverLeave={handleHoverLeave}
            onActivate={handleActivate}
            onBackgroundClick={clearArmed}
          />
        </div>
      </div>
    </div>
  );
}
