// help.js - Help section functionality
export function setupHelpSection() {
    const helpToggle = document.querySelector('.helpToggle');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalHelpContent = document.querySelector('.modal-overlay .helpContent');
    const closeButton = document.querySelector('.close-help');
    
    if (!helpToggle || !modalOverlay || !modalHelpContent || !closeButton) {
        console.error('Help elements not found');
        return;
    }

    helpToggle.addEventListener('click', () => {
        modalOverlay.classList.add('show');
        modalHelpContent.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling while modal is open
    });

    // Close on clicking the close button
    closeButton.addEventListener('click', closeHelp);

    // Close on clicking outside the modal
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeHelp();
        }
    });

    // Close on pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('show')) {
            closeHelp();
        }
    });

    function closeHelp() {
        modalOverlay.classList.remove('show');
        modalHelpContent.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }
} 