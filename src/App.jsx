import { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Howl } from 'howler';
import styled from '@emotion/styled';
import hotspotData from './data/hotspots.json';

// Constants for image dimensions
const IMAGE_WIDTH = 30000;
const IMAGE_HEIGHT = 17078;

// Styled components for UI
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #121212;
`;

const ArtworkContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// SVG overlay to contain all interactive hotspots
const HotspotOverlay = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allows clicks to pass through non-polygon areas */
`;

const HotspotPolygon = styled.polygon`
  fill: transparent;
  stroke: ${props => props.color || '#FF0000'};
  stroke-width: 10; /* Clearly visible outline */
  stroke-opacity: 0.9;
  pointer-events: all;
  cursor: pointer;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
  transition: all 0.3s ease;

  &:hover {
    fill: ${props => props.color + '1A' || '#FF00001A'}; /* Reduced opacity to ~10% on hover */
    stroke-width: 10;
    filter: drop-shadow(0 0 5px ${props => props.color || '#FF0000'});
  }
`;

const AudioPlayerContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 15px;
  display: ${props => (props.visible ? 'flex' : 'none')};
  align-items: center;
  color: white;
  z-index: 1000;
`;

const AudioControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const LinkButton = styled.button`
  background-color: rgba(40, 40, 40, 0.8); /* Semi-transparent dark background */
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding: 8px 15px;
  margin-left: 15px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(60, 60, 60, 0.9);
    border-color: white;
  }
`;

const PlayButton = styled.button`
  background-color: transparent;
  border: 2px solid white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: white;
  font-size: 18px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const NavigationButton = styled.button`
  background-color: rgba(0, 0, 0, 0.4);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const AudioLabel = styled.div`
  margin-left: 15px;
  font-size: 16px;
  flex-grow: 1;
`;

// Component for displaying rollover images when hovering hotspots
const RolloverImage = styled.div`
  position: fixed;
  bottom: 100px; // Position above the audio player
  right: 20px;
  z-index: 1500;
  max-width: 400px;
  max-height: 400px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  border: 3px solid white;
  overflow: hidden;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const HoverInfo = styled.div`
  position: fixed;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  z-index: 2000;
  pointer-events: none;
  transition: opacity 0.2s ease;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  opacity: ${props => (props.visible ? 1 : 0)};
  max-width: 250px; // Limit tooltip width
`;

const Controls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  display: flex;
  gap: 5px;
`;

const ControlButton = styled.button`
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid white;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

