"use client";
import * as React from 'react';
import {JSX, useRef} from 'react';
import gsap from "gsap";
import {useGSAP} from "@gsap/react";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {MotionPathPlugin} from "gsap/MotionPathPlugin";
import {cn} from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

export type MovingBorderProps = {
    /** The content to be displayed inside the border. */
    children: React.ReactNode;

    /** Additional CSS classes for the inner content container. */
    className?: string;

    /** Additional CSS classes for the outer wrapper container. */
    outerClassName?: string;

    /** Width of the border in pixels. @default 1 */
    borderWidth?: number;

    /** Width of the gradient effect in pixels. If not specified, defaults to borderWidth * 10. */
    gradientWidth?: number;

    /** Border radius in pixels. Ignored if isCircle is true. @default 15 */
    radius?: number;

    /** Duration of one complete animation cycle in seconds. @default 3 */
    duration?: number;

    /** Array of color values for the gradient. If multiple colors provided, they will be animated in sequence. @default ["#355bd2"] */
    colors?: string[];

    /** Whether to render as a perfect circle with circular path animation. @default false */
    isCircle?: boolean;

    /** Tag name for the outer wrapper (e.g. 'div', 'section', 'figure', etc.). @default "div" */
    as?: keyof JSX.IntrinsicElements;
};

export function MovingBorder({
                                 children,
                                 className,
                                 outerClassName,
                                 borderWidth = 1,
                                 radius = 15,
                                 gradientWidth,
                                 duration = 3,
                                 colors = ["#355bd2"],
                                 isCircle = false,
                                 as = "div",
                             }: MovingBorderProps) {
    const scope = useRef<HTMLElement | null>(null);

    // Use a large radius for perfect circle
    const effectiveRadius = isCircle ? 9999 : radius;

    useGSAP(
        () => {
            const root = scope.current as HTMLElement | null;
            if (!root) return;

            const movingGradient = root.querySelector<HTMLElement>(".moving-gradient");
            if (!movingGradient) return;

            let pathTl: gsap.core.Timeline | null = null;
            let colorTl: gsap.core.Timeline | null = null;

            // Function to create/update the path animation
            const updateAnimation = () => {
                // Kill existing timeline if it exists
                if (pathTl) {
                    pathTl.kill();
                }

                // Get current dimensions
                const rect = root.getBoundingClientRect();
                const width = rect.width - borderWidth * 2;
                const height = rect.height - borderWidth * 2;

                let path: { x: number; y: number; }[];

                if (isCircle) {
                    // Create a circular path using 64 coordinate points
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const circleRadius = Math.min(width, height) / 2;
                    const numPoints = 64;

                    path = Array.from({length: numPoints}, (_, i) => {
                        const angle = (i / numPoints) * Math.PI * 2;
                        return {
                            x: centerX + circleRadius * Math.cos(angle),
                            y: centerY + circleRadius * Math.sin(angle)
                        };
                    });
                } else {
                    // Calculate the path points accounting for border radius (rounded rectangle)
                    path = [
                        {x: effectiveRadius, y: 0},
                        {x: width - effectiveRadius, y: 0},
                        {x: width, y: effectiveRadius},
                        {x: width, y: height - effectiveRadius},
                        {x: width - effectiveRadius, y: height},
                        {x: effectiveRadius, y: height},
                        {x: 0, y: height - effectiveRadius},
                        {x: 0, y: effectiveRadius},
                        {x: effectiveRadius, y: 0},
                    ];
                }

                // Create new timeline for path
                pathTl = gsap.timeline({
                    repeat: -1,
                    defaults: {ease: "none", duration: duration}
                });

                pathTl.to(movingGradient, {
                    motionPath: {
                        path: path,
                        fromCurrent: false,
                        curviness: isCircle ? 1 : 1.5,
                    }
                });
            };

            // Function to create color animation
            const setupColorAnimation = () => {
                if (colors.length <= 1) {
                    // Single color - just set it
                    root.style.setProperty('--color', colors[0]);
                    return;
                }

                // Set initial color
                root.style.setProperty('--color', colors[0]);

                // Multiple colors - animate through them
                colorTl = gsap.timeline({
                    repeat: -1,
                    defaults: {ease: "none", duration: duration / colors.length}
                });

                // Animate through all colors and back to first for seamless loop
                colors.forEach((_, index) => {
                    const nextColor = colors[(index + 1) % colors.length];
                    colorTl!.to(root, {'--color': nextColor});
                });
            };

            // Initial setup
            updateAnimation();
            setupColorAnimation();

            // Watch for size changes
            const resizeObserver = new ResizeObserver(() => {
                updateAnimation();
            });

            resizeObserver.observe(root);

            // Cleanup
            return () => {
                if (pathTl) {
                    pathTl.kill();
                }
                if (colorTl) {
                    colorTl.kill();
                }
                resizeObserver.disconnect();
            };
        },
        {scope, dependencies: [borderWidth, effectiveRadius, gradientWidth, duration, colors, isCircle, as]}
    );

    const Wrapper = as as any;

    return (
        // wrapper
        <Wrapper ref={scope} className={cn(`wrapper relative overflow-hidden inline-block`, outerClassName)}
                 style={{
                     ['--color' as any]: colors[0],
                     padding: `${borderWidth}px`,
                     borderRadius: `${effectiveRadius + borderWidth}px`,
                 }}>

            {/* moving gradient*/}
            <div className="moving-gradient aspect-square absolute top-0 left-0" style={{width: `${borderWidth}px`}}>
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square rounded-full"
                    style={{
                        width: `${gradientWidth || borderWidth * 10}px`,
                        background: `radial-gradient(circle, var(--color) 0%, transparent 70%)`
                    }}>
                </div>
            </div>

            {/*inner*/}
            <div className={cn(`inner relative z-30 bg-white`, className)}
                 style={{
                     borderRadius: `${effectiveRadius}px`,
                 }}>
                {children}
            </div>
        </Wrapper>
    );
}