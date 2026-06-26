const assetGallery = (() => {
  const CLOUDINARY_BASE = 'https://res.cloudinary.com/tukkejod/image/upload';
  let COLLECTIONS = [];

  const isDesktop = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  const THUMBNAIL_WIDTH = 320;
  const IMAGE_PROBE_TIMEOUT_MS = 900;
  const IMAGE_PROBE_BATCH_SIZE = 4;
  const MAX_IMAGE_CHECKS = 24;
  const MAX_MISSING_IN_A_ROW = 4;

  const root = document.documentElement;
  const container = document.getElementById('assets-container');
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

  const getBaseName = (collectionName) => {
    // Convert snake_case to Title Case (e.g., Mini_Miffy -> Mini Miffy, brown_bears -> Brown Bears)
    return collectionName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  let currentGroup = [];
  let currentIndex = 0;

  const openPopup = (index = 0) => {
    if (!currentGroup.length) return;
    currentIndex = index;
    patternImg.src = currentGroup[currentIndex];
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

  const buildCollectionImageUrl = (collection, number = 0) => {
    const suffix = number === 0 ? '' : `-${number}`;
    return `${CLOUDINARY_BASE}/${collection.version}/pat/${collection.name}${suffix}.jpg`;
  };

  const buildThumbnailUrl = (url) => url.replace('/upload/', `/upload/w_${THUMBNAIL_WIDTH},q_auto,f_auto/`);

  const imageExists = async (url) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), IMAGE_PROBE_TIMEOUT_MS);
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal, cache: 'force-cache' });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  };

  const discoverCollectionImages = async (collection) => {
    const images = [];
    let consecutiveNotFound = 0;
    let number = 0;

    while (consecutiveNotFound < MAX_MISSING_IN_A_ROW && number <= MAX_IMAGE_CHECKS) {
      const batchNumbers = [];
      const batchUrls = [];

      for (let i = 0; i < IMAGE_PROBE_BATCH_SIZE && number <= MAX_IMAGE_CHECKS; i++) {
        batchNumbers.push(number);
        batchUrls.push(buildCollectionImageUrl(collection, number));
        number++;
      }

      const batchResults = await Promise.all(batchUrls.map((url) => imageExists(url).then((exists) => ({ exists, url }))));

      batchResults.forEach(({ exists, url }, index) => {
        const currentNumber = batchNumbers[index];

        if (exists) {
          images.push({ url, number: currentNumber });
          consecutiveNotFound = 0;
        } else {
          consecutiveNotFound++;
        }
      });
    }

    return images
      .sort((a, b) => a.number - b.number)
      .map((img) => img.url);
  };

  const discoverAllAssets = async () => {
    const discoveryPromises = COLLECTIONS.map((collection) =>
      discoverCollectionImages(collection).then((images) => ({
        name: collection.name,
        version: collection.version,
        images
      }))
    );

    return (await Promise.all(discoveryPromises)).filter(({ images }) => images.length > 0);
  };

  const renderAssets = (collections) => {
    container.innerHTML = '';

    collections.forEach(({ name, version, images }) => {
      const displayName = getBaseName(name);
      const item = document.createElement('div');
      item.className = 'asset-item';

      const header = document.createElement('h1');
      header.className = 'pattern-headers';
      header.textContent = displayName;
      header.title = 'Click to view pattern';

      const photo = document.createElement('img');
      photo.className = 'pattern-photos';
      photo.title = 'Click to view pattern';
      photo.alt = `${displayName} pattern preview`;
      photo.loading = 'lazy';
      photo.decoding = 'async';
      photo.width = THUMBNAIL_WIDTH;
      photo.height = THUMBNAIL_WIDTH;
      photo.style.transition = 'opacity 0.5s ease';
      photo.style.opacity = '0';

      const previewImage = images[0] || buildCollectionImageUrl({ name, version }, 0);
      const thumbnailUrl = buildThumbnailUrl(previewImage);
      photo.src = thumbnailUrl;
      photo.onload = () => {
        photo.style.opacity = '1';
      };
      photo.onerror = () => {
        photo.style.opacity = '0';
      };

      const openGroupPopup = () => {
        currentGroup = images;
        openPopup();
      };

      header.addEventListener('click', openGroupPopup);
      photo.addEventListener('click', openGroupPopup);

      item.appendChild(header);
      item.appendChild(photo);
      container.appendChild(item);
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

  const initialize = async () => {
    appendPopupElements();
    registerPopupControls();
    registerImageProtectors();
    registerZoomBlockers();

    try {
      const response = await fetch('/collections.json');
      COLLECTIONS = await response.json();

      const initialCollections = COLLECTIONS.map(({ name, version }) => ({ name, version, images: [] }));
      renderAssets(initialCollections);

      const collections = await discoverAllAssets();
      renderAssets(collections);
      watermarkImages();
      document.querySelector('footer')?.classList.add('loaded');
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  return { initialize };
})();

window.addEventListener('DOMContentLoaded', assetGallery.initialize);