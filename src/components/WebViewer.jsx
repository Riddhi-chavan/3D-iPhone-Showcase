import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from "react";
import {
    ViewerApp,
    AssetManagerPlugin,
    TonemapPlugin,
    GBufferPlugin,
    ProgressivePlugin,
    GammaCorrectionPlugin,
    SSRPlugin,
    SSAOPlugin,
    BloomPlugin,
    mobileAndTabletCheck
} from "webgi";
import gsap from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three';
import { scrollAnimation } from "../lib/scroll-animation";
gsap.registerPlugin(ScrollTrigger);

const WebViewer = forwardRef((props, ref) => {
    {
        const canvasRef = useRef(null);
        const [viewerRef, setViewerRef] = useState(null)
        const [targetRef, setTargetRef] = useState(null)
        const [cameraRef, setCameraRef] = useState(null)
        const [positionRef, setPositionRef] = useState(null)
        const canvasContainerRef = useRef(null)
        const [previewMode, setPreviewMode] = useState(false)
        const [isMobile, setIsMobile] = useState(null)


        useImperativeHandle(ref, () => ({
            triggerPreview() {
                // First set up the state and styles
                setPreviewMode(true);
                canvasContainerRef.current.style.pointerEvents = "all";
                props.contentRef.current.style.opacity = "0";

                // Enable camera controls only after animation completes
                viewerRef.scene.activeCamera.setCameraOptions({
                    controlsEnabled: false
                });

                // Create a timeline for smooth coordination
                const tl = gsap.timeline({
                    onComplete: () => {
                        // Enable controls after animation is done
                        viewerRef.scene.activeCamera.setCameraOptions({
                            controlsEnabled: true
                        });
                    }
                });

                // Animate both position and target simultaneously
                tl.to(positionRef, {
                    x: 13.04,
                    y: -2.01,
                    z: 2.29,
                    duration: 2,
                    ease: "power2.inOut", // Add smooth easing
                    onUpdate: () => {
                        viewerRef.setDirty();
                        cameraRef.positionTargetUpdated(true);
                    }
                })
                    .to(targetRef, {
                        x: 0.11,
                        y: 0.0,
                        z: 0.0,
                        duration: 2,
                        ease: "power2.inOut"  // Match the easing
                    }, "<"); // Start at the same time as position animation
            }
        }));
        const memoizedScrollAnimation = useCallback(
            (position, target, isMobile, onUpdate) => {
                if (position && target && onUpdate) {
                    scrollAnimation(position, target, onUpdate, isMobile)
                }
            }, []
        )
        const setupViewer = useCallback(async () => {
            const viewer = new ViewerApp({
                canvas: canvasRef.current,
            })

            setViewerRef(viewer)
            const isMobileorTablet = mobileAndTabletCheck()
            setIsMobile(isMobileorTablet)

            const manager = await viewer.addPlugin(AssetManagerPlugin)
            const camera = viewer.scene.activeCamera;
            const position = camera.position;
            const target = camera.target;

            setCameraRef(camera)
            setPositionRef(position)
            setTargetRef(target)

            await viewer.addPlugin(GBufferPlugin)
            await viewer.addPlugin(new ProgressivePlugin(32))
            await viewer.addPlugin(new TonemapPlugin(true))
            await viewer.addPlugin(GammaCorrectionPlugin)
            await viewer.addPlugin(SSRPlugin)
            await viewer.addPlugin(SSAOPlugin)
            await viewer.addPlugin(BloomPlugin)
            viewer.renderer.refreshPipeline()
            await manager.addFromPath("scene-black.glb")
            viewer.getPlugin(TonemapPlugin).config.clipBackground = true
            viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });
            if (isMobileorTablet) {
                position.set(-16.7, 1.17, 11.7)
                target.set(0, 1.37, 0);
                props.contentRef.current.className = "mobile-or-tablet";

            }
            window.scrollTo(0, 0)
            let needsUpdate = true;
            const onUpdate = () => {
                needsUpdate = true
                viewer.setDirty();

            }
            viewer.addEventListener("preFrame", () => {
                if (needsUpdate) {
                    camera.positionTargetUpdated(true)
                    needsUpdate = false;
                }
            })
            memoizedScrollAnimation(position, target, isMobileorTablet, onUpdate);
        }, [])

        useEffect(() => {
            setupViewer();
        }, [])


        const handleExit = useCallback(() => {
            // Disable interactions immediately
            canvasContainerRef.current.style.pointerEvents = "none";
            props.contentRef.current.style.opacity = "1";
            viewerRef.scene.activeCamera.setCameraOptions({
                controlsEnabled: false
            });
            setPreviewMode(false);

            // Create a single timeline for smoother coordination
            const tl = gsap.timeline();

            // Animate position
            tl.to(positionRef, {
                x: !isMobile ? 1.56 : 9.36,
                y: !isMobile ? 5.0 : 10.95,
                z: !isMobile ? 0.01 : 0.09,
                duration: 1, // Adjust duration as needed
                ease: "power2.inOut", // Add easing for smoother animation
                onUpdate: () => {
                    viewerRef.setDirty();
                    cameraRef.positionTargetUpdated(true);
                }
            });

            // Animate target
            tl.to(targetRef, {
                x: !isMobile ? -0.55 : -1.62,
                y: !isMobile ? 0.32 : 0.02,
                z: !isMobile ? 0.0 : -0.06,
                duration: 1, // Should match position duration
                ease: "power2.inOut"
            }, "<"); // The "<" makes this animation start at the same time as the position animation

        }, [canvasContainerRef, viewerRef, positionRef, cameraRef, targetRef, isMobile]);

        return (
            <div ref={canvasContainerRef} id="webgi-canvas-container">
                <canvas id="webgi-canvas" ref={canvasRef} />
                {
                    previewMode && (
                        <button className="button" onClick={handleExit}>Exit</button>
                    )
                }
            </div>
        )
    }
})


export default WebViewer

