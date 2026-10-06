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

  tunnel.querySelectorAll(".gallery-tunnel__tile").forEach((tile, index) => {
    tile.replaceChildren();
    if (index % 3 !== 0) return;

    const image = document.createElement("img");
    image.src = artwork[Math.floor(index / 3) % artwork.length];
    image.alt = "";
    image.decoding = "async";
    tile.append(image);
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
