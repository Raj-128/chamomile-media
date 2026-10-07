(() => {
  const tunnel = document.querySelector(".gallery-tunnel");
  if (!tunnel) return;

  const artwork = [
    "assets/images/clients/agatha-group.jpg",
    "assets/images/clients/kosmiqua.jpg",
    "assets/images/clients/neevdentalstudio.jpg",
    "assets/images/clients/taj-revista.jpg",
    "assets/images/clients/krigoru.jpg",
    "assets/images/clients/whitewingsgroup.jpg",
    "assets/images/clients/shivantagroupsurat.jpg",
    "assets/images/clients/sahyogoverseas.jpg",
    "assets/images/clients/siddhi-jewelery.jpg",
    "assets/images/clients/mr-maharaj-surat.jpg",
  ];

  const surfaces = Array.from(tunnel.querySelectorAll(".gallery-tunnel__surface"));

  surfaces.forEach((surface) => {
    const tiles = Array.from(surface.querySelectorAll(".gallery-tunnel__tile"));

    tiles.forEach((tile, index) => {
      tile.replaceChildren();
      tile.classList.remove("gallery-tunnel__tile--image", "gallery-tunnel__tile--empty");

      const shouldShowImage = Math.random() < 0.32 && index % 2 === 0;
      if (!shouldShowImage) {
        tile.classList.add("gallery-tunnel__tile--empty");
        tile.style.setProperty("--tile-width", "0%");
        tile.style.setProperty("--tile-height", "0%");
        return;
      }

      const image = document.createElement("img");
      image.src = artwork[(index + Math.floor(Math.random() * artwork.length)) % artwork.length];
      image.alt = "";
      image.decoding = "async";
      image.loading = "eager";

      const widthSet = ["52%", "64%", "72%", "82%", "90%"];
      const heightSet = ["42%", "54%", "62%", "72%", "82%"];
      tile.style.setProperty("--tile-width", widthSet[Math.floor(Math.random() * widthSet.length)]);
      tile.style.setProperty("--tile-height", heightSet[Math.floor(Math.random() * heightSet.length)]);
      tile.classList.add("gallery-tunnel__tile--image");
      tile.append(image);
    });
  });

  tunnel.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    tunnel.classList.toggle("is-visible", entry.isIntersecting);
  });
  observer.observe(tunnel);
})();
