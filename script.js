// script.js

// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- MOBILE DETECTION ---
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 768;
    
    // --- 1. CUSTOM WEBGL FLUID WATERCOLOR BACKGROUND ---
    const fluidCanvas = document.getElementById('fluid-canvas');
    const gl = fluidCanvas.getContext('webgl');
    
    if (!gl || isMobile) {
        console.warn('WebGL not supported or mobile device, falling back to static background');
        fluidCanvas.style.background = `
            radial-gradient(circle at 20% 30%, rgba(204, 179, 242, 0.9) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(102, 230, 153, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 40% 70%, rgba(255, 153, 128, 0.9) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(255, 217, 51, 0.7) 0%, transparent 50%),
            radial-gradient(circle at 60% 50%, rgba(179, 217, 242, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 10% 80%, rgba(230, 179, 204, 0.7) 0%, transparent 50%),
            linear-gradient(135deg, #faf6f2, #e6d9f5, #b3e6cc, #ffcdb2)
        `;
        fluidCanvas.style.animation = 'gentleShift 20s ease-in-out infinite';
        
        // Add CSS animation for the static background
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gentleShift {
                0%, 100% { filter: hue-rotate(0deg) brightness(1); }
                50% { filter: hue-rotate(20deg) brightness(1.1); }
            }
        `;
        document.head.appendChild(style);
        
        // Skip WebGL initialization
        initializeGarden();
        return;
    }

    // Resize canvas to match display size
    function resizeCanvas() {
        const displayWidth = fluidCanvas.clientWidth;
        const displayHeight = fluidCanvas.clientHeight;
        
        if (fluidCanvas.width !== displayWidth || fluidCanvas.height !== displayHeight) {
            fluidCanvas.width = displayWidth;
            fluidCanvas.height = displayHeight;
            gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Vertex shader (positions for the full-screen quad)
    const vertexShaderSource = `
        attribute vec2 a_position;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_position * 0.5 + 0.5;
        }
    `;

    // Fragment shader with noise-based watercolor effect
    const fragmentShaderSource = `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;

        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));
            
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            for (int i = 0; i < 4; i++) {
                value += amplitude * smoothNoise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            return value;
        }

        void main() {
            vec2 uv = v_texCoord;
            vec2 p = uv * 4.0;
            
            float t = u_time * 0.1;
            p += vec2(sin(t * 0.7), cos(t * 0.5)) * 0.5;
            
            vec2 mouseUv = u_mouse / u_resolution;
            float mouseDist = length(uv - mouseUv);
            float ripple = sin(mouseDist * 20.0 - u_time * 3.0) * exp(-mouseDist * 8.0) * 0.2;
            p += ripple;
            
            float n1 = fbm(p + t);
            float n2 = fbm(p * 0.8 + vec2(t * 0.6, -t * 0.4));
            float n3 = fbm(p * 1.2 + vec2(-t * 0.3, t * 0.8));
            
            float combined = (n1 + n2 + n3) / 3.0;
            
            vec3 deepLavender = vec3(0.8, 0.7, 0.95);
            vec3 emeraldGreen = vec3(0.4, 0.9, 0.6);
            vec3 warmCoral = vec3(1.0, 0.6, 0.5);
            vec3 goldenYellow = vec3(1.0, 0.85, 0.2);
            vec3 softPeach = vec3(0.98, 0.9, 0.82);
            vec3 dustyRose = vec3(0.9, 0.7, 0.8);
            vec3 skyBlue = vec3(0.7, 0.85, 0.95);
            
            float colorPhase = sin(combined * 3.14159 * 2.0 + t * 0.5) * 0.5 + 0.5;
            vec3 color = softPeach;
            
            if (combined < 0.15) {
                color = mix(softPeach, deepLavender, smoothstep(0.0, 0.15, combined));
            } else if (combined < 0.3) {
                color = mix(deepLavender, skyBlue, smoothstep(0.15, 0.3, combined));
            } else if (combined < 0.45) {
                color = mix(skyBlue, emeraldGreen, smoothstep(0.3, 0.45, combined));
            } else if (combined < 0.6) {
                color = mix(emeraldGreen, warmCoral, smoothstep(0.45, 0.6, combined));
            } else if (combined < 0.75) {
                color = mix(warmCoral, goldenYellow, smoothstep(0.6, 0.75, combined));
            } else if (combined < 0.9) {
                color = mix(goldenYellow, dustyRose, smoothstep(0.75, 0.9, combined));
            } else {
                color = mix(dustyRose, softPeach, smoothstep(0.9, 1.0, combined));
            }
            
            vec3 timeColor = mix(deepLavender, warmCoral, sin(uv.x * 2.0 + t) * 0.5 + 0.5);
            color = mix(color, timeColor, 0.1 * colorPhase);
            
            float swirl = sin(uv.x * 8.0 + cos(uv.y * 6.0) + t * 2.0) * 0.5 + 0.5;
            vec3 swirlColor = mix(emeraldGreen, goldenYellow, swirl);
            color = mix(color, swirlColor, 0.05);
            
            float texture = smoothNoise(uv * 200.0) * 0.05;
            color += texture;
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // Shader compilation helper
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Create and link shader program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        return;
    }

    // Get attribute and uniform locations
    const positionAttribute = gl.getAttribLocation(program, 'a_position');
    const timeUniform = gl.getUniformLocation(program, 'u_time');
    const resolutionUniform = gl.getUniformLocation(program, 'u_resolution');
    const mouseUniform = gl.getUniformLocation(program, 'u_mouse');

    // Create full-screen quad
    const positions = [
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
    ];
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Mouse tracking
    let mouseX = 0, mouseY = 0;
    fluidCanvas.addEventListener('mousemove', (e) => {
        const rect = fluidCanvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = fluidCanvas.height - (e.clientY - rect.top); // Flip Y coordinate
    });

    // Animation loop
    function animate(time) {
        resizeCanvas();
        
        gl.useProgram(program);
        
        // Set uniforms
        gl.uniform1f(timeUniform, time * 0.001);
        gl.uniform2f(resolutionUniform, fluidCanvas.width, fluidCanvas.height);
        gl.uniform2f(mouseUniform, mouseX, mouseY);
        
        // Set up vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionAttribute);
        gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(animate);
    }
    
    animate(0);
    
    // Initialize garden after WebGL setup
    initializeGarden();
    
    // Function to initialize garden components
    function initializeGarden() {
        // --- 2. GARDEN CANVAS SETUP ---
    const gardenCanvas = document.getElementById('garden-canvas');
    const ctx = gardenCanvas.getContext('2d');
    let { width, height } = gardenCanvas.getBoundingClientRect();
    gardenCanvas.width = width;
    gardenCanvas.height = height;

    window.addEventListener('resize', () => {
        let newSize = gardenCanvas.getBoundingClientRect();
        width = newSize.width;
        height = newSize.height;
        gardenCanvas.width = width;
        gardenCanvas.height = height;
    });

    // --- 3. L-SYSTEM FOR PROCEDURAL PLANT GENERATION ---
    
    // L-System rule sets for different plant types (palettes slightly expanded for more variation)
    const plantTypes = {
        flower: {
            axiom: 'F',
            rules: { 'F': 'FF[+F][-F]' },
            angle: 35,
            iterations: 3,
            colors: [
                { r: 216, g: 112, b: 147 }, // Pale Violet Red
                { r: 255, g: 105, b: 180 }, // Hot Pink
                { r: 218, g: 112, b: 214 }, // Orchid
                { r: 238, g: 130, b: 238 }, // Violet
                { r: 199, g: 21,  b: 133 }  // Medium Violet Red
            ]
        },
        fern: {
            axiom: 'F',
            rules: { 'F': 'F[+F]F[-F]' },
            angle: 28,
            iterations: 3,
            colors: [
                { r: 46,  g: 139, b: 87  }, // Sea Green
                { r: 34,  g: 139, b: 34  }, // Forest Green
                { r: 107, g: 142, b: 35  }, // Olive Drab
                { r: 60,  g: 179, b: 113 }, // Medium Sea Green
                { r: 85,  g: 107, b: 47  }  // Dark Olive Green
            ]
        },
        vine: {
            axiom: 'F',
            rules: { 'F': 'F[+F][-F]F' },
            angle: 32,
            iterations: 3,
            colors: [
                { r: 70,  g: 130, b: 180 }, // Steel Blue
                { r: 100, g: 149, b: 237 }, // Cornflower Blue
                { r: 135, g: 206, b: 235 }, // Sky Blue
                { r: 123, g: 104, b: 238 }, // Medium Slate Blue
                { r: 95,  g: 158, b: 160 }  // Cadet Blue
            ]
        },
        tree: {
            axiom: 'F',
            rules: { 'F': 'FF[++F][--F]' },
            angle: 30,
            iterations: 3,
            colors: [
                { r: 160, g: 82,  b: 45  }, // Saddle Brown
                { r: 139, g: 69,  b: 19  }, // Brown
                { r: 210, g: 180, b: 140 }, // Tan
                { r: 188, g: 143, b: 143 }, // Rosy Brown
                { r: 205, g: 133, b: 63  }  // Peru
            ]
        }
    };

    // Generate L-System string
    function generateLSystem(axiom, rules, iterations) {
        let result = axiom;
        for (let i = 0; i < iterations; i++) {
            let newResult = '';
            for (let char of result) {
                newResult += rules[char] || char;
            }
            result = newResult;
        }
        return result;
    }

    // Turtle graphics state
    class TurtleState {
        constructor(x, y, angle, length) {
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.length = length;
        }

        copy() {
            return new TurtleState(this.x, this.y, this.angle, this.length);
        }
    }

    // Utility: dedupe points by distance (keep earliest/topmost)
    function dedupeByDistance(points, minDist = 6) {
        const out = [];
        const minDistSq = minDist * minDist;
        for (const p of points) {
            if (!out.some(q => {
                const dx = p.x - q.x, dy = p.y - q.y;
                return (dx*dx + dy*dy) < minDistSq;
            })) {
                out.push(p);
            }
        }
        return out;
    }

    // Small color jitter for extra palette variation (subtle)
    function jitterColor(c, amount = 18) {
        const j = (v) => Math.max(0, Math.min(255, v + Math.floor((Math.random() - 0.5) * amount * 2)));
        return { r: j(c.r), g: j(c.g), b: j(c.b) };
    }

    // Draw L-System with watercolor effects
    function drawLSystem(lSystemString, startX, startY, plantType, animate = false) {
        // --- SIZE VARIATION (plant-wide) ---
        const plantScale = 0.9 + Math.random() * 0.5; // 0.9 - 1.4
        const baseLength = (9 + Math.random() * 4) * plantScale; // 9 - 13 (was fixed 10)
        const initialAngleJitter = (Math.random() - 0.5) * 0.15; // slight lean
        const bendBias = (Math.random() - 0.5) * 0.18; // gentle left/right tendency

        const state = new TurtleState(startX, startY, -Math.PI / 2 + initialAngleJitter, baseLength);
        const stateStack = [];
        const angleRad = (plantType.angle * Math.PI) / 180;
        const segments = [];
        
        // Track endpoints and the true topmost tip while we traverse
        const finalPositions = [];
        let currentBranch = { positions: [] };
        let topmostTip = { x: startX, y: startY, depth: 0 };

        // Parse L-System string and execute turtle graphics
        for (let char of lSystemString) {
            switch (char) {
                case 'F': {
                    // slight bending & wobble to avoid straight-up growth
                    state.angle += bendBias * 0.04 + (Math.random() - 0.5) * 0.02;

                    const newX = state.x + Math.cos(state.angle) * state.length;
                    const newY = state.y + Math.sin(state.angle) * state.length;
                    segments.push({
                        type: 'line',
                        startX: state.x,
                        startY: state.y,
                        endX: newX,
                        endY: newY,
                        length: state.length,
                        depth: stateStack.length
                    });
                    
                    state.x = newX;
                    state.y = newY;

                    // variable decay for segment length (adds plant size variance)
                    state.length *= (0.84 + Math.random() * 0.07); // 0.84 - 0.91
                    
                    // Record this position for potential flower placement
                    const pos = { x: newX, y: newY, depth: stateStack.length };
                    currentBranch.positions.push(pos);

                    if (pos.y < topmostTip.y) {
                        topmostTip = { x: pos.x, y: pos.y, depth: pos.depth };
                    }
                    break;
                }
                case '+':
                    state.angle += angleRad + (Math.random() - 0.5) * 0.3;
                    break;
                case '-':
                    state.angle -= angleRad + (Math.random() - 0.5) * 0.3;
                    break;
                case '[':
                    stateStack.push(state.copy());
                    currentBranch = { positions: [] };
                    break;
                case ']':
                    if (currentBranch.positions.length > 0) {
                        const finalPos = currentBranch.positions[currentBranch.positions.length - 1];
                        finalPositions.push({
                            x: finalPos.x,
                            y: finalPos.y,
                            depth: finalPos.depth,
                            size: finalPos.depth === 0 ? 'large' : finalPos.depth === 1 ? 'medium' : 'small'
                        });
                    }
                    
                    if (stateStack.length > 0) {
                        const savedState = stateStack.pop();
                        state.x = savedState.x;
                        state.y = savedState.y;
                        state.angle = savedState.angle;
                        state.length = savedState.length;
                    }
                    currentBranch = { positions: [] };
                    break;
            }
        }
        
        // Also include the true topmost tip we tracked during traversal
        finalPositions.push({
            x: topmostTip.x,
            y: topmostTip.y,
            depth: topmostTip.depth,
            size: topmostTip.depth === 0 ? 'large' : topmostTip.depth === 1 ? 'medium' : 'small'
        });
        
        // Dedupe and sort by Y (top to bottom)
        const uniquePositions = dedupeByDistance(
            finalPositions.sort((a, b) => a.y - b.y),
            6
        );

        // Helper to select a "lower branch" endpoint (closer to bottom = larger y)
        function pickRandomLower(excludeSet) {
            if (uniquePositions.length <= 1) return null;
            const startIdx = Math.max(1, Math.floor(uniquePositions.length * 0.4)); // lower ~60%
            const candidates = uniquePositions
                .map((p, i) => ({ p, i }))
                .filter(({ i }) => i >= startIdx && !excludeSet.has(i));
            if (!candidates.length) return null;
            const { p, i } = candidates[Math.floor(Math.random() * candidates.length)];
            excludeSet.add(i);
            return p;
        }

        const desiredCount = Math.min(3, Math.max(2, uniquePositions.length >= 3 ? (Math.random() < 0.5 ? 2 : 3) : 2));

        const selected = [];
        const usedIdx = new Set();

        if (uniquePositions[0]) {
            selected.push(uniquePositions[0]); // Always take the topmost
            usedIdx.add(0);
        }

        if (desiredCount >= 2) {
            if (Math.random() < 0.25) { // 25% chance second flower goes to a lower branch
                const lower = pickRandomLower(usedIdx);
                if (lower) {
                    selected.push(lower);
                } else if (uniquePositions[1]) {
                    selected.push(uniquePositions[1]);
                    usedIdx.add(1);
                }
            } else if (uniquePositions[1]) {
                selected.push(uniquePositions[1]);
                usedIdx.add(1);
            }
        }

        if (desiredCount === 3) {
            if (Math.random() < 0.50) { // 50% chance third flower goes to a lower branch
                const lower = pickRandomLower(usedIdx);
                if (lower) {
                    selected.push(lower);
                } else {
                    const idx = [2,3,4].find(i => uniquePositions[i] && !usedIdx.has(i));
                    if (idx !== undefined) {
                        selected.push(uniquePositions[idx]);
                        usedIdx.add(idx);
                    }
                }
            } else {
                const idx = [2,3,4].find(i => uniquePositions[i] && !usedIdx.has(i));
                if (idx !== undefined) {
                    selected.push(uniquePositions[idx]);
                    usedIdx.add(idx);
                }
            }
        }

        // Debug logs
        console.log('Plant base at:', startX, startY);
        console.log('Topmost tip at:', Math.round(topmostTip.x), Math.round(topmostTip.y));
        console.log(`Found ${finalPositions.length} endpoints, kept ${uniquePositions.length}, placing ${selected.length} flowers`);
        selected.forEach((pos, i) => {
            console.log(`🌸 Flower ${i + 1}: (${Math.round(pos.x)}, ${Math.round(pos.y)}) depth: ${pos.depth} size: ${pos.size}`);
        });

        // Draw segments with watercolor effect
        if (animate) {
            let segmentIndex = 0;
            let animationRunning = true;
            
            function drawNextSegment() {
                if (segmentIndex < segments.length && animationRunning) {
                    drawWatercolorSegment(segments[segmentIndex], plantType.colors);
                    segmentIndex++;
                    requestAnimationFrame(drawNextSegment);
                } else if (animationRunning) {
                    animationRunning = false;
                    // After all segments are drawn, add flowers
                    setTimeout(() => {
                        selected.forEach((pos, index) => {
                            setTimeout(() => {
                                drawLargeFlower(pos.x, pos.y, plantType.colors, pos.size);
                            }, index * 300);
                        });
                    }, 200);
                }
            }
            drawNextSegment();
        } else {
            // Non-animated drawing
            segments.forEach(segment => drawWatercolorSegment(segment, plantType.colors));
            selected.forEach((pos) => {
                drawLargeFlower(pos.x, pos.y, plantType.colors, pos.size);
            });
        }
    }

    // Draw individual segment with watercolor effects
    function drawWatercolorSegment(segment, colors) {
        // slight palette jitter for variation
        const base = colors[Math.floor(Math.random() * colors.length)];
        const color = Math.random() < 0.6 ? jitterColor(base, 16) : base;

        const baseLineWidth = Math.max(0.8, segment.length * 0.35); // More variation based on segment
        
        ctx.save();
        
        // Add more organic variation based on branch depth and position
        const organicVariation = 1 + (Math.random() - 0.5) * 0.3; // ±15% size variation
        const depthVariation = 1 + (segment.depth * 0.1); // Thicker base branches
        const finalLineWidth = baseLineWidth * organicVariation * depthVariation;
        
        // Create watercolor brush effect with more variation
        for (let pass = 0; pass < 3; pass++) {
            const passVariation = 1 + (Math.random() - 0.5) * 0.2; // Vary each pass
            ctx.globalAlpha = (0.4 - pass * 0.1) * passVariation;
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${ctx.globalAlpha})`;
            ctx.lineWidth = finalLineWidth + pass * (0.6 + Math.random() * 0.4);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            const offsetVariation = segment.depth === 0 ? 1.5 : 2.5; // Main stem steadier
            const offsetX = (Math.random() - 0.5) * offsetVariation;
            const offsetY = (Math.random() - 0.5) * offsetVariation;
            
            ctx.beginPath();
            ctx.moveTo(segment.startX + offsetX, segment.startY + offsetY);
            
            const curveIntensity = segment.depth === 0 ? 3 : 6; // Branches more curved
            const midX = (segment.startX + segment.endX) / 2 + (Math.random() - 0.5) * curveIntensity;
            const midY = (segment.startY + segment.endY) / 2 + (Math.random() - 0.5) * curveIntensity;
            
            if (Math.random() > 0.3) {
                ctx.quadraticCurveTo(midX, midY, segment.endX + offsetX, segment.endY + offsetY);
            } else {
                ctx.lineTo(segment.endX + offsetX, segment.endY + offsetY);
            }
            
            ctx.stroke();
        }
        
        const shadowIntensity = 0.15 + segment.depth * 0.05;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${shadowIntensity})`;
        ctx.shadowBlur = 2 + Math.random() * 3; // Random blur
        ctx.globalAlpha = 0.08 + Math.random() * 0.08;
        
        const shadowColor = colors[Math.floor(Math.random() * colors.length)];
        ctx.strokeStyle = `rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, 1)`;
        ctx.lineWidth = finalLineWidth * (1.5 + Math.random() * 0.6); // Varied shadow thickness
        
        ctx.beginPath();
        ctx.moveTo(segment.startX, segment.startY);
        ctx.lineTo(segment.endX, segment.endY);
        ctx.stroke();
        
        ctx.restore();
    }

    // Draw a large decorative flower at the end of plant growth
    function drawLargeFlower(x, y, colors, size = 'medium') {
        // Slightly reduced max sizes (as requested)
        let sizeMultiplier = 1.0;
        switch(size) {
            case 'large':
                sizeMultiplier = 1.4 + Math.random() * 0.35; // 1.4 - 1.75 (was up to 2.0)
                break;
            case 'medium':
                sizeMultiplier = 1.0 + Math.random() * 0.25; // 1.0 - 1.25 (slightly lower)
                break;
            case 'small':
                sizeMultiplier = 0.65 + Math.random() * 0.18; // 0.65 - 0.83
                break;
        }
        
        const baseRadius = 12 * sizeMultiplier; // down from 14 for overall smaller flowers
        const petalCount = 5 + Math.floor(Math.random() * 5); // 5-9 petals
        
        // Add height variation by offsetting the flower position
        const heightVariation = (Math.random() - 0.5) * 8; // ±4px vertical offset
        const flowerY = y + heightVariation;
        
        ctx.save();
        
        // Draw petals with more variation
        const angleStep = (Math.PI * 2) / petalCount;
        const petalVariations = []; // Store variations for consistency
        
        for (let i = 0; i < petalCount; i++) {
            petalVariations[i] = {
                length: 0.7 + Math.random() * 0.7,  // 0.7 - 1.4
                width: 0.25 + Math.random() * 0.35, // 0.25 - 0.6
                angleOffset: (Math.random() - 0.5) * 0.4
            };
        }
        
        for (let i = 0; i < petalCount; i++) {
            const angle = i * angleStep + petalVariations[i].angleOffset;
            const petalLength = baseRadius * petalVariations[i].length;
            const petalWidth = baseRadius * petalVariations[i].width;
            
            ctx.save();
            ctx.translate(x, flowerY);
            ctx.rotate(angle);
            
            for (let layer = 0; layer < 3; layer++) {
                const base = colors[Math.floor(Math.random() * colors.length)];
                const color = Math.random() < 0.5 ? jitterColor(base, 14) : base; // subtle per-layer variation
                ctx.globalAlpha = 0.45 - layer * 0.1;
                ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${ctx.globalAlpha})`;
                
                const layerOffset = layer * 2;
                ctx.beginPath();
                ctx.ellipse(
                    petalLength * 0.65, 
                    (Math.random() - 0.5) * 3, // Small vertical offset for organic look
                    (petalLength * 0.9) + layerOffset, 
                    petalWidth + layerOffset, 
                    (Math.random() - 0.5) * 0.2, // Slight rotation per layer
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Draw flower center with size variation
        const centerSize = baseRadius * (0.22 + Math.random() * 0.14);
        const centerColors = [
            { r: 255, g: 223, b: 100 }, // Warm yellow
            { r: 255, g: 200, b: 80 },  // Golden yellow
            { r: 255, g: 180, b: 120 }  // Peachy yellow
        ];
        
        const centerColor = centerColors[Math.floor(Math.random() * centerColors.length)];
        
        for (let layer = 0; layer < 3; layer++) {
            ctx.globalAlpha = 0.8 - layer * 0.2;
            ctx.fillStyle = `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, ${ctx.globalAlpha})`;
            ctx.beginPath();
            ctx.arc(x, flowerY, centerSize + layer * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add tiny highlight details for some flowers
        if (size === 'large' && Math.random() > 0.5) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(x - centerSize * 0.3, flowerY - centerSize * 0.3, centerSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    // --- 4. SCROLL & CLICK INTERACTION LOGIC ---
    
    // Store the state of which plants have grown
    const grownPlants = {};
    let clickedPlants = [];

    // Plant configurations for each section
    const sectionPlants = {
        'publications': { type: 'flower', x: 0.15 },
        'experience': { type: 'tree', x: 0.85 },
        'education': { type: 'fern', x: 0.20 },
        'research-interest': { type: 'vine', x: 0.80 },
        'skills': { type: 'flower', x: 0.25 }
    };

    // Intersection observer for scroll-triggered plant growth
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            if (entry.isIntersecting && !grownPlants[id] && sectionPlants[id]) {
                grownPlants[id] = true;
                
                const plantConfig = sectionPlants[id];
                const plantType = plantTypes[plantConfig.type];
                const rect = entry.target.getBoundingClientRect();
                const y = rect.top + rect.height * 0.7; // Grow near bottom of section
                const x = width * plantConfig.x;

                // Generate and draw the L-System plant
                const lSystemString = generateLSystem(plantType.axiom, plantType.rules, plantType.iterations);
                drawLSystem(lSystemString, x, y, plantType, true);
            }
        });
    }, { threshold: 0.5 });

    // Observe all sections with an ID
    document.querySelectorAll('section[id]').forEach(section => {
        observer.observe(section);
    });

    // Click-to-plant functionality
    gardenCanvas.addEventListener('click', (e) => {
        const rect = gardenCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Get a random plant type
        const plantTypeNames = Object.keys(plantTypes);
        const randomPlantType = plantTypes[plantTypeNames[Math.floor(Math.random() * plantTypeNames.length)]];
        
        // Generate and draw the plant
        const lSystemString = generateLSystem(randomPlantType.axiom, randomPlantType.rules, randomPlantType.iterations);
        drawLSystem(lSystemString, x, y, randomPlantType, true);
        
        // Store the clicked plant for potential clearing
        clickedPlants.push({ x, y, type: randomPlantType, time: Date.now() });
        
        // Allow more plants on screen before pruning
        if (clickedPlants.length > 40) { // was 20
            // Clear canvas and redraw only recent plants
            ctx.clearRect(0, 0, width, height);
            
            // Keep the 30 most recent plants (was 15)
            clickedPlants = clickedPlants.slice(-30);
            
            // Redraw all plants
            clickedPlants.forEach(plant => {
                const lSystemString = generateLSystem(plant.type.axiom, plant.type.rules, plant.type.iterations);
                drawLSystem(lSystemString, plant.x, plant.y, plant.type, false);
            });
            
            // Redraw section plants
            Object.keys(grownPlants).forEach(sectionId => {
                if (grownPlants[sectionId] && sectionPlants[sectionId]) {
                    const plantConfig = sectionPlants[sectionId];
                    const plantType = plantTypes[plantConfig.type];
                    const section = document.getElementById(sectionId);
                    const rect = section.getBoundingClientRect();
                    const sectionY = rect.top + rect.height * 0.7;
                    const sectionX = width * plantConfig.x;
                    
                    const lSystemString = generateLSystem(plantType.axiom, plantType.rules, plantType.iterations);
                    drawLSystem(lSystemString, sectionX, sectionY, plantType, false);
                }
            });
        }
    });
    
    // Enable pointer events on the garden canvas for click interaction
    gardenCanvas.style.pointerEvents = 'auto';
    
    // Mobile-specific optimizations
    if (isMobile) {
        // Reduce complexity for mobile devices
        Object.keys(plantTypes).forEach(key => {
            plantTypes[key].iterations = Math.max(2, plantTypes[key].iterations - 1);
        });
        
        // Add touch event listeners for mobile
        gardenCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = gardenCanvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Plant with same logic as click
            const plantTypeNames = Object.keys(plantTypes);
            const randomPlantType = plantTypes[plantTypeNames[Math.floor(Math.random() * plantTypeNames.length)]];
            const lSystemString = generateLSystem(randomPlantType.axiom, randomPlantType.rules, randomPlantType.iterations);
            drawLSystem(lSystemString, x, y, randomPlantType, true);
            
            clickedPlants.push({ x, y, type: randomPlantType, time: Date.now() });
            
            // Allow more before pruning on mobile but still conservative
            if (clickedPlants.length > 25) { // was 15
                ctx.clearRect(0, 0, width, height);
                clickedPlants = clickedPlants.slice(-18); // was 10
                
                clickedPlants.forEach(plant => {
                    const lSystemString = generateLSystem(plant.type.axiom, plant.type.rules, plant.type.iterations);
                    drawLSystem(lSystemString, plant.x, plant.y, plant.type, false);
                });
                
                Object.keys(grownPlants).forEach(sectionId => {
                    if (grownPlants[sectionId] && sectionPlants[sectionId]) {
                        const plantConfig = sectionPlants[sectionId];
                        const plantType = plantTypes[plantConfig.type];
                        const section = document.getElementById(sectionId);
                        const rect = section.getBoundingClientRect();
                        const sectionY = rect.top + rect.height * 0.7;
                        const sectionX = width * plantConfig.x;
                        
                        const lSystemString = generateLSystem(plantType.axiom, plantType.rules, plantType.iterations);
                        drawLSystem(lSystemString, sectionX, sectionY, plantType, false);
                    }
                });
            }
        }, { passive: false });
    }



    // --- START-UP GARDEN: draw 5 plants on load (no style changes) ---
    const initialPlants = 7;
    for (let i = 0; i < initialPlants; i++) {
        const plantTypeNames = Object.keys(plantTypes);
        const randomPlantType = plantTypes[plantTypeNames[Math.floor(Math.random() * plantTypeNames.length)]];
        const x = Math.random() * width;
        const y = height * (0.70 + Math.random() * 0.25); // near bottom area
        const lSystemString = generateLSystem(randomPlantType.axiom, randomPlantType.rules, randomPlantType.iterations);
        drawLSystem(lSystemString, x, y, randomPlantType, false);
        clickedPlants.push({ x, y, type: randomPlantType, time: Date.now() });
    }

    } // End of initializeGarden function
});
