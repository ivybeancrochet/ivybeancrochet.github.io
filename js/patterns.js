const assetGallery = (() => {
  const isDesktop = window.matchMedia('(pointer: fine) and (hover: hover)').matches;

  const root = document.documentElement;
  const container = document.getElementById('assets-container');
  const loadingOverlay = document.getElementById('loading-overlay');
  const backgroundDiv = document.createElement('div');
  const patternImg = document.createElement('img');
  const arrowLeft = document.createElement('div');
  const arrowRight = document.createElement('div');
  const imageCounter = document.createElement('h1');

  backgroundDiv.className = 'background hidden';
  patternImg.className = 'pattern-instructions hidden';
  arrowLeft.className = 'arrow arrow-left hidden';
  arrowRight.className = 'arrow arrow-right hidden';
  imageCounter.className = 'page-counter hidden';

  arrowLeft.innerHTML = '<i class="fa-solid fa-caret-left"></i>';
  arrowRight.innerHTML = '<i class="fa-solid fa-caret-right"></i>';

  const popupElements = [backgroundDiv, patternImg, arrowLeft, arrowRight, imageCounter];

  const appendPopupElements = () => {
    popupElements.forEach(el => root.appendChild(el));
  };

  const showPopup = () => popupElements.forEach(el => el.classList.remove('hidden'));
  const hidePopup = () => popupElements.forEach(el => el.classList.add('hidden'));

  const preventImageInteraction = (event) => {
    const target = event.target;
    if (target.tagName === 'IMG') {
      event.preventDefault();
    }
  };

  const registerImageProtectors = () => {
    document.addEventListener('contextmenu', preventImageInteraction);
    document.addEventListener('dragstart', preventImageInteraction);
  };

  const registerZoomBlockers = () => {
    if (!isDesktop) return;

    const preventZoom = (event) => {
      if (event.ctrlKey && ['+', '-', '=', '0'].includes(event.key)) {
        event.preventDefault();
      }
    };

    document.addEventListener('wheel', (event) => {
      if (event.ctrlKey) event.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', preventZoom);
  };

  const getBaseName = (filename) => {
    const name = filename
      .substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'))
      .replace(/\d+$/, '')
      .trim();
    return name;
  };

  let currentGroup = [];
  let currentIndex = 0;

  const openPopup = (index = 0) => {
    if (!currentGroup.length) return;
    currentIndex = index;
    patternImg.src = `https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/${currentGroup[currentIndex]}`;
    imageCounter.textContent = `${currentIndex + 1} / ${currentGroup.length}`;
    showPopup();
  };

  const registerPopupControls = () => {
    backgroundDiv.addEventListener('click', hidePopup);
    arrowLeft.addEventListener('click', () => {
      if (!currentGroup.length) return;
      currentIndex = (currentIndex - 1 + currentGroup.length) % currentGroup.length;
      openPopup(currentIndex);
    });
    arrowRight.addEventListener('click', () => {
      if (!currentGroup.length) return;
      currentIndex = (currentIndex + 1) % currentGroup.length;
      openPopup(currentIndex);
    });
  };

  const renderAssets = (assets) => {
    container.innerHTML = '';
    assets.photos
      .filter(f => f.toLowerCase().endsWith('.webp'))
      .forEach((photoFile) => {
        const baseName = getBaseName(photoFile);
      const item = document.createElement('div');
      item.className = 'asset-item';

      const header = document.createElement('h1');
      header.className = 'pattern-headers';
      header.textContent = baseName;
      header.title = 'Click to view pattern';

      const photo = document.createElement('img');
      photo.className = 'pattern-photos';
      photo.title = 'Click to view pattern';
      photo.style.filter = 'blur(20px)';
      photo.style.transition = 'filter 0.5s ease, opacity 0.5s ease';
      photo.style.opacity = '0';

      const lowResUrl = `https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/${photoFile}?w=20`;
      photo.src = lowResUrl;
      photo.onload = () => {
        const fullRes = new Image();
        fullRes.src = `https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/${photoFile}`;
        fullRes.onload = () => {
          photo.src = fullRes.src;
          photo.style.filter = 'blur(0)';
          photo.style.opacity = '1';
        };
      };

      const openGroupPopup = () => {
        currentGroup = assets.patterns
          .filter(p => getBaseName(p) === baseName)
          .filter(p => p.toLowerCase().endsWith('.webp'));
        openPopup();
      };

      header.addEventListener('click', openGroupPopup);
      photo.addEventListener('click', openGroupPopup);

      item.appendChild(header);
      item.appendChild(photo);
      container.appendChild(item);
    });

    const placeholders = [
      'assets/images/place_holder2.jpeg',
    ];

    placeholders.forEach((src, index) => {
      const placeholder = document.createElement('div');
      placeholder.className = 'asset-item';
      placeholder.innerHTML = `
        <h1 class="pattern-headers">Coming Soon ${index + 1}</h1>
        <img class="pattern-photos" src="${src}" />
      `;
      const blur = document.createElement('div');
      blur.className = 'hide-blur';
      blur.style.position = 'absolute';
      blur.style.top = '0';
      blur.style.left = '0';
      blur.style.width = '100%';
      blur.style.height = '100%';
      blur.style.borderRadius = '50px';
      placeholder.appendChild(blur);
      const comingSoon = document.createElement('h1');
      comingSoon.className = 'coming-soon';
      comingSoon.textContent = 'Coming Soon';
      placeholder.appendChild(comingSoon);
      container.appendChild(placeholder);
    });
  };

  const watermarkImages = () => {
    document.querySelectorAll('img').forEach(img => {
      const wrapper = document.createElement('div');
      wrapper.className = 'watermarked-img';
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    });
  };

  const initialize = () => {
    appendPopupElements();
    registerPopupControls();
    registerImageProtectors();
    registerZoomBlockers();
    watermarkImages();
    loadingOverlay.style.display = 'none';
  };

  return { initialize, renderAssets };
})();

window.addEventListener('DOMContentLoaded', () => {
  fetch('https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/assets.json')
    .then(response => response.json())
    .then(assetGallery.renderAssets)
    .catch(error => console.error('Error loading assets.json:', error))
    .finally(assetGallery.initialize);
});