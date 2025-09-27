window.addEventListener('DOMContentLoaded', () => {
  const isDesktop = window.matchMedia('(pointer: fine) and (hover: hover)').matches;

  if (isDesktop) {
    document.addEventListener('wheel', e => {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', e => {
      if (e.ctrlKey && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
    });
  }

  document.addEventListener('contextmenu', e => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault(); 
    }
  });

  document.addEventListener('dragstart', e => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  fetch('https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/assets.json')
    .then(response => response.json())
    .then(assets => {
      const container = document.getElementById('assets-container');
      const loadingOverlay = document.getElementById('loading-overlay');
      container.innerHTML = '';

      const backgroundDiv = document.createElement('div');
      backgroundDiv.className = 'background hidden';

      const patternImg = document.createElement('img');
      patternImg.className = 'pattern-instructions hidden';

      const arrowLeft = document.createElement('div');
      arrowLeft.className = 'arrow arrow-left';
      arrowLeft.innerHTML = '<i class="fa-solid fa-caret-left"></i>';
      arrowLeft.classList.add('hidden');

      const arrowRight = document.createElement('div');
      arrowRight.className = 'arrow arrow-right';
      arrowRight.innerHTML = '<i class="fa-solid fa-caret-right"></i>';
      arrowRight.classList.add('hidden');

      document.body.appendChild(backgroundDiv);
      document.body.appendChild(patternImg);
      document.body.appendChild(arrowLeft);
      document.body.appendChild(arrowRight);

      const getBaseName = (filename) => {
        let name = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'));
        return name.replace(/\d+$/, '').trim();
      };

      let currentIndex = 0;
      let currentGroup = [];

      const openPopup = (index) => {
        currentIndex = index;
        const patternFile = currentGroup[currentIndex];
        patternImg.src = `https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/${patternFile}`;
        patternImg.classList.remove('hidden');
        backgroundDiv.classList.remove('hidden');
        arrowLeft.classList.remove('hidden');
        arrowRight.classList.remove('hidden');
        imageCounter.classList.remove('hidden');
        updateCounter();
      };

      const imageCounter = document.createElement('h1');
      imageCounter.className = 'page-counter hidden';
      document.body.appendChild(imageCounter);

      const updateCounter = () => {
        if (currentGroup.length > 0) {
          imageCounter.textContent = `${currentIndex + 1} / ${currentGroup.length}`;
        } else {
          imageCounter.textContent = '';
        }
      };

      backgroundDiv.addEventListener('click', () => {
        patternImg.classList.add('hidden');
        backgroundDiv.classList.add('hidden');
        arrowLeft.classList.add('hidden');
        arrowRight.classList.add('hidden');
        imageCounter.classList.add('hidden');
      });

      assets.photos.forEach((photoFile) => {
        const baseName = getBaseName(photoFile);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'asset-item';

        const header = document.createElement('h1');
        header.className = 'pattern-headers';
        header.textContent = baseName;
        header.style.cursor = 'pointer';
        header.setAttribute('title', 'Click to view pattern');

        const openGroupPopup = () => {
          currentGroup = assets.patterns.filter(p => getBaseName(p) === baseName);
          currentIndex = 0;
          openPopup(currentIndex);
        };

        header.addEventListener('click', openGroupPopup);
        itemDiv.appendChild(header);

        const photoImg = document.createElement('img');
        photoImg.src = `https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/${photoFile}`;
        photoImg.className = 'pattern-photos';
        photoImg.style.cursor = 'pointer';
        photoImg.setAttribute('title', 'Click to view pattern');

        photoImg.addEventListener('click', openGroupPopup);
        itemDiv.appendChild(photoImg);

        container.appendChild(itemDiv);
      });



      arrowLeft.addEventListener('click', () => {
        if (currentGroup.length === 0) return;
        currentIndex = (currentIndex - 1 + currentGroup.length) % currentGroup.length;
        patternImg.src = `https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/${currentGroup[currentIndex]}`;
        updateCounter();
      });

      arrowRight.addEventListener('click', () => {
        if (currentGroup.length === 0) return;
        currentIndex = (currentIndex + 1) % currentGroup.length;
        patternImg.src = `https://raw.githubusercontent.com/ivybeancrochet/asset-library/main/${currentGroup[currentIndex]}`;
        updateCounter();
      });

      const placeholders = [
        "assets/images/place_holder2.jpeg",
      ];

      placeholders.forEach((src, i) => {
        const placeholder = document.createElement('div');
        placeholder.className = 'asset-item';
        placeholder.style.position = 'relative';

        placeholder.innerHTML = `
          <h1 class="pattern-headers">Coming Soon ${i + 1}</h1>
          <img class="pattern-photos" src="${src}" />
        `;

        const blurDiv = document.createElement('div');
        blurDiv.className = 'hide-blur';
        blurDiv.style.position = "absolute";
        blurDiv.style.top = "0";
        blurDiv.style.left = "0";
        blurDiv.style.width = "100%";
        blurDiv.style.height = "100%";
        blurDiv.style.borderRadius = "50px";
        placeholder.appendChild(blurDiv);

        const comingSoonHeader = document.createElement('h1');
        comingSoonHeader.className = "coming-soon";
        comingSoonHeader.textContent = "Coming Soon";
        placeholder.appendChild(comingSoonHeader);

        container.appendChild(placeholder);
      });

      document.body.classList.add("watermarked");

      document.querySelectorAll("img").forEach(img => {
        const wrapper = document.createElement("div");
        wrapper.className = "watermarked-img";
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
      });

      loadingOverlay.style.display = 'none';
    })
    .catch(error => console.error('Error loading assets.json:', error));

});

