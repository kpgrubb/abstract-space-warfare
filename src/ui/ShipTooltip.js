/**
 * ShipTooltip.js - Hover tooltips for ship statistics
 * Displays key stats when hovering over ships
 */

export class ShipTooltip {
    constructor(engine) {
        this.engine = engine;
        this.canvas = null;
        this.hoveredShip = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isVisible = false;

        // Tooltip styling
        this.padding = 8;
        this.lineHeight = 14;
        this.fontSize = 11;
        this.maxWidth = 180;

        // Bind handlers
        this.handleMouseMove = this.handleMouseMove.bind(this);
    }

    /**
     * Initialize tooltip system
     */
    init(canvas) {
        this.canvas = canvas;
        canvas.addEventListener('mousemove', this.handleMouseMove);
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;

        // Convert screen to world coordinates using camera
        const worldPos = this.engine.camera.screenToWorld(this.mouseX, this.mouseY);

        // Find ship under cursor
        this.hoveredShip = this.findShipAt(worldPos.x, worldPos.y);
        this.isVisible = this.hoveredShip !== null;
    }

    /**
     * Find a ship at the given world coordinates
     */
    findShipAt(worldX, worldY) {
        if (!this.engine || !this.engine.entities) return null;

        // Check entities in reverse order (top-most first)
        for (let i = this.engine.entities.length - 1; i >= 0; i--) {
            const entity = this.engine.entities[i];
            if (!entity.alive || !entity.type) continue;

            // Calculate distance from cursor to entity center
            const dx = worldX - entity.x;
            const dy = worldY - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Use entity size for hit detection (with some padding)
            const hitRadius = (entity.size || 10) * 1.5;

            if (distance <= hitRadius) {
                return entity;
            }
        }

        return null;
    }

    /**
     * Get formatted ship statistics
     */
    getShipStats(ship) {
        const stats = [];

        // Ship name/type
        const typeName = this.formatTypeName(ship.type);
        stats.push({ label: typeName, value: '', isHeader: true });

        // Team
        const teamColor = ship.team === 'friendly' ? '#00aaff' : '#ff4444';
        stats.push({ label: 'Team', value: ship.team === 'friendly' ? 'FRIENDLY' : 'ENEMY', color: teamColor });

        // Health
        const healthPercent = Math.round((ship.health / ship.maxHealth) * 100);
        const healthColor = healthPercent > 60 ? '#44ff44' : healthPercent > 30 ? '#ffaa00' : '#ff4444';
        stats.push({ label: 'Hull', value: `${Math.round(ship.health)}/${ship.maxHealth} (${healthPercent}%)`, color: healthColor });

        // Shields (if applicable)
        if (ship.maxShields && ship.maxShields > 0) {
            const shieldPercent = Math.round((ship.shields / ship.maxShields) * 100);
            stats.push({ label: 'Shields', value: `${Math.round(ship.shields)}/${ship.maxShields} (${shieldPercent}%)`, color: '#00ffff' });
        }

        // Weapons/DPS
        if (ship.hardpoints && ship.hardpoints.length > 0) {
            const weapons = ship.hardpoints.map(h => this.formatWeaponType(h.type)).join(', ');
            stats.push({ label: 'Weapons', value: weapons });
        }

        // Speed
        if (ship.maxSpeed) {
            stats.push({ label: 'Speed', value: `${Math.round(ship.maxSpeed)}` });
        }

        // Special abilities based on ship type
        if (ship.type === 'carrier') {
            stats.push({ label: 'Fighters', value: `${ship.deployedFighters || 0}/${ship.maxFighters || 6}` });
            if (!ship.launchReady) {
                stats.push({ label: 'Launch', value: 'Warming up...', color: '#ffaa00' });
            }
        }

        if (ship.type === 'dreadnought') {
            if (ship.spinalBeamCharging) {
                const chargePercent = Math.round((ship.spinalChargeTime / ship.spinalChargeMax) * 100);
                stats.push({ label: 'Spinal', value: `Charging ${chargePercent}%`, color: '#ff00ff' });
            } else if (ship.spinalBeamReady) {
                stats.push({ label: 'Spinal', value: 'READY', color: '#00ff00' });
            } else {
                stats.push({ label: 'Spinal', value: 'Cooldown', color: '#888888' });
            }
        }

        if (ship.type === 'repair_tender') {
            if (ship.repairBeamActive) {
                stats.push({ label: 'Repair', value: 'ACTIVE', color: '#00ff00' });
            } else {
                stats.push({ label: 'Repair', value: 'Searching...', color: '#888888' });
            }
        }

        if (ship.type === 'minelayer') {
            stats.push({ label: 'Mines', value: `${ship.minesDeployed || 0}/${ship.maxMines || 8}` });
        }

        if (ship.type === 'corvette' && ship.ecmActive) {
            stats.push({ label: 'ECM', value: 'JAMMING', color: '#ffff00' });
        }

        if (ship.type === 'destroyer' && ship.pointDefenseActive) {
            stats.push({ label: 'PD', value: 'ACTIVE', color: '#00ffff' });
        }

        // Status effects
        if (ship.isLastStand) {
            stats.push({ label: 'Status', value: 'LAST STAND!', color: '#ff8800' });
        } else if (ship.isRouting) {
            stats.push({ label: 'Status', value: 'ROUTING', color: '#ff0000' });
        } else if (ship.isRallied) {
            stats.push({ label: 'Status', value: 'RALLIED', color: '#00ff00' });
        }

        // Current target
        if (ship.target && ship.target.alive) {
            const targetType = this.formatTypeName(ship.target.type);
            stats.push({ label: 'Target', value: targetType, color: '#ffaa00' });
        }

        return stats;
    }

    /**
     * Format ship type name for display
     */
    formatTypeName(type) {
        if (!type) return 'Unknown';
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Format weapon type for display
     */
    formatWeaponType(type) {
        const types = {
            'ballistic': 'Ballistic',
            'laser': 'Laser',
            'missile': 'Missile',
            'flak': 'Flak',
            'plasma': 'Plasma',
            'railgun': 'Railgun'
        };
        return types[type] || type;
    }

    /**
     * Render the tooltip
     */
    render(renderer) {
        if (!this.isVisible || !this.hoveredShip) return;

        const ctx = renderer.getContext();
        const stats = this.getShipStats(this.hoveredShip);

        ctx.save();

        // Calculate tooltip dimensions
        ctx.font = `bold ${this.fontSize}px "Consolas", "Courier New", monospace`;

        let maxTextWidth = 0;
        for (const stat of stats) {
            const text = stat.isHeader ? stat.label : `${stat.label}: ${stat.value}`;
            const width = ctx.measureText(text).width;
            maxTextWidth = Math.max(maxTextWidth, width);
        }

        const tooltipWidth = Math.min(maxTextWidth + this.padding * 2, this.maxWidth);
        const tooltipHeight = stats.length * this.lineHeight + this.padding * 2;

        // Position tooltip (offset from cursor, keep on screen)
        let tooltipX = this.mouseX + 15;
        let tooltipY = this.mouseY + 15;

        // Keep on screen
        if (tooltipX + tooltipWidth > this.canvas.width) {
            tooltipX = this.mouseX - tooltipWidth - 10;
        }
        if (tooltipY + tooltipHeight > this.canvas.height) {
            tooltipY = this.mouseY - tooltipHeight - 10;
        }

        // Draw background
        const teamColor = this.hoveredShip.team === 'friendly'
            ? { r: 0, g: 80, b: 160 }
            : { r: 160, g: 40, b: 40 };

        ctx.fillStyle = `rgba(${teamColor.r}, ${teamColor.g}, ${teamColor.b}, 0.9)`;
        ctx.strokeStyle = this.hoveredShip.team === 'friendly' ? '#00aaff' : '#ff4444';
        ctx.lineWidth = 2;

        // Rounded rectangle
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(tooltipX + radius, tooltipY);
        ctx.lineTo(tooltipX + tooltipWidth - radius, tooltipY);
        ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY, tooltipX + tooltipWidth, tooltipY + radius);
        ctx.lineTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight - radius);
        ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight, tooltipX + tooltipWidth - radius, tooltipY + tooltipHeight);
        ctx.lineTo(tooltipX + radius, tooltipY + tooltipHeight);
        ctx.quadraticCurveTo(tooltipX, tooltipY + tooltipHeight, tooltipX, tooltipY + tooltipHeight - radius);
        ctx.lineTo(tooltipX, tooltipY + radius);
        ctx.quadraticCurveTo(tooltipX, tooltipY, tooltipX + radius, tooltipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw stats
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        let y = tooltipY + this.padding;

        for (const stat of stats) {
            if (stat.isHeader) {
                // Header style
                ctx.font = `bold ${this.fontSize + 2}px "Consolas", "Courier New", monospace`;
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = this.hoveredShip.team === 'friendly' ? '#00aaff' : '#ff4444';
                ctx.shadowBlur = 4;
                ctx.fillText(stat.label, tooltipX + this.padding, y);
                ctx.shadowBlur = 0;
                y += this.lineHeight + 2;
            } else {
                // Regular stat
                ctx.font = `${this.fontSize}px "Consolas", "Courier New", monospace`;

                // Label
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(`${stat.label}: `, tooltipX + this.padding, y);

                // Value
                const labelWidth = ctx.measureText(`${stat.label}: `).width;
                ctx.fillStyle = stat.color || '#ffffff';
                ctx.fillText(stat.value, tooltipX + this.padding + labelWidth, y);

                y += this.lineHeight;
            }
        }

        ctx.restore();
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        }
    }
}
