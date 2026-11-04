(async () => {
await window.deckEditorReady;
const slides = [...document.querySelectorAll("#deck > .slide")];
const jump = document.querySelector("#jump");
let index = 0;
let reveal = 0;

const routeStates = new Map(
  slides
    .filter((slide) => slide.classList.contains("interactive-route"))
    .map((slide) => [
      slide,
      {
        slide,
        stops: [...slide.querySelectorAll(".route-stop")],
        sequence: slide.querySelector(".route-sequence"),
        bike: slide.querySelector(".route-bike"),
        view: slide.querySelector(".route-view"),
        photoFrame: slide.querySelector(".route-photo-frame"),
        caption: slide.querySelector(".route-caption"),
        overviewButton: slide.querySelector(".route-overview"),
        subtitle: slide.querySelector(".sub"),
        title: slide.querySelector(".route-location-title"),
        activeIndex: -1,
        busy: false,
        image: null,
        home: null,
      },
    ]),
);

slides.forEach((slide, slideIndex) => {
  const option = document.createElement("option");
  option.value = slideIndex;
option.textContent = `${slideIndex + 1}  ${readableSlideTitle(slide)}`;
  jump.append(option);
  const counter = slide.querySelector("footer b");
  if (counter) counter.textContent = `${String(slideIndex + 1).padStart(2, "0")}/${slides.length}`;
});

function total(slideIndex = index) {
  const slide = slides[slideIndex];
  return routeStates.get(slide)?.stops.length ?? slide.querySelectorAll(".detail").length;
}

function readableSlideTitle(slide) {
  const heading = slide.querySelector("h1").cloneNode(true);
  heading.querySelectorAll("br").forEach((lineBreak) => lineBreak.replaceWith(" "));
  return heading.textContent.replace(/\s+/g, " ").trim();
}

function animationDuration() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
}

function waitForAnimation() {
  return new Promise((resolve) => setTimeout(resolve, animationDuration() + 35));
}

function setPhotoBounds(image, slide, bounds) {
  const slideBounds = slide.getBoundingClientRect();
  Object.assign(image.style, {
    top: `${bounds.top - slideBounds.top}px`,
    left: `${bounds.left - slideBounds.left}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
  });
}

async function expandPhoto(state, stopIndex) {
  const button = state.stops[stopIndex];
  const home = button.querySelector(".route-thumb");
  const image = home.querySelector("img");
  const start = image.getBoundingClientRect();
  state.slide.classList.add("photo-open");
  const destination = state.photoFrame.getBoundingClientRect();
  const duration = animationDuration();

  state.image = image;
  state.originalImageStyle = image.getAttribute('style');
  state.home = home;
  state.slide.append(image);
  image.classList.add("route-active-photo");
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `Open full image: ${image.alt}`);
  image.style.position = "absolute";
  image.style.transition = "none";
  setPhotoBounds(image, state.slide, start);
  image.getBoundingClientRect();
  image.style.transition = `top ${duration}ms cubic-bezier(.22,.7,.25,1), left ${duration}ms cubic-bezier(.22,.7,.25,1), width ${duration}ms cubic-bezier(.22,.7,.25,1), height ${duration}ms cubic-bezier(.22,.7,.25,1)`;
  requestAnimationFrame(() => setPhotoBounds(image, state.slide, destination));
  await waitForAnimation();
  state.view.classList.add("ready");
}

async function returnPhoto(state) {
  if (!state.image || !state.home) return;
  state.view.classList.remove("ready");
  state.slide.classList.remove("photo-open");
  const destination = state.home.getBoundingClientRect();
  const duration = animationDuration();
  state.image.style.transition = `top ${duration}ms cubic-bezier(.22,.7,.25,1), left ${duration}ms cubic-bezier(.22,.7,.25,1), width ${duration}ms cubic-bezier(.22,.7,.25,1), height ${duration}ms cubic-bezier(.22,.7,.25,1)`;
  requestAnimationFrame(() => setPhotoBounds(state.image, state.slide, destination));
  await waitForAnimation();
  state.image.classList.remove("route-active-photo");
  state.image.tabIndex = -1;
  if (state.originalImageStyle === null) state.image.removeAttribute('style');
  else state.image.setAttribute('style',state.originalImageStyle);
  state.home.append(state.image);
  state.image = null;
  state.home = null;
}

function setCurrentStop(state, stopIndex) {
  state.stops.forEach((stop, index) => {
    const isCurrent = index === stopIndex;
    stop.classList.toggle("is-current", isCurrent);
    stop.setAttribute("aria-pressed", String(isCurrent));
  });
  state.activeIndex = stopIndex;
}

function resetRoute(state) {
  if (state.image && state.home) {
    state.image.classList.remove("route-active-photo");
    state.image.tabIndex = -1;
    if (state.originalImageStyle === null) state.image.removeAttribute('style');
    else state.image.setAttribute('style',state.originalImageStyle);
    state.home.append(state.image);
    state.image = null;
    state.home = null;
  }
  state.slide.classList.remove("photo-open");
  state.view.classList.remove("ready");
  state.caption.textContent = "";
  state.title.textContent = "";
  state.bike.style.left = "6%";
  setCurrentStop(state, -1);
}

function locationPosition(state, stopIndex) {
  const sequenceBounds = state.sequence.getBoundingClientRect();
  const stopBounds = state.stops[stopIndex].getBoundingClientRect();
  return ((stopBounds.left + stopBounds.width / 2 - sequenceBounds.left) / sequenceBounds.width) * 100;
}

async function returnToRouteOverview(state) {
  if (state.busy) return;
  state.busy = true;
  try {
    if (state.image) {
      state.caption.classList.remove("visible");
      await new Promise((resolve) => setTimeout(resolve, animationDuration() ? 200 : 0));
      await returnPhoto(state);
    }
  } finally {
    state.busy = false;
  }
}

async function selectRouteLocation(state, stopIndex) {
  if (state.busy || stopIndex >= state.stops.length) return;
  if (state.activeIndex === stopIndex && state.image) return;
  state.busy = true;
  try {
    const previousIndex = state.activeIndex;
    if (state.image) {
      state.caption.classList.remove("visible");
      await new Promise((resolve) => setTimeout(resolve, animationDuration() ? 200 : 0));
      await returnPhoto(state);
    }
    if (stopIndex < 0) return;

    const stop = state.stops[stopIndex];
    setCurrentStop(state, stopIndex);
    state.bike.style.left = `${locationPosition(state, stopIndex)}%`;
    if (previousIndex !== stopIndex) await waitForAnimation();

    const nextStop = state.stops[stopIndex + 1];
    state.title.textContent = stop.querySelector(".route-stop-name").textContent;
    const nextDestination = nextStop?.querySelector(".route-stop-name").textContent
      ?? (slides[index + 1] ? readableSlideTitle(slides[index + 1]) : null)
      ?? "End of presentation";
    const memberCount = stop.dataset.members || "not specified in source";
    state.caption.textContent = `Next: ${nextDestination}  •  Members at this spot: ${memberCount}`;
    await expandPhoto(state, stopIndex);
    state.caption.classList.add("visible");
  } finally {
    state.busy = false;
  }
}

function show(slideIndex, requestedReveal = 0) {
  const currentRoute = routeStates.get(slides[index]);
  if (currentRoute?.busy) return false;

  const nextIndex = Math.max(0, Math.min(slides.length - 1, slideIndex));
  if (currentRoute && nextIndex !== index) resetRoute(currentRoute);
  index = nextIndex;
  const route = routeStates.get(slides[index]);
  reveal = Math.max(0, Math.min(total(), requestedReveal));

  slides.forEach((slide, slidePosition) => {
    slide.classList.toggle("active", slidePosition === index);
    if (slidePosition !== index) return;
    slide.querySelectorAll(".detail").forEach((detail, detailIndex) => {
      detail.classList.toggle("shown", detailIndex < reveal);
    });
  });

  if (route) {
    resetRoute(route);
    route.slide.classList.add("route-ready");
    if (reveal > 0) void selectRouteLocation(route, Math.min(reveal, route.stops.length) - 1);
  }

  window.rideMap?.activate(slides[index].dataset.kind === "map");
  jump.value = index;
  document.querySelector("#all").hidden = Boolean(route);
  document.querySelector("#notes").textContent = slides[index].dataset.note || "";
  location.hash = index + 1;
  return true;
}

function next() {
  if (document.querySelector('#deck-editor')?.open) return;
  const route = routeStates.get(slides[index]);
  if (route) {
    if (route.busy) return;
    const target = route.activeIndex + 1;
    if (target < route.stops.length) {
      void selectRouteLocation(route, target);
    } else {
      void returnToRouteOverview(route).then(() => show(index + 1));
    }
    return;
  }
  reveal < total() ? show(index, reveal + 1) : show(index + 1);
}

window.presentationIsBusy = () => Boolean(routeStates.get(slides[index])?.busy);

function prev() {
  if (document.querySelector('#deck-editor')?.open) return;
  const route = routeStates.get(slides[index]);
  if (route) {
    if (route.busy) return;
    if (route.activeIndex > 0) {
      void selectRouteLocation(route, route.activeIndex - 1);
    } else if (route.activeIndex === 0) {
      void returnToRouteOverview(route).then(() => show(index - 1, total(index - 1)));
    } else {
      show(index - 1, total(index - 1));
    }
    return;
  }
  reveal ? show(index, reveal - 1) : show(index - 1, total(Math.max(0, index - 1)));
}

function full() {
  document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
}

document.querySelector("#next").onclick = next;
document.querySelector("#prev").onclick = prev;
document.querySelector("#full").onclick = full;
document.querySelector("#all").onclick = () => show(index, total());
// The toolbar stays out of the slides: it appears when the pointer moves (or a control is focused with the
// keyboard) and fades away a few seconds later. Speaker notes are toggled with the N key.
const controls = document.querySelector("#controls");
let controlsTimer;
const controlsHeld = () => { try { return controls.matches(":hover, :has(:focus-visible)"); } catch { return controls.matches(":hover, :focus-within"); } };
const showControls = () => {
  controls.classList.remove("idle");
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(function hide() {
    if (controlsHeld()) controlsTimer = setTimeout(hide, 1200);
    else controls.classList.add("idle");
  }, 2800);
};
["pointermove", "pointerdown", "touchstart"].forEach((type) => document.addEventListener(type, showControls, { passive: true }));
controls.addEventListener("focusin", showControls);
showControls();
jump.onchange = () => {
  if (!show(+jump.value)) jump.value = index;
};

document.querySelectorAll(".interactive-route").forEach((slide) => {
  const state = routeStates.get(slide);
  state.slide.classList.add("route-ready");
  state.stops.forEach((stop, stopIndex) => {
    stop.addEventListener("click", (event) => {
      event.stopPropagation();
      void selectRouteLocation(state, stopIndex);
    });
  });
  state.overviewButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void returnToRouteOverview(state);
  });
  state.view.addEventListener("click", (event) => event.stopPropagation());
});

document.querySelector("#deck").addEventListener("click", (event) => {
  if (!event.target.closest("button, select")) next();
});
document.addEventListener("keydown", (event) => {
  if (document.querySelector('#deck-editor')?.open) return;
  if (document.querySelector("#image-viewer").open) return;
  if (event.target.closest("#controls")) return;
  if (event.target.closest("select")) return;
  if (event.target.closest("button") && [" ", "Enter"].includes(event.key)) return;
  if ([" ", "ArrowRight", "Enter", "PageDown"].includes(event.key)) {
    event.preventDefault();
    next();
  }
  if (["ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    prev();
  }
  if (event.key.toLowerCase() === "f") full();
  if (event.key.toLowerCase() === "n") document.querySelector("#notes").classList.toggle("on");
  if (event.key === "Home") show(0);
  if (event.key === "End") show(slides.length - 1);
});

show(Math.max(0, (+location.hash.slice(1) || 1) - 1));

const lens = document.getElementById("lens");
let lensEnabled = true;
const toggleLens = () => {
  lensEnabled = !lensEnabled;
  document.getElementById("magnify").textContent = `Lens: ${lensEnabled ? "On" : "Off"}`;
  document.getElementById("magnify").setAttribute("aria-pressed", String(lensEnabled));
  lens.style.display = "none";
};
document.getElementById("magnify").onclick = toggleLens;
document.addEventListener("keydown", (event) => {
  if (document.querySelector('#deck-editor')?.open) return;
  lens.style.display = "none";
  if (document.querySelector("#image-viewer").open) return;
  if (event.key.toLowerCase() === "m") toggleLens();
});

document.querySelectorAll(".route-image,.route-popup img,.route-stop img,.monument-art,.overview-grid img").forEach((image) => {
  image.addEventListener("click", (event) => {
    if (image.classList.contains("route-active-photo") || !image.closest(".route-stop")) {
      event.stopPropagation();
      openImage(image);
    }
  });
  if (image.closest('.route-stop')) image.addEventListener('keydown', event => {
    if (!image.classList.contains('route-active-photo') || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    openImage(image);
  });
  image.addEventListener("pointerleave", () => {
    lens.style.display = "none";
  });
  image.addEventListener("pointermove", (event) => {
    if (!lensEnabled || event.pointerType === "touch" || !image.naturalWidth) return;
    const bounds = image.getBoundingClientRect();
    const scale = Math.min(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const left = bounds.left + (bounds.width - width) / 2;
    const top = bounds.top + (bounds.height - height) / 2;
    const x = event.clientX - left;
    const y = event.clientY - top;
    if (x < 0 || y < 0 || x > width || y > height) {
      lens.style.display = "none";
      return;
    }
    const size = Math.min(420, innerWidth * 0.7, innerHeight * 0.7);
    const zoom = 2;
    lens.style.width = `${size}px`;
    lens.style.height = `${size}px`;
    Object.assign(lens.style, {
      display: "block",
      left: `${Math.max(0, Math.min(innerWidth - size, event.clientX - size / 2))}px`,
      top: `${Math.max(0, Math.min(innerHeight - size, event.clientY - size / 2))}px`,
      backgroundImage: `url(${image.src})`,
      backgroundSize: `${width * zoom}px ${height * zoom}px`,
      backgroundPosition: `${size / 2 - x * zoom}px ${size / 2 - y * zoom}px`,
    });
  });
});

const imageViewer = document.querySelector('#image-viewer');
const viewerPhoto = document.querySelector('#image-viewer-photo');
const zoomButton = document.querySelector('#image-zoom');
function openImage(image) {
  if (imageViewer.open) return;
  lens.style.display = 'none';
  viewerPhoto.src = image.currentSrc || image.src;
  viewerPhoto.alt = image.alt;
  document.querySelector('#image-viewer-title').textContent = readableSlideTitle(slides[index]);
  imageViewer.classList.remove('zoomed');
  zoomButton.textContent = 'Zoom in';
  zoomButton.setAttribute('aria-pressed', 'false');
  imageViewer.showModal();
  imageViewer.querySelector('.image-viewer-stage').scrollTo(0, 0);
}
document.querySelector('#image-close').onclick = () => imageViewer.close();
zoomButton.onclick = () => {
  const zoomed = imageViewer.classList.toggle('zoomed');
  zoomButton.textContent = zoomed ? 'Fit image' : 'Zoom in';
  zoomButton.setAttribute('aria-pressed', String(zoomed));
};
document.querySelectorAll('.route-image,.route-popup img,.monument-art,.overview-grid img,.route-stop img').forEach(image => {
  if (image.closest('.route-stop')) return;
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `Open full image: ${image.alt}`);
  image.title = 'Click to view full image';
  image.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    openImage(image);
  });
});

// Activities artwork opens in the same full-image viewer as route photos. No lens here:
// these images are cropped or masked, so the lens mapping would not line up.
document.querySelectorAll('.process-image,.original-poster,.original-badge').forEach(image => {
  const revealed = () => { const step = image.closest('.detail'); return !step || step.classList.contains('shown'); };
  const open = event => {
    event.stopPropagation();
    if (revealed()) openImage(image); else next(); // an unrevealed image is invisible: treat the click as "advance"
  };
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `Open full image: ${image.alt}`);
  image.title = 'Click to view full image';
  image.addEventListener('click', open);
  image.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    open(event);
  });
});

// Give panoramic location images the slide width instead of a narrow side column.
document.querySelectorAll('.slide.route > .route-image').forEach(image => {
  const slide = image.closest('.slide');
  const classify = () => {
    slide.classList.toggle('panorama-slide', image.naturalWidth / image.naturalHeight >= 1.85);
  };
  if (image.complete && image.naturalWidth) classify();
  else image.addEventListener('load', classify, { once: true });
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'open-slide-image';
  open.textContent = 'View full image ↗';
  open.addEventListener('click', event => {
    event.stopPropagation();
    openImage(image);
  });
  slide.append(open);
});
})();
