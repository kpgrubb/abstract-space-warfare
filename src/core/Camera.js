/**
 * Camera.js - Viewport and zoom control
 * Handles zooming and panning the battle view
 */

export class Camera {
    constructor() {
        // Zoom level (1.0 = normal, 0.5 = zoomed out, 2.0 = zoomed in)
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.minZoom = 0.3;
        this.maxZoom = 2.5;
        this.zoomSpeed = 0.1;
        this.zoomSmoothing = 5; // How fast zoom interpolates

        // Pan offset (in world coordinates)
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.panSmoothing = 8;

        // Canvas dimensions (set on init)
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        // Dragging state
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartCamX = 0;
        this.dragStartCamY = 0;

        // Bind event handlers
        this.handleWheel = this.handleWheel.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Initialize camera with canvas
     */
    init(canvas) {
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;

        // Add event listeners
        canvas.addEventListener('wheel', this.handleWheel, { passive: false });
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('mouseleave', this.handleMouseUp);
        window.addEventListener('keydown', this.handleKeyDown);

        // Store canvas reference
        this.canvas = canvas;
    }

    /**
     * Update canvas dimensions (call on resize)
     */
    resize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    /**
     * Handle mouse wheel for zooming
     */
    handleWheel(e) {
        e.preventDefault();

        // Get mouse position relative to canvas center
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom change
        const zoomDelta = e.deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom + zoomDelta));

        // Zoom toward mouse position
        if (newZoom !== this.targetZoom) {
            const zoomRatio = newZoom / this.targetZoom;

            // Adjust pan to zoom toward mouse
            const worldMouseX = (mouseX - this.canvasWidth / 2) / this.targetZoom + this.targetX;
            const worldMouseY = (mouseY - this.canvasHeight / 2) / this.targetZoom + this.targetY;

            this.targetX = worldMouseX - (mouseX - this.canvasWidth / 2) / newZoom;
            this.targetY = worldMouseY - (mouseY - this.canvasHeight / 2) / newZoom;

            this.targetZoom = newZoom;
        }
    }

    /**
     * Handle mouse down for panning
     */
    handleMouseDown(e) {
        if (e.button === 0) { // Left click
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragStartCamX = this.targetX;
            this.dragStartCamY = this.targetY;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    /**
     * Handle mouse move for panning
     */
    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = (e.clientX - this.dragStartX) / this.zoom;
            const dy = (e.clientY - this.dragStartY) / this.zoom;
            this.targetX = this.dragStartCamX - dx;
            this.targetY = this.dragStartCamY - dy;
        }
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(e) {
        // Reset camera with Home or R key
        if (e.key === 'Home' || (e.key === 'r' && !e.ctrlKey && !e.metaKey)) {
            this.reset();
        }

        // Zoom with +/- keys
        if (e.key === '=' || e.key === '+') {
            this.targetZoom = Math.min(this.maxZoom, this.targetZoom + this.zoomSpeed * 2);
        }
        if (e.key === '-' || e.key === '_') {
            this.targetZoom = Math.max(this.minZoom, this.targetZoom - this.zoomSpeed * 2);
        }

        // Zoom presets with number keys
        if (e.key === '1') this.targetZoom = 1.0;
        if (e.key === '2') this.targetZoom = 1.5;
        if (e.key === '3') this.targetZoom = 2.0;
        if (e.key === '0') this.targetZoom = 0.5;
    }

    /**
     * Reset camera to default view
     */
    reset() {
        this.targetZoom = 1.0;
        this.targetX = 0;
        this.targetY = 0;
    }

    /**
     * Update camera (smooth interpolation)
     */
    update(deltaTime) {
        // Smooth zoom
        const zoomDiff = this.targetZoom - this.zoom;
        this.zoom += zoomDiff * Math.min(1, deltaTime * this.zoomSmoothing);

        // Smooth pan
        const xDiff = this.targetX - this.x;
        const yDiff = this.targetY - this.y;
        this.x += xDiff * Math.min(1, deltaTime * this.panSmoothing);
        this.y += yDiff * Math.min(1, deltaTime * this.panSmoothing);
    }

    /**
     * Apply camera transform to canvas context
     */
    applyTransform(ctx) {
        // Move to center, apply zoom, then offset
        ctx.translate(this.canvasWidth / 2, this.canvasHeight / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.canvasWidth / 2 - this.x, -this.canvasHeight / 2 - this.y);
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.canvasWidth / 2) / this.zoom + this.canvasWidth / 2 + this.x,
            y: (screenY - this.canvasHeight / 2) / this.zoom + this.canvasHeight / 2 + this.y
        };
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.canvasWidth / 2 - this.x) * this.zoom + this.canvasWidth / 2,
            y: (worldY - this.canvasHeight / 2 - this.y) * this.zoom + this.canvasHeight / 2
        };
    }

    /**
     * Get current zoom level
     */
    getZoom() {
        return this.zoom;
    }

    /**
     * Check if a world position is visible on screen
     */
    isVisible(worldX, worldY, margin = 100) {
        const screen = this.worldToScreen(worldX, worldY);
        return screen.x >= -margin &&
               screen.x <= this.canvasWidth + margin &&
               screen.y >= -margin &&
               screen.y <= this.canvasHeight + margin;
    }
}
