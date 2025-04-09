// ===== Tint Maps - main.js (方法 A：從 config.js 讀取金鑰) =====

let map;
let markers = [];

// ✅ 1. 動態載入 Google Maps API
function loadGoogleMapsScript() {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

// ✅ 2. 註冊 Google Maps callback（API 載入後觸發）
window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: CONFIG.DEFAULT_CENTER,
    zoom: CONFIG.DEFAULT_ZOOM,
    disableDefaultUI: true,
    styles: CONFIG.USE_CUSTOM_MAP_STYLE ? getCustomMapStyle() : null
  });

  renderStoreMarkers(stores);
  renderStoreCards(stores);
};

// ✅ 3. 頁面載入完成 → 開始載入 Google Maps script
window.addEventListener("load", () => {
  loadGoogleMapsScript();
});

// ✅ 自訂地圖樣式讀取
function getCustomMapStyle() {
  const styleTag = document.getElementById("map-style");
  try {
    return JSON.parse(styleTag.textContent || "[]");
  } catch {
    return [];
  }
}

// ✅ 渲染地圖上的店家標記
function renderStoreMarkers(storeList) {
  clearAllMarkers();

  storeList.forEach((store) => {
    const marker = new google.maps.Marker({
      position: { lat: store.lat, lng: store.lng },
      map,
      title: store.name,
      icon: {
        url: "img/icons/icon_location.png",
        scaledSize: new google.maps.Size(32, 32)
      }
    });

    marker.addListener("click", () => {
      openExpandedCard(store);
    });

    markers.push(marker);
  });
}

// ✅ 移除所有標記（for 篩選重載）
function clearAllMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
}




// ===== main.js 第 2 段：卡片渲染與展開互動 =====

function renderStoreCards(storeList) {
  const container = document.getElementById("card-scroll");
  container.innerHTML = "";

  storeList.forEach((store) => {
    const card = document.createElement("div");
    card.className = "card";
   card.innerHTML = `
  <img src="${store.images[0]}" alt="${store.name}" />
  <div class="card-content">
    <h3>${store.name}</h3>
    <p>${store.distance}</p>
  </div>
`;
    card.addEventListener("click", () => openExpandedCard(store));
    container.appendChild(card);
  });
}

function openExpandedCard(store) {
  const card = document.getElementById("expanded-card");
  const images = document.getElementById("expanded-images");
  const tags = document.getElementById("expanded-tags");

  document.getElementById("expanded-name").textContent = store.name;
  document.getElementById("expanded-distance").textContent = store.distance;
  document.getElementById("expanded-address").textContent = store.address;
  document.getElementById("expanded-description").textContent = store.description;

  images.innerHTML = store.images.map(img => `<img src="${img}" alt="${store.name}">`).join("");
  tags.innerHTML = store.services.map(s => `<span>${s}</span>`).join("");

  document.getElementById("btn-line").href = store.line || "#";
  document.getElementById("btn-ig").href = store.ig || "#";
  document.getElementById("btn-direction").href =
    `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
  document.getElementById("btn-booking").href = store.booking || "#";

  card.classList.add("open");
  card.removeAttribute("hidden");
}

document.getElementById("btn-close-expanded").addEventListener("click", () => {
  const card = document.getElementById("expanded-card");
  card.classList.remove("open");
  setTimeout(() => card.setAttribute("hidden", true), 300);
});

document.getElementById("btn-view-services").addEventListener("click", () => {
  const modal = document.getElementById("price-modal");
  modal.classList.add("open");
  modal.removeAttribute("hidden");

  document.getElementById("price-list").innerHTML = `
    <div class="price-item"><span>光療凝膠</span><span>NT$800~1000</span></div>
    <div class="price-item"><span>基礎保養</span><span>NT$500~700</span></div>
    <div class="price-item"><span>卸甲加購</span><span>NT$200~300</span></div>
  `;
});

document.getElementById("btn-close-modal").addEventListener("click", () => {
  const modal = document.getElementById("price-modal");
  modal.classList.remove("open");
  setTimeout(() => modal.setAttribute("hidden", true), 300);
});


// ===== main.js 第 3 段：搜尋、價格浮窗、收藏功能 =====

document.getElementById("btn-search").addEventListener("click", () => {
  const keyword = document.getElementById("search-input").value.trim();
  const filtered = stores.filter(store =>
    store.name.includes(keyword) ||
    store.services.some(s => s.includes(keyword))
  );

  renderStoreMarkers(filtered);
  renderStoreCards(filtered);
});

function getFavorites() {
  const raw = localStorage.getItem(CONFIG.LOCAL_STORAGE_FAVORITES);
  return raw ? JSON.parse(raw) : [];
}

function saveFavorites(favList) {
  localStorage.setItem(CONFIG.LOCAL_STORAGE_FAVORITES, JSON.stringify(favList));
}

function toggleFavorite(storeId) {
  let fav = getFavorites();
  if (fav.includes(storeId)) {
    fav = fav.filter(id => id !== storeId);
  } else {
    fav.push(storeId);
  }
  saveFavorites(fav);
}

function updateFavoriteIcon(storeId) {
  const fav = getFavorites();
  const btn = document.getElementById("btn-collection");
  const isFav = fav.includes(storeId);
  btn.innerHTML = `<img src="img/icons/${isFav ? 'icon_heart_fill' : 'icon_heart'}.png" alt="收藏">`;
}

document.getElementById("btn-collection").addEventListener("click", () => {
  const fav = getFavorites();
  const filtered = stores.filter(store => fav.includes(store.id));

  if (filtered.length === 0) {
    alert("你尚未收藏任何店家！");
  }

  renderStoreMarkers(filtered);
  renderStoreCards(filtered);
});

document.getElementById("btn-location").addEventListener("click", () => {
  map.panTo(CONFIG.DEFAULT_CENTER);
});
