import { useEffect, useRef, useState } from 'react';

const DEFAULT_CARD_HEIGHT = 500;
const MIN_CARD_HEIGHT = 350;
const MAX_CARD_HEIGHT = 900;

export function useResize() {

    const [cardHeight, setCardHeight] = useState(DEFAULT_CARD_HEIGHT);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartYRef = useRef(0);
    const dragStartHeightRef = useRef(DEFAULT_CARD_HEIGHT);
    const rafIdRef = useRef(null);
    const pendingHeightRef = useRef(DEFAULT_CARD_HEIGHT);

    useEffect(() => {
        const onMouseMove = (event) => {
            if (!isResizing) return;

            // Dragging upward increases height; dragging downward decreases it.
            const deltaY = event.clientY - dragStartYRef.current;
            const nextHeight = dragStartHeightRef.current - deltaY;
            const viewportMax = Math.max(MIN_CARD_HEIGHT, window.innerHeight - 80);
            const clampedHeight = Math.max(MIN_CARD_HEIGHT, Math.min(nextHeight, Math.min(MAX_CARD_HEIGHT, viewportMax)));
            pendingHeightRef.current = clampedHeight;
            if (rafIdRef.current == null) {
                rafIdRef.current = window.requestAnimationFrame(() => {
                    setCardHeight(pendingHeightRef.current);
                    rafIdRef.current = null;
                });
            }
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            setIsResizing(false);
            document.body.style.userSelect = '';
            if (rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            if (rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [isResizing]);

    const onResizeStart = (event) => {
        event.preventDefault();
        dragStartYRef.current = event.clientY;
        dragStartHeightRef.current = cardHeight;
        setIsResizing(true);
        document.body.style.userSelect = 'none';
    };

    return { cardHeight, isResizing, onResizeStart };
}