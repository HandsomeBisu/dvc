document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');

    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Ticker animation
    const tickerTrack = document.querySelector('.ticker-track');
    if (tickerTrack) {
        const originalItems = Array.from(tickerTrack.children);
        // Duplicate items ONCE to create a seamless loop (A-A structure)
        originalItems.forEach(item => {
            const clone = item.cloneNode(true);
            tickerTrack.appendChild(clone);
        });

        // Dynamic animation based on precise width
        // This avoids CSS percentage rounding errors that can cause jerks
        const scrollWidth = tickerTrack.scrollWidth / 2; // Width of one set of items
        const animationName = 'ticker-scroll-dynamic';
        const animationDuration = 15; // User's preferred duration

        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = `
            @keyframes ${animationName} {
                0% { transform: translateX(0); }
                100% { transform: translateX(-${scrollWidth}px); }
            }
        `;
        document.head.appendChild(styleSheet);

        tickerTrack.style.animation = `${animationName} ${animationDuration}s linear infinite`;
        // Add hardware acceleration hint
        tickerTrack.style.willChange = 'transform';
    }
});