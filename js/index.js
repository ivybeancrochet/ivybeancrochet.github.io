window.addEventListener('DOMContentLoaded', () => {
  const isDesktop = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  if (isDesktop) {
    document.addEventListener('wheel', function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && ['+', '-', '=', '0'].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    const bearEyes = document.getElementById('bear-eyes');
    const bearNose = document.getElementById('bear-nose');
    const bear = document.querySelector('#title-bear');

    if (!bear || !bearEyes || !bearNose) return;

    let animationFrame;

    const onMouseMove = (e) => {
      if (animationFrame) cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        const rect = bear.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const offsetX = (e.clientX - centerX) / 50;
        const offsetY = (e.clientY - centerY) / 50;

        bearEyes.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        bearNose.style.transform = `translate(${offsetX}px, ${offsetY / 1.5}px)`;
      });
    };

    document.addEventListener('mousemove', onMouseMove);

    window.addEventListener('mouseleave', () => {
      bearEyes.style.transform = 'translate(0, 0)';
      bearNose.style.transform = 'translate(0, 0)';
    });
  }
});
