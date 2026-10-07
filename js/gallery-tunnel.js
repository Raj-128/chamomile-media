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
  const widthSet = ["62%", "70%", "78%", "88%", "96%"];
  const heightSet = ["58%", "68%", "78%", "88%", "96%"];

  surfaces.forEach((surface) => {
    const tiles = Array.from(surface.querySelectorAll(".gallery-tunnel__tile"));
    const surfaceClass = surface.classList;
    const imageChance = surfaceClass.contains("gallery-tunnel__surface--left")
      || surfaceClass.contains("gallery-tunnel__surface--right")
      ? 0.68
      : surfaceClass.contains("gallery-tunnel__surface--back")
        ? 0.4
        : surfaceClass.contains("gallery-tunnel__surface--floor")
          ? 0.22
          : 0.16;

    tiles.forEach((tile, index) => {
      tile.replaceChildren();
      tile.classList.remove("gallery-tunnel__tile--image", "gallery-tunnel__tile--empty");

      const shouldShowImage = Math.random() < imageChance;
      if (!shouldShowImage) {
        tile.classList.add("gallery-tunnel__tile--empty");
        tile.style.setProperty("--tile-width", "0%");
        tile.style.setProperty("--tile-height", "0%");
        return;
      }

      const image = document.createElement("img");
      image.alt = "";
      image.decoding = "async";
      image.loading = "eager";

      const imageIndex = (index + Math.floor(Math.random() * artwork.length)) % artwork.length;
      image.src = artwork[imageIndex];
      const sizeFactor = surfaceClass.contains("gallery-tunnel__surface--floor") ? 0.78 : 1;
      tile.style.setProperty(
        "--tile-width",
        `${parseInt(widthSet[Math.floor(Math.random() * widthSet.length)], 10) * sizeFactor}%`,
      );
      tile.style.setProperty(
        "--tile-height",
        `${parseInt(heightSet[Math.floor(Math.random() * heightSet.length)], 10) * sizeFactor}%`,
      );
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
