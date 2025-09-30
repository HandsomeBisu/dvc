
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const deadline = new Date('2025-09-30T22:00:00');

    if (now > deadline) {
        window.location.href = 'apply-closed.html';
    }
});
