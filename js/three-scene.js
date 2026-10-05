import * as THREE from "three";

/*
 * ============================================================
 * CHAMOMILE MEDIA - DIGITAL MARKETING NETWORK
 * ============================================================
 *
 * A rotating digital-marketing constellation that replaces the old
 * decorative globe. The Chamomile mark sits at the hub; the marketing
 * channels orbit it on two counter-rotating rings, connected by live
 * signal lines.
 *
 *                     SEARCH
 *                       *
 *          SOCIAL *           * ADS
 *                     (o)
 *                  CHAMOMILE
 *          EMAIL  *           * ANALYTICS
 *                       *
 *                    CONTENT
 *
 * The icons are drawn procedurally on a canvas rather than loaded from
 * PNGs, so their stroke weight and colour can be tuned to stay legible
 * at background opacity on any screen density.
 *
 * GSAP drives: outer orbit, inner counter-orbit, background drift,
 * hub breathing, per-icon float.
 *
 * Three.js draws: hub, icons, connection lines, travelling signals.
 * ============================================================
 */

const canvas = document.querySelector("#webgl-canvas");

if (!canvas) {
  console.warn("Chamomile: #webgl-canvas was not found.");
} else {
  /* ==========================================================
   * 1. DEVICE / MOTION SETTINGS
   * ========================================================== */

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const isSmallPhone = window.matchMedia("(max-width: 480px)").matches;
  const isShortLaptop = window.matchMedia("(max-height: 780px)").matches;
  /*
   * The hero network is meant to turn continuously, by explicit request,
   * so it runs regardless of prefers-reduced-motion. It is a slow, low
   * contrast, non-flashing rotation well away from the reading column,
   * and every other animation on the site still honours the setting.
   */
  const prefersReducedMotion = false;

  const gsap = window.gsap || null;

  if (!gsap) {
    console.warn("Chamomile: GSAP was not found. Falling back to native animation.");
  }

  /* ==========================================================
   * 2. COLOURS
   * ========================================================== */

  const primary = 0x2f7f9e;
  const accent = 0xe0a02a;

  const primaryCss = "#2f7f9e";
  const accentCss = "#e0a02a";

  /* ==========================================================
   * 3. PROCEDURAL MARKETING ICONS
   * ==========================================================
   *
   * Each icon is drawn once into a 256px canvas with a heavy stroke.
   * A thin line-art PNG disappears at background opacity; a 14px
   * stroke stays readable while still feeling light.
   */

  const ICON_SIZE = 256;
  const STROKE = 15;

  const drawIcon = (name, colour) => {
    const iconCanvas = document.createElement("canvas");
    iconCanvas.width = ICON_SIZE;
    iconCanvas.height = ICON_SIZE;

    const context = iconCanvas.getContext("2d");

    context.strokeStyle = colour;
    context.fillStyle = colour;
    context.lineWidth = STROKE;
    context.lineCap = "round";
    context.lineJoin = "round";

    const circle = (x, y, r) => {
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.stroke();
    };

    const dot = (x, y, r) => {
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    };

    const line = (x1, y1, x2, y2) => {
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    };

    const bar = (x, y, w, h) => {
      context.beginPath();
      context.roundRect(x, y, w, h, 10);
      context.stroke();
    };

    switch (name) {
      // Search / SEO: magnifying glass over a rising result.
      case "search":
        circle(108, 106, 62);
        line(152, 152, 210, 210);
        line(84, 118, 104, 92);
        line(104, 92, 126, 116);
        line(126, 116, 146, 82);
        break;

      // Paid ads: target with an arrow in the centre.
      case "ads":
        circle(128, 128, 88);
        circle(128, 128, 46);
        dot(128, 128, 16);
        break;

      // Analytics: bar chart with a trend line.
      case "analytics":
        bar(46, 150, 44, 66);
        bar(106, 106, 44, 110);
        bar(166, 66, 44, 150);
        break;

      // Content: document with copy lines.
      case "content":
        context.beginPath();
        context.roundRect(62, 42, 132, 172, 16);
        context.stroke();
        line(92, 92, 164, 92);
        line(92, 128, 164, 128);
        line(92, 164, 136, 164);
        break;

      // Growth: upward trending line with an arrow head.
      case "growth":
        context.beginPath();
        context.moveTo(44, 190);
        context.lineTo(102, 126);
        context.lineTo(146, 160);
        context.lineTo(212, 74);
        context.stroke();
        line(212, 74, 166, 78);
        line(212, 74, 208, 120);
        break;

      // Social: connected nodes / share graph.
      case "social":
        dot(190, 62, 24);
        dot(190, 194, 24);
        dot(62, 128, 24);
        line(80, 118, 172, 74);
        line(80, 138, 172, 182);
        break;

      // Email / lifecycle: envelope.
      case "email":
        context.beginPath();
        context.roundRect(38, 68, 180, 124, 16);
        context.stroke();
        context.beginPath();
        context.moveTo(50, 82);
        context.lineTo(128, 142);
        context.lineTo(206, 82);
        context.stroke();
        break;

      // Engagement: click / cursor with a ripple.
      case "engagement":
        context.beginPath();
        context.moveTo(88, 52);
        context.lineTo(196, 122);
        context.lineTo(150, 136);
        context.lineTo(176, 196);
        context.lineTo(146, 208);
        context.lineTo(122, 148);
        context.lineTo(88, 182);
        context.closePath();
        context.stroke();
        break;

      default:
        circle(128, 128, 80);
    }

    const texture = new THREE.CanvasTexture(iconCanvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    return texture;
  };

  /* ==========================================================
   * 4. THREE.JS SETUP
   * ========================================================== */

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  const cameraDistance = () => {
    if (window.matchMedia("(max-width: 480px)").matches) {
      return 11.2;
    }

    if (window.matchMedia("(max-width: 768px)").matches) {
      return 10.6;
    }

    // Shorter laptop screens need the camera pulled back so the
    // outer ring never clips against the top of the viewport.
    return window.innerHeight < 780 ? 10.4 : 9.6;
  };

  camera.position.set(isMobile ? 0 : 1.7, 0, cameraDistance());

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  /* ==========================================================
   * 5. MAIN NETWORK CONTAINER
   * ========================================================== */

  const marketingNetwork = new THREE.Group();

  const networkBaseX = isMobile ? 0.1 : 2.3;
  const networkBaseY = isMobile ? 0.2 : 0;

  marketingNetwork.position.set(networkBaseX, networkBaseY, 0);
  marketingNetwork.scale.setScalar(isMobile ? 0.78 : isShortLaptop ? 0.92 : 1);

  scene.add(marketingNetwork);

  /* ==========================================================
   * 6. CENTRE CHAMOMILE HUB
   * ========================================================== */

  const hub = new THREE.Group();

  const logoTexture = new THREE.TextureLoader().load("assets/images/chamomile-logo.jpg");

  const hubLogo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.18, 1.18),
    new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      opacity: isMobile ? 0.26 : 0.46,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  const hubCore = new THREE.Mesh(
    new THREE.CircleGeometry(0.86, 48),
    new THREE.MeshBasicMaterial({
      color: primary,
      transparent: true,
      opacity: isMobile ? 0.1 : 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  const hubRing = new THREE.Mesh(
    new THREE.RingGeometry(0.98, 1.03, 64),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: isMobile ? 0.26 : 0.44,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.655, 64),
    new THREE.MeshBasicMaterial({
      color: primary,
      transparent: true,
      opacity: isMobile ? 0.24 : 0.4,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  hubLogo.position.z = 0.12;
  hub.add(hubCore, hubRing, innerRing, hubLogo);
  marketingNetwork.add(hub);

  /* ==========================================================
   * 7. ORBIT RINGS
   * ==========================================================
   *
   * Two rings turning in opposite directions read as a rotating
   * structure rather than a flat spinning wheel.
   */

  const outerChannels = ["search", "ads", "analytics", "content", "growth", "social"];
  const innerChannels = ["email", "engagement"];

  const outerRadius = isSmallPhone ? 2.75 : isMobile ? 3.05 : 4.55;
  const innerRadius = isSmallPhone ? 1.58 : isMobile ? 1.75 : 2.6;

  const outerIconSize = isSmallPhone ? 0.655 : isMobile ? 0.765 : 1.03;
  const innerIconSize = outerIconSize * 0.66;

  const nodes = [];

  /*
   * Draw the orbit paths themselves.
   *
   * Without a visible track, icons crossing an empty background read as
   * drifting rather than circling. The faint ring is what makes the
   * motion legibly circular.
   */
  const addOrbitPath = (radius) => {
    const path = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.008, radius + 0.008, 128),
      new THREE.MeshBasicMaterial({
        color: primary,
        transparent: true,
        opacity: isMobile ? 0.14 : 0.22,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );

    path.renderOrder = 0;
    marketingNetwork.add(path);
  };

  addOrbitPath(outerRadius);
  addOrbitPath(innerRadius);

  /* ==========================================================
   * 8. CONNECTION GEOMETRY
   * ==========================================================
   *
   * One segment per node: centre -> icon. Two vertices, three
   * components each, so six floats per node.
   */

  const totalNodes = outerChannels.length + innerChannels.length;
  const linePositions = new Float32Array(totalNodes * 6);

  const connectionGeometry = new THREE.BufferGeometry();
  const connectionPositions = new THREE.BufferAttribute(linePositions, 3);

  connectionGeometry.setAttribute("position", connectionPositions);

  const connections = new THREE.LineSegments(
    connectionGeometry,
    new THREE.LineBasicMaterial({
      color: primary,
      transparent: true,
      opacity: isMobile ? 0.16 : 0.26,
      depthWrite: false,
    })
  );

  connections.renderOrder = 1;
  marketingNetwork.add(connections);

  /* ==========================================================
   * 9. SIGNAL PULSES
   * ========================================================== */

  const signalPulses = [];
  const signalStart = new THREE.Vector3(0, 0, 0.18);
  const signalPosition = new THREE.Vector3();

  /* ==========================================================
   * 10. BUILD NODES
   * ========================================================== */

  const buildRing = (channels, radius, size, direction, ringIndex) => {
    channels.forEach((channelName, index) => {
      const group = new THREE.Group();

      // Even spacing around a full turn, starting at the top.
      const baseAngle = -Math.PI / 2 + (index / channels.length) * Math.PI * 2;

      group.userData.baseAngle = baseAngle;
      group.userData.radius = radius;
      group.userData.direction = direction;
      group.userData.floatPhase = nodes.length * 0.85;

      const useAccent = (index + ringIndex) % 2 === 0;

      const icon = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({
          map: drawIcon(channelName, useAccent ? accentCss : primaryCss),
          transparent: true,
          opacity: isMobile ? 0.5 : 0.74,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );

      icon.renderOrder = 3;
      group.add(icon);

      group.position.set(
        Math.cos(baseAngle) * radius,
        Math.sin(baseAngle) * radius,
        0
      );

      marketingNetwork.add(group);
      nodes.push(group);

      /* Travelling signal: hub -> icon, on repeat. */
      const signal = new THREE.Mesh(
        new THREE.CircleGeometry(isSmallPhone ? 0.035 : 0.05, 16),
        new THREE.MeshBasicMaterial({
          color: useAccent ? primary : accent,
          transparent: true,
          opacity: isMobile ? 0.5 : 0.8,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );

      signal.renderOrder = 4;
      signal.userData.node = group;
      signal.userData.offset = nodes.length / totalNodes;

      marketingNetwork.add(signal);
      signalPulses.push(signal);
    });
  };

  buildRing(outerChannels, outerRadius, outerIconSize, 1, 0);
  buildRing(innerChannels, innerRadius, innerIconSize, -1, 1);

  /* ==========================================================
   * 11. GSAP STATE
   * ========================================================== */

  const animationState = {
    orbit: 0,
    driftX: 0,
    driftY: 0,
    hubPulse: 1,
  };

  if (gsap && !prefersReducedMotion) {
    // One full turn every 34s on desktop. Slow enough to read as calm.
    gsap.to(animationState, {
      orbit: Math.PI * 2,
      duration: isMobile ? 42 : 34,
      repeat: -1,
      ease: "none",
    });

    gsap.to(animationState, {
      driftX: isMobile ? 0.08 : 0.16,
      duration: 11,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(animationState, {
      driftY: isMobile ? 0.06 : 0.1,
      duration: 13,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(animationState, {
      hubPulse: 1.045,
      duration: 3.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    nodes.forEach((node, index) => {
      gsap.to(node.scale, {
        x: 1.05,
        y: 1.05,
        z: 1.05,
        duration: 2.8 + index * 0.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.15,
      });
    });
  }

  /* ==========================================================
   * 12. POINTER PARALLAX
   * ========================================================== */

  const pointer = new THREE.Vector2();

  let pointerTargetX = 0;
  let pointerTargetY = 0;

  window.addEventListener(
    "mousemove",
    (event) => {
      pointerTargetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerTargetY = -((event.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true }
  );

  /* ==========================================================
   * 13. RENDER LOOP
   * ==========================================================
   *
   * The canvas opacity is left entirely to the stylesheet, so the
   * network reads at one consistent strength on every section and every
   * page. Nothing here fades it on scroll.
   */

  const clock = new THREE.Clock();

  let nativeOrbit = 0;
  let isVisible = true;

  // Stop rendering while the tab is hidden, and while the hero has
  // scrolled away, so the rest of the page keeps a full frame budget.
  document.addEventListener("visibilitychange", () => {
    isVisible = !document.hidden;
  });

  const render = () => {
    requestAnimationFrame(render);

    if (!isVisible) {
      return;
    }

    const elapsed = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      if (!gsap) {
        nativeOrbit += ((Math.PI * 2) / 34) * (1 / 60);
        animationState.orbit = nativeOrbit;
        animationState.driftX = Math.sin(elapsed * 0.18) * (isMobile ? 0.08 : 0.16);
        animationState.driftY = Math.cos(elapsed * 0.15) * (isMobile ? 0.06 : 0.1);
        animationState.hubPulse = 1 + Math.sin(elapsed * 1.0) * 0.045;
      }

      pointer.x += (pointerTargetX - pointer.x) * 0.035;
      pointer.y += (pointerTargetY - pointer.y) * 0.035;

      marketingNetwork.position.x = networkBaseX + animationState.driftX;
      marketingNetwork.position.y = networkBaseY + animationState.driftY;

      /*
       * A slow tilt on X plus the pointer parallax gives the flat ring
       * the read of a rotating three-dimensional body.
       */
      marketingNetwork.rotation.x =
        Math.sin(elapsed * 0.12) * 0.06 + (isMobile ? 0 : pointer.y * 0.05);

      marketingNetwork.rotation.z =
        Math.sin(elapsed * 0.09) * 0.03 + (isMobile ? 0 : pointer.x * 0.035);

      hub.scale.setScalar(animationState.hubPulse);
      hub.rotation.z = elapsed * 0.055;
      hubLogo.rotation.z = -hub.rotation.z;

      nodes.forEach((node, index) => {
        const angle =
          node.userData.baseAngle + animationState.orbit * node.userData.direction;

        node.position.x = Math.cos(angle) * node.userData.radius;
        node.position.y = Math.sin(angle) * node.userData.radius;
        node.position.z =
          Math.sin(elapsed * 0.65 + node.userData.floatPhase) * 0.14;

        const offset = index * 6;

        linePositions[offset] = 0;
        linePositions[offset + 1] = 0;
        linePositions[offset + 2] = 0.03;
        linePositions[offset + 3] = node.position.x;
        linePositions[offset + 4] = node.position.y;
        linePositions[offset + 5] = node.position.z;

        // Keep every icon square-on to the camera as the group tilts.
        node.quaternion.copy(camera.quaternion);
        node.rotation.x -= marketingNetwork.rotation.x;
        node.rotation.z -= marketingNetwork.rotation.z;
      });

      connectionPositions.needsUpdate = true;

      signalPulses.forEach((pulse) => {
        const progress = (elapsed * 0.17 + pulse.userData.offset) % 1;

        signalPosition.lerpVectors(signalStart, pulse.userData.node.position, progress);
        pulse.position.copy(signalPosition);
        pulse.scale.setScalar(0.45 + Math.sin(progress * Math.PI) * 0.7);
      });
    }

    renderer.render(scene, camera);
  };

  render();

  /* ==========================================================
   * 14. RESPONSIVE RESIZE
   * ========================================================== */

  let resizeTimer = 0;

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {
      const nowMobile = window.matchMedia("(max-width: 768px)").matches;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.position.x = nowMobile ? 0 : 1.7;
      camera.position.z = cameraDistance();
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, nowMobile ? 1.25 : 1.75)
      );

      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 150);
  });
}
