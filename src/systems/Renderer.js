/**
 * Renderer.js - Canvas rendering system
 * Handles all drawing operations and visual effects
 */

export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = null;
        this.width = 0;
        this.height = 0;

        // Rendering settings
        this.backgroundColor = '#0a0a0a';
        this.glowEnabled = true;
    }

    /**
     * Initialize the renderer
     */
    init() {
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Handle window resize
        window.addEventListener('resize', () => this.resize());

        // Resize callback for camera
        this.onResize = null;

        console.log(`Renderer initialized: ${this.width}x${this.height}`);
    }

    /**
     * Resize canvas to fill window
     */
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Notify camera of resize
        if (this.onResize) {
            this.onResize(this.width, this.height);
        }

        console.log(`Canvas resized: ${this.width}x${this.height}`);
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw a triangle (infantry unit)
     * @param {number} x - Center x position
     * @param {number} y - Center y position
     * @param {number} size - Size of the triangle
     * @param {number} rotation - Rotation in radians
     * @param {string} color - Fill color
     * @param {boolean} glow - Enable glow effect
     */
    drawTriangle(x, y, size, rotation, color, glow = true) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        // Draw glow effect
        if (glow && this.glowEnabled) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
        }

        // Draw triangle
        this.ctx.beginPath();
        const height = size * Math.sqrt(3) / 2;
        this.ctx.moveTo(0, -height * 0.66);
        this.ctx.lineTo(-size / 2, height * 0.33);
        this.ctx.lineTo(size / 2, height * 0.33);
        this.ctx.closePath();

        // Fill
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Bright outline
        this.ctx.strokeStyle = this.lightenColor(color);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    /**
     * Draw a diamond (cavalry unit)
     * @param {number} x - Center x position
     * @param {number} y - Center y position
     * @param {number} size - Size of the diamond
     * @param {number} rotation - Rotation in radians
     * @param {string} color - Fill color
     * @param {boolean} glow - Enable glow effect
     */
    drawDiamond(x, y, size, rotation, color, glow = true) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        // Draw glow effect
        if (glow && this.glowEnabled) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
        }

        // Draw diamond
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(size * 0.6, 0);
        this.ctx.lineTo(0, size);
        this.ctx.lineTo(-size * 0.6, 0);
        this.ctx.closePath();

        // Fill
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Bright outline
        this.ctx.strokeStyle = this.lightenColor(color);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    /**
     * Draw a hexagon (artillery unit)
     * @param {number} x - Center x position
     * @param {number} y - Center y position
     * @param {number} size - Size of the hexagon
     * @param {string} color - Fill color
     * @param {boolean} glow - Enable glow effect
     */
    drawHexagon(x, y, size, color, glow = true) {
        this.ctx.save();

        // Draw glow effect
        if (glow && this.glowEnabled) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
        }

        // Draw hexagon
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();

        // Fill
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Bright outline
        this.ctx.strokeStyle = this.lightenColor(color);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    /**
     * Draw a circle
     * @param {number} x - Center x position
     * @param {number} y - Center y position
     * @param {number} radius - Radius of circle
     * @param {string} color - Fill color
     */
    drawCircle(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    /**
     * Draw text
     * @param {string} text - Text to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Text color
     * @param {number} size - Font size
     */
    drawText(text, x, y, color, size = 16) {
        this.ctx.font = `${size}px 'Courier New', monospace`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }

    /**
     * Draw a line
     * @param {number} x1 - Start x
     * @param {number} y1 - Start y
     * @param {number} x2 - End x
     * @param {number} y2 - End y
     * @param {string} color - Line color
     * @param {number} width - Line width
     */
    drawLine(x1, y1, x2, y2, color, width = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    /**
     * Lighten a color for brighter outlines
     * @param {string} color - Hex color
     * @returns {string} Lightened color
     */
    lightenColor(color) {
        // Simple lightening: add to RGB values
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 80);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 80);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 80);
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Get canvas context
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Get canvas dimensions
     */
    getDimensions() {
        return { width: this.width, height: this.height };
    }
}
