// --- SISTEMA DE PARTÍCULAS ---
        const pCanvas = document.getElementById('particle-canvas');
        const pCtx = pCanvas.getContext('2d');
        let particles = [];

        function resizeParticles() {
            pCanvas.width = window.innerWidth;
            pCanvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * pCanvas.width;
                this.y = Math.random() * pCanvas.height;
                this.size = Math.random() * 2.5 + 1.2; 
                this.speedX = (Math.random() - 0.5) * 0.7; 
                this.speedY = (Math.random() - 0.5) * 0.7;
                this.alpha = Math.random() * 0.5 + 0.2; 
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > pCanvas.width || this.y < 0 || this.y > pCanvas.height) {
                    this.reset();
                }
            }
            draw() {
                pCtx.fillStyle = `rgba(148, 163, 184, ${this.alpha})`;
                pCtx.shadowBlur = 4; 
                pCtx.shadowColor = "rgba(148, 163, 184, 0.5)";
                pCtx.beginPath();
                pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                pCtx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const count = Math.min(180, Math.floor((window.innerWidth * window.innerHeight) / 10000));
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }

        function animateParticles() {
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateParticles);
        }

        window.addEventListener('resize', () => {
            resizeParticles();
            initParticles();
        });

        resizeParticles();
        initParticles();
        animateParticles();


        // --- LÓGICA DEL VISOR ---
        const container = document.getElementById('viewer-container');
        const img = document.getElementById('diagram-img');
        const loader = document.getElementById('loader');

        let state = {
            scale: 1,
            x: 0,
            y: 0,
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0
        };

        function onImageLoad() {
            loader.style.display = 'none';
            img.classList.add('loaded');
            resetView();
        }

        function onImageError() {
            loader.innerHTML = `<p class="text-red-400">Error: Imagen no encontrada</p>`;
        }

        img.addEventListener('load', onImageLoad);
        img.addEventListener('error', onImageError);

        if (img.complete) {
            if (img.naturalWidth > 0) onImageLoad();
            else onImageError();
        }

        function applyTransform() {
            img.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
        }

        function resetView() {
            const containerW = container.clientWidth;
            const containerH = container.clientHeight;
            if(!img.naturalWidth) return;

            const scaleX = (containerW * 0.85) / img.naturalWidth;
            const scaleY = (containerH * 0.85) / img.naturalHeight;
            state.scale = Math.min(scaleX, scaleY, 1);

            state.x = (containerW - img.naturalWidth * state.scale) / 2;
            state.y = (containerH - img.naturalHeight * state.scale) / 2;
            applyTransform();
        }

        function handleZoom(delta, mouseX, mouseY) {
            const factor = Math.exp(delta * 0.0015);
            const newScale = Math.min(Math.max(state.scale * factor, 0.05), 10);
            
            const rect = container.getBoundingClientRect();
            const mX = mouseX - rect.left;
            const mY = mouseY - rect.top;

            const mouseRelativeX = (mX - state.x) / state.scale;
            const mouseRelativeY = (mY - state.y) / state.scale;

            state.x = mX - mouseRelativeX * newScale;
            state.y = mY - mouseRelativeY * newScale;
            state.scale = newScale;
            applyTransform();
        }

        container.addEventListener('wheel', (e) => {
            if (e.target === img) {
                e.preventDefault();
                handleZoom(-e.deltaY, e.clientX, e.clientY);
            }
        }, { passive: false });

        img.addEventListener('dragstart', (e) => e.preventDefault());

        container.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Solo click izquierdo
            state.isDragging = true;
            state.lastMouseX = e.clientX;
            state.lastMouseY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!state.isDragging) return;
            state.x += (e.clientX - state.lastMouseX);
            state.y += (e.clientY - state.lastMouseY);
            state.lastMouseX = e.clientX;
            state.lastMouseY = e.clientY;
            applyTransform();
        });

        window.addEventListener('mouseup', () => state.isDragging = false);

        // Soporte para táctil (Móviles)
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                state.isDragging = true;
                state.lastMouseX = e.touches[0].clientX;
                state.lastMouseY = e.touches[0].clientY;
            }
        }, { passive: false });

        container.addEventListener('touchmove', (e) => {
            if (!state.isDragging) return;
            if (e.touches.length === 1) {
                e.preventDefault(); // Evita que la página haga scroll al arrastrar
                state.x += (e.touches[0].clientX - state.lastMouseX);
                state.y += (e.touches[0].clientY - state.lastMouseY);
                state.lastMouseX = e.touches[0].clientX;
                state.lastMouseY = e.touches[0].clientY;
                applyTransform();
            }
        }, { passive: false });

        window.addEventListener('touchend', () => state.isDragging = false);

        function getCenter() {
            const rect = container.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }

        document.getElementById('zoom-in').onclick = () => {
            const center = getCenter();
            handleZoom(300, center.x, center.y);
        };
        document.getElementById('zoom-out').onclick = () => {
            const center = getCenter();
            handleZoom(-300, center.x, center.y);
        };
        document.getElementById('reset-btn').onclick = resetView;

        window.addEventListener('resize', resetView);