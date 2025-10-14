    lucide.createIcons();
    const cars = [
      {
        name: "BYD M6",
        image: "image/byd-m6-2.png",
        range: "Range: 521 km",
        speed: "Top Speed: 185 km/h",
        power: "Power: 222 kW"
      },
      {
        name: "SEAL",
        image: "image/byd-seal.png",
        range: "Range: 550 km",
        speed: "Top Speed: 200 km/h",
        power: "Power: 230 kW"
      },
      {
        name: "ATTO 3",
        image: "image/byd-atto3.png",
        range: "Range: 480 km",
        speed: "Top Speed: 160 km/h",
        power: "Power: 150 kW"
      },
      {
        name: "DOLPHIN",
        image: "image/byd-dolphin-2.png",
        range: "Range: 420 km",
        speed: "Top Speed: 150 km/h",
        power: "Power: 130 kW"
      }
    ];

    let index = 0;

    const carImage = document.getElementById("car-image");
    const carModelBg = document.getElementById("car-model-bg");
    const carRange = document.getElementById("car-range");
    const carSpeed = document.getElementById("car-speed");
    const carPower = document.getElementById("car-power");
    const container = document.getElementById("car-container");

    const lines = [
      document.getElementById("line-0"),
      document.getElementById("line-1"),
      document.getElementById("line-2"),
      document.getElementById("line-3")
    ];

    function updateActiveLine() {
      lines.forEach((line, i) => {
        if (i === index) {
          line.classList.add("active-line");
        } else {
          line.classList.remove("active-line");
        }
      });
    }

    function updateCar(direction) {
      container.style.opacity = 0;
      container.style.transform = "translateY(30px)";
      
      setTimeout(() => {
        index = (index + direction + cars.length) % cars.length;
        const car = cars[index];
        carImage.src = car.image;
        carModelBg.textContent = car.name;
        carRange.textContent = car.range;
        carSpeed.textContent = car.speed;
        carPower.textContent = car.power;
        updateActiveLine();
        container.style.opacity = 1;
        container.style.transform = "translateY(0)";
      }, 400);
    }

    document.getElementById("up").addEventListener("click", () => updateCar(-1));
    document.getElementById("down").addEventListener("click", () => updateCar(1));

    // Initial active line
    updateActiveLine();

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('show');
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.innovation-card').forEach(card => {
      observer.observe(card);
    });

     // === Speedometer Animation ===
  let speed = 0;
  const maxSpeed = 220;
  const speedEl = document.getElementById('speed-value');
  const progress = document.querySelector('.speedometer-progress');
  function animateSpeedometer() {
    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      if (current >= speed) clearInterval(interval);
      const offset = 565 - (current / maxSpeed) * 565;
      progress.style.strokeDashoffset = offset;
      speedEl.textContent = current;
    }, 20);
  }

  // Animate on scroll
  const perfSection = document.getElementById('performance');
  const perfObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        speed = 180; // target speed
        animateSpeedometer();
        animateChart();
      }
    });
  }, { threshold: 0.4 });
  perfObserver.observe(perfSection);

  // === Chart Animation (Power vs Efficiency) ===
  function animateChart() {
    const ctx = document.getElementById('powerChart');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Idle', '30%', '60%', '90%', 'Max'],
        datasets: [{
          label: '',
          data: [20, 65, 85, 75, 90],
          borderColor: 'rgba(0,255,255,0.9)',
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 0,
          fill: {
            target: 'origin',
            above: 'rgba(0,255,255,0.1)'
          }
        }]
      },
      options: {
        animation: { duration: 2000 },
        scales: {
          x: { display: false },
          y: { display: false, min: 0, max: 100 }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  /* === Warp Tunnel 3D Light Streaks === */
  const canvas = document.getElementById("warpTunnel");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000010, 1);

  // === Garis Cahaya ===
  const streakCount = 700;
  const streakLength = 5;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const speeds = [];

  for (let i = 0; i < streakCount; i++) {
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 600;
    const dir = new THREE.Vector3(-x, -y, -z).normalize().multiplyScalar(streakLength);

    positions.push(x, y, z, x + dir.x, y + dir.y, z + dir.z);
    speeds.push(0.6 + Math.random() * 1.5);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();

  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    linewidth: 1
  });

  const warpLines = new THREE.LineSegments(geometry, material);
  scene.add(warpLines);

  camera.position.z = 100;

  // === Animasi Warp ===
  function animate() {
    const pos = warpLines.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 6) {
      const z1 = pos[i+2];
      const z2 = pos[i+5];

      // Geser ke arah kamera
      pos[i+2] += speeds[i/6] * 2.0; 
      pos[i+5] += speeds[i/6] * 2.0;

      // Jika garis sudah lewat kamera (z > 100), reset jauh di belakang (z = -600)
      if (z2 > 100) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = -600;
        const dir = new THREE.Vector3(-x, -y, -z).normalize().multiplyScalar(streakLength);
        pos[i] = x; pos[i+1] = y; pos[i+2] = z;
        pos[i+3] = x + dir.x; pos[i+4] = y + dir.y; pos[i+5] = z + dir.z;
      }
    }

    warpLines.geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }


  animate();