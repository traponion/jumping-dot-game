import * as fabric from 'fabric';

export const FABRIC_DEFAULTS = {
    NON_INTERACTIVE: { selectable: false, evented: false },
    CENTERED_TEXT: { originX: 'center', originY: 'center' },
    MONOSPACE_FONT: { fontFamily: 'monospace' }
} as const;

export const SHADOW_PRESETS = {
    STANDARD: { color: 'rgba(0,0,0,0.8)', offsetX: 1, offsetY: 1, blur: 2 },
    TITLE: { color: 'rgba(0,0,0,0.8)', offsetX: 2, offsetY: 2, blur: 4 },
    GLOW: { color: 'rgba(255, 255, 255, 0.8)', offsetX: 0, offsetY: 0, blur: 5 }
} as const;

export const createStandardShadow = () => new fabric.Shadow(SHADOW_PRESETS.STANDARD);
export const createTitleShadow = () => new fabric.Shadow(SHADOW_PRESETS.TITLE);
export const createGlowShadow = () => new fabric.Shadow(SHADOW_PRESETS.GLOW);

export const createNonInteractiveShape = <T extends object>(baseOptions: T) => ({
    ...baseOptions,
    ...FABRIC_DEFAULTS.NON_INTERACTIVE
});

export const createTextWithShadow = (text: string, options: Record<string, unknown> = {}) =>
    new fabric.Text(text, {
        ...createNonInteractiveShape(options),
        ...FABRIC_DEFAULTS.MONOSPACE_FONT,
        ...FABRIC_DEFAULTS.CENTERED_TEXT,
        shadow: createStandardShadow()
    });

export const createParticleCircle = (
    particle: { x: number; y: number; life: number },
    radius: number
) =>
    new fabric.Circle({
        left: particle.x - radius,
        top: particle.y - radius,
        radius: radius,
        fill: `rgba(255, 255, 255, ${particle.life})`,
        ...FABRIC_DEFAULTS.NON_INTERACTIVE
    });