function App() {
    // Application state
    const [hotspots, setHotspots] = useState([]);
    const [scale, setScale] = useState(1);
    const [activeHotspot, setActiveHotspot] = useState(null);
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hoverInfo, setHoverInfo] = useState({ visible: false, x: 0, y: 0, text: '' });
    const [rolloverImage, setRolloverImage] = useState({ visible: false, src: null });
    const [previousSound, setPreviousSound] = useState(null);
    const transformRef = useRef(null);

    // Load hotspot data from JSON
    useEffect(() => {
        setHotspots(hotspotData);
    }, []);

    // Memory management - ensures audio resources are released when component unmounts
    // or when the active sound changes
    useEffect(() => {
        // Cleanup function to run when component unmounts
        return () => {
            if (sound) {
                sound.stop();
                sound.unload();
            }
        };
    }, [sound]); // Dependency on sound ensures cleanup runs when sound changes

    // Handle hotspot click - triggers audio, zoom, and potentially links
    // Implements a two-phase memory management strategy for audio:
    // 1. Immediate stop and unload of current sound
    // 2. Delayed cleanup of previous sound after new sound is loaded
    const handleHotspotClick = (hotspot) => {
        // For type 5 (link-only), set active hotspot without audio
        if (hotspot.type === 5) {
            setActiveHotspot(hotspot);
        }

        // Handle audio for types 1-4
        if (hotspot.type !== 5) {
            setActiveHotspot(hotspot);

            // Stop any currently playing audio and unload it to free memory
            if (sound) {
                sound.stop();
                sound.unload();

                // Keep a reference to the current sound for delayed cleanup
                setPreviousSound(sound);
            }

            // Create new audio instance
            const audioPath = hotspot.narration;
            console.log("Loading audio from:", audioPath);

            const newSound = new Howl({
                src: [audioPath],
                html5: true,
                onend: () => {
                    setIsPlaying(false);
                },
                onplay: () => {
                    setIsPlaying(true);
                },
                onpause: () => {
                    setIsPlaying(false);
                },
                onstop: () => {
                    setIsPlaying(false);
                },
                onload: () => {
                    // Once new sound is loaded, fully unload the previous one
                    if (previousSound) {
                        previousSound.unload();
                        setPreviousSound(null);
                    }
                },
                onloaderror: (id, err) => {
                    console.error("Howler load error:", err);
                },
                onplayerror: (id, err) => {
                    console.error("Howler play error:", err);
                }
            });

            setSound(newSound);

            // Small delay to ensure audio is loaded
            setTimeout(() => {
                newSound.play();
            }, 100);
        }

        // Calculate polygon bounds to determine zoom behavior
        const calculatePolygonBounds = (coords) => {
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            coords.forEach(point => {
                minX = Math.min(minX, point[0]);
                minY = Math.min(minY, point[1]);
                maxX = Math.max(maxX, point[0]);
                maxY = Math.max(maxY, point[1]);
            });

            return {
                minX, minY, maxX, maxY,
                width: maxX - minX,
                height: maxY - minY,
                centerX: (minX + maxX) / 2,
                centerY: (minY + maxY) / 2
            };
        };

        // Handle zoom to center on the selected hotspot
        if (transformRef.current) {
            // Calculate polygon boundaries
            const bounds = calculatePolygonBounds(hotspot.coords);

            // Get reference to transform methods and wrapper dimensions
            const { setTransform, instance } = transformRef.current;

            // Get current container dimensions
            const containerWidth = instance.wrapperComponent.clientWidth;
            const containerHeight = instance.wrapperComponent.clientHeight;

            // Current scaled image dimensions
            const imageWidthScaled = instance.contentComponent.clientWidth;
            const imageHeightScaled = instance.contentComponent.clientHeight;

            // Calculate zoom with 20% margin around hotspot
            const margin = 1.2;
            const hotspotWidthPercent = bounds.width / IMAGE_WIDTH;
            const hotspotHeightPercent = bounds.height / IMAGE_HEIGHT;

            // Calculate ideal zoom level based on hotspot size
            const zoomX = containerWidth / (imageWidthScaled * hotspotWidthPercent * margin);
            const zoomY = containerHeight / (imageHeightScaled * hotspotHeightPercent * margin);

            // Use the smaller zoom to ensure entire hotspot is visible
            // with a maximum cap to prevent extreme zoom
            const targetZoom = Math.min(zoomX, zoomY, 2.5);

            // Convert hotspot center to percentage of image dimensions
            const centerXPercent = bounds.centerX / IMAGE_WIDTH;
            const centerYPercent = bounds.centerY / IMAGE_HEIGHT;

            // Calculate position to center the hotspot
            const pointX = centerXPercent * imageWidthScaled;
            const pointY = centerYPercent * imageHeightScaled;

            // Calculate centered position
            const newPosX = (containerWidth / 2) - (pointX * targetZoom);
            const newPosY = (containerHeight / 2) - (pointY * targetZoom);

            // Apply transform with animation
            setTransform(newPosX, newPosY, targetZoom, 800);
        }
    };

    // Find next hotspot in sequence based on ID
    const getNextHotspot = (currentHotspot) => {
        const nextId = String(parseInt(currentHotspot.id) + 1);
        return hotspots.find(spot => spot.id === nextId);
    };

    // Find previous hotspot in sequence based on ID
    const getPrevHotspot = (currentHotspot) => {
        const currentNum = parseInt(currentHotspot.id);
        if (currentNum <= 1) return null;

        const prevId = String(currentNum - 1);
        return hotspots.find(spot => spot.id === prevId);
    };

    // Navigate between hotspots using previous/next buttons
    const navigateToHotspot = (direction) => {
        const targetHotspot = direction === 'next'
            ? getNextHotspot(activeHotspot)
            : getPrevHotspot(activeHotspot);

        if (targetHotspot) {
            handleHotspotClick(targetHotspot);
        }
    };

    // Toggle audio play/pause
    const togglePlayPause = () => {
        if (!sound) return;

        if (isPlaying) {
            sound.pause();
        } else {
            sound.play();
        }
    };

    // Handle mouse enter on hotspot - shows tooltip and rollover image
    const handleHotspotMouseEnter = (event, hotspot) => {
        // Show hover text tooltip
        setHoverInfo({
            visible: true,
            x: event.clientX + 10,
            y: event.clientY - 30,
            text: hotspot.hover_text
        });

        // Show rollover image for types 3 and 4
        if ((hotspot.type === 3 || hotspot.type === 4) && hotspot.image) {
            setRolloverImage({
                visible: true,
                src: hotspot.image
            });
        }
    };

    // Handle mouse leave - hide tooltip and rollover image
    const handleHotspotMouseLeave = () => {
        setHoverInfo({ ...hoverInfo, visible: false });
        setRolloverImage({ ...rolloverImage, visible: false });
    };

    // Update tooltip position as mouse moves
    const handleHotspotMouseMove = (event) => {
        if (hoverInfo.visible) {
            setHoverInfo({
                ...hoverInfo,
                x: event.clientX + 10,
                y: event.clientY - 30
            });
        }
    };

    return (
        <AppContainer>
            {/* Pan/Zoom component to handle high-resolution artwork */}
            <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={10}
                onZoom={(ref) => setScale(ref.state.scale)}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
                ref={transformRef}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        {/* Zoom controls */}
                        <Controls>
                            <ControlButton onClick={() => {
                                if (transformRef.current) {
                                    transformRef.current.zoomIn(0.5);
                                }
                            }}>+</ControlButton>

                            <ControlButton onClick={() => {
                                if (transformRef.current) {
                                    transformRef.current.zoomOut(0.5);
                                }
                            }}>-</ControlButton>

                            <ControlButton onClick={() => {
                                if (transformRef.current) {
                                    transformRef.current.resetTransform();
                                }
                            }}>Reset</ControlButton>
                        </Controls>

                        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                            <ArtworkContainer>
                                {/* Main artwork image */}
                                <img
                                    src="/images/garden.jpg"
                                    alt="Interactive Artwork"
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />

                                {/* SVG overlay containing all interactive hotspots */}
                                <HotspotOverlay
                                    viewBox={`0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}`}
                                    preserveAspectRatio="xMidYMid meet"
                                >
                                    {hotspots.map((hotspot) => {
                                        // Convert coordinates to SVG polygon points format
                                        const points = hotspot.coords.map(coord => `${coord[0]},${coord[1]}`).join(' ');

                                        return (
                                            <HotspotPolygon
                                                key={hotspot.id}
                                                points={points}
                                                color={hotspot.color}
                                                onClick={() => handleHotspotClick(hotspot)}
                                                onMouseEnter={(e) => handleHotspotMouseEnter(e, hotspot)}
                                                onMouseMove={handleHotspotMouseMove}
                                                onMouseLeave={handleHotspotMouseLeave}
                                            />
                                        );
                                    })}
                                </HotspotOverlay>
                            </ArtworkContainer>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>

            {/* Audio player with navigation controls */}
            <AudioPlayerContainer visible={activeHotspot !== null}>
                {activeHotspot && (
                    <>
                        <AudioControls>
                            <NavigationButton
                                onClick={() => navigateToHotspot('prev')}
                                disabled={!activeHotspot || !getPrevHotspot(activeHotspot)}
                            >
                                ◀ Previous
                            </NavigationButton>

                            <PlayButton onClick={togglePlayPause}>
                                {isPlaying ? '❚❚' : '▶'}
                            </PlayButton>

                            <NavigationButton
                                onClick={() => navigateToHotspot('next')}
                                disabled={!activeHotspot || !getNextHotspot(activeHotspot)}
                            >
                                Next ▶
                            </NavigationButton>
                        </AudioControls>
                        <AudioLabel>{activeHotspot.label}</AudioLabel>

                        {/* External link button for appropriate hotspot types */}
                        {(activeHotspot.type === 2 || activeHotspot.type === 4 || activeHotspot.type === 5) && activeHotspot.link && (
                            <LinkButton onClick={() => window.open(activeHotspot.link, '_blank')}>
                                View external source ↗
                            </LinkButton>
                        )}
                    </>
                )}
            </AudioPlayerContainer>

            {/* Rollover image display */}
            <RolloverImage visible={rolloverImage.visible}>
                {rolloverImage.src && <img src={rolloverImage.src} alt="Detail" />}
            </RolloverImage>

            {/* Hover tooltip */}
            <HoverInfo
                visible={hoverInfo.visible}
                x={hoverInfo.x}
                y={hoverInfo.y}
            >
                {hoverInfo.text}
            </HoverInfo>
        </AppContainer>
    );
}

export default App;