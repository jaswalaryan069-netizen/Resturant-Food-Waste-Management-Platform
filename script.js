/**
 * ============================================================================
 * Restaurant Food Waste Management Platform - Core Script
 * Technology: HTML5, CSS3, Vanilla JavaScript, Browser Local Storage
 * 
 * Description:
 * This script provides beginner-friendly, clean, and modular client-side logic:
 * 1. Persistent data storage using the browser LocalStorage API.
 * 2. Real-time metric calculations for food weight (KG) and estimated costs (₹).
 * 3. Adding, editing, deleting, searching, filtering, and sorting waste records.
 * 4. Interactive visualizations using Chart.js with pure HTML/CSS fallbacks.
 * 5. Rule-based restaurant operational waste reduction recommendations.
 * 6. Financial loss analysis and potential cost savings projection.
 * 7. CSV data export and light/dark theme switching.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. GLOBAL CONSTANTS & STATE
// ----------------------------------------------------------------------------

// Storage key used to persist waste records in browser localStorage
const STORAGE_KEY = "restaurant_food_waste_records";

// Storage key for user's light/dark mode preference
const THEME_KEY = "restaurant_theme_mode";

// Array holding all waste record objects in memory
let wasteRecords = [];

// Dictionary holding active Chart.js instances so they can be destroyed and redrawn
const chartInstances = {};

// Callback reference for the confirmation modal
let modalConfirmCallback = null;

// Initial 12 realistic sample records pre-loaded on first launch
const SAMPLE_RECORDS = [
  {
    id: "101",
    foodName: "Fresh Tomatoes",
    category: "Vegetables",
    quantity: 5.0,
    estimatedCost: 200,
    reason: "Spoilage",
    department: "Kitchen",
    date: "2026-11-01",
    notes: "Overripe crates in walk-in cold storage"
  },
  {
    id: "102",
    foodName: "Paneer (Cottage Cheese)",
    category: "Dairy Products",
    quantity: 3.2,
    estimatedCost: 1120,
    reason: "Expired Ingredients",
    department: "Storage",
    date: "2026-11-01",
    notes: "Exceeded use-by date in dairy chiller"
  },
  {
    id: "103",
    foodName: "Cooked Basmati Rice",
    category: "Grains",
    quantity: 7.5,
    estimatedCost: 600,
    reason: "Overproduction",
    department: "Kitchen",
    date: "2026-11-02",
    notes: "Excess lunch buffet batch cooked"
  },
  {
    id: "104",
    foodName: "Artisan Baguettes & Loaves",
    category: "Prepared Food",
    quantity: 4.0,
    estimatedCost: 480,
    reason: "Unsold Food",
    department: "Bakery",
    date: "2026-11-02",
    notes: "Leftover fresh bread from evening display"
  },
  {
    id: "105",
    foodName: "Crisp Apples & Pears",
    category: "Fruits",
    quantity: 2.5,
    estimatedCost: 350,
    reason: "Spoilage",
    department: "Storage",
    date: "2026-11-02",
    notes: "Bruised fruit delivery shipment"
  },
  {
    id: "106",
    foodName: "Boneless Chicken Breasts",
    category: "Meat",
    quantity: 3.8,
    estimatedCost: 1140,
    reason: "Incorrect Preparation",
    department: "Kitchen",
    date: "2026-11-03",
    notes: "Overcooked on tandoor station during dinner rush"
  },
  {
    id: "107",
    foodName: "French Fries & Cutlets",
    category: "Prepared Food",
    quantity: 4.2,
    estimatedCost: 330,
    reason: "Overproduction",
    department: "Restaurant Service",
    date: "2026-11-03",
    notes: "Pre-fried batches ahead of dinner service rush"
  },
  {
    id: "108",
    foodName: "Whole Dairy Milk",
    category: "Dairy Products",
    quantity: 4.5,
    estimatedCost: 270,
    reason: "Expired Ingredients",
    department: "Bakery",
    date: "2026-11-03",
    notes: "Sour milk batches due to chiller door left ajar"
  },
  {
    id: "109",
    foodName: "Spinach & Salad Greens",
    category: "Vegetables",
    quantity: 3.5,
    estimatedCost: 175,
    reason: "Spoilage",
    department: "Kitchen",
    date: "2026-11-04",
    notes: "Wilted leafy greens from weekend storage"
  },
  {
    id: "110",
    foodName: "Grilled Fish Fillet",
    category: "Meat",
    quantity: 2.0,
    estimatedCost: 1200,
    reason: "Customer Leftovers",
    department: "Restaurant Service",
    date: "2026-11-04",
    notes: "Plate waste: portions too large on dinner tasting menu"
  },
  {
    id: "111",
    foodName: "Butter Croissants & Pastries",
    category: "Prepared Food",
    quantity: 3.0,
    estimatedCost: 600,
    reason: "Unsold Food",
    department: "Bakery",
    date: "2026-11-04",
    notes: "Day-old pastry cabinet display surplus"
  },
  {
    id: "112",
    foodName: "Bell Peppers & Onions",
    category: "Vegetables",
    quantity: 4.0,
    estimatedCost: 240,
    reason: "Incorrect Preparation",
    department: "Kitchen",
    date: "2026-11-04",
    notes: "Improper knife cut size for curry sauce base"
  }
];

// ----------------------------------------------------------------------------
// 2. LOCAL STORAGE HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Loads records from browser localStorage.
 * If no records exist, initializes with the 12 default sample records.
 */
function loadRecords() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      wasteRecords = JSON.parse(savedData);
    } catch (e) {
      console.error("Failed to parse stored records. Restoring defaults.", e);
      wasteRecords = [...SAMPLE_RECORDS];
      saveRecords();
    }
  } else {
    // First time opening the application: seed with sample data
    wasteRecords = [...SAMPLE_RECORDS];
    saveRecords();
  }
}

/**
 * Saves current wasteRecords array into browser localStorage as a JSON string.
 */
function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wasteRecords));
}

// ----------------------------------------------------------------------------
// 3. NAVIGATION (SINGLE PAGE APPLICATION VIEW SWITCHER)
// ----------------------------------------------------------------------------

/**
 * Switches the active visible module section without a page refresh.
 * @param {string} sectionId - The ID attribute of the section to show
 */
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".content-section");
  for (let i = 0; i < sections.length; i++) {
    sections[i].classList.remove("active");
  }

  // Show the target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Update navigation button active styling in sidebar
  const navButtons = document.querySelectorAll(".nav-btn");
  for (let i = 0; i < navButtons.length; i++) {
    navButtons[i].classList.remove("active");
    const onClickAttr = navButtons[i].getAttribute("onclick") || "";
    if (onClickAttr.includes(sectionId)) {
      navButtons[i].classList.add("active");
    }
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById("sidebar");
  if (sidebar && sidebar.classList.contains("open")) {
    sidebar.classList.remove("open");
  }

  // Update top header titles
  const heading = document.getElementById("page-heading");
  const subheading = document.getElementById("page-subheading");

  if (sectionId === "dashboard-section") {
    heading.textContent = "Dashboard Overview";
    subheading.textContent = "Real-time restaurant food waste monitoring and metrics";
    updateDashboard();
  } else if (sectionId === "add-section") {
    heading.textContent = "Food Waste Entry";
    subheading.textContent = "Record discarded food items with estimated costs to identify loss drivers";
  } else if (sectionId === "records-section") {
    heading.textContent = "Waste Records Management";
    subheading.textContent = "Search, filter, sort, edit and export recorded restaurant waste logs";
    applyFilters();
  } else if (sectionId === "analytics-section") {
    heading.textContent = "Analytics & Reports";
    subheading.textContent = "Visual representation of waste distributions across categories and departments";
    renderAnalytics();
  } else if (sectionId === "cost-section") {
    heading.textContent = "Financial Cost Analysis";
    subheading.textContent = "Monetary valuation of discarded food inventory and potential savings";
    renderCostAnalysis();
  } else if (sectionId === "suggestions-section") {
    heading.textContent = "Waste Reduction Plan";
    subheading.textContent = "Intelligent rule-based operational solutions for kitchen efficiency";
    renderSuggestions();
  } else if (sectionId === "about-section") {
    heading.textContent = "About Project";
    subheading.textContent = "First-year engineering college submission and architecture overview";
  }

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Toggles the sidebar on mobile screen sizes.
 */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("open");
  }
}

// ----------------------------------------------------------------------------
// 4. THEME MANAGEMENT (LIGHT & DARK MODE)
// ----------------------------------------------------------------------------

/**
 * Initializes theme based on stored preference or system default.
 */
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonUI(savedTheme);
}

/**
 * Toggles between light and dark themes.
 */
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  updateThemeButtonUI(newTheme);

  // Redraw charts with suitable grid text colors
  updateDashboard();
  renderAnalytics();
}

/**
 * Updates the theme button icon and text.
 * @param {string} theme - "light" or "dark"
 */
function updateThemeButtonUI(theme) {
  const icon = document.getElementById("theme-icon");
  const text = document.getElementById("theme-text");
  if (icon && text) {
    if (theme === "dark") {
      icon.textContent = "☀️";
      text.textContent = "Light Mode";
    } else {
      icon.textContent = "🌙";
      text.textContent = "Dark Mode";
    }
  }
}

// ----------------------------------------------------------------------------
// 5. DATE & TIME HELPER
// ----------------------------------------------------------------------------

/**
 * Initializes and displays the current date in the header and form.
 */
function initDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const isoDate = `${year}-${month}-${day}`;

  // Form input default date
  const dateInput = document.getElementById("input-date");
  if (dateInput && !dateInput.value) {
    dateInput.value = isoDate;
  }

  // Header readable date display
  const dateSpan = document.getElementById("current-date-val");
  if (dateSpan) {
    const options = { weekday: "short", day: "2-digit", month: "short", year: "numeric" };
    dateSpan.textContent = today.toLocaleDateString("en-IN", options);
  }
}

// ----------------------------------------------------------------------------
// 6. MODULE 1: DASHBOARD CALCULATIONS & VISUALISATIONS
// ----------------------------------------------------------------------------

/**
 * Calculates and updates all summary statistics and charts on the Dashboard.
 */
function updateDashboard() {
  const totalCount = wasteRecords.length;

  // 1. Calculate Total Waste in KG and Total Cost in ₹
  let totalKg = 0;
  let totalCost = 0;
  const categoryTotals = {};
  const deptTotals = {};
  const reasonTotals = {};
  const dateTotals = {};
  const foodItemTotals = {};

  for (let i = 0; i < wasteRecords.length; i++) {
    const item = wasteRecords[i];
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.estimatedCost) || 0;

    totalKg += qty;
    totalCost += cost;

    // Category aggregation
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + qty;

    // Department aggregation
    deptTotals[item.department] = (deptTotals[item.department] || 0) + qty;

    // Reason aggregation
    reasonTotals[item.reason] = (reasonTotals[item.reason] || 0) + qty;

    // Date aggregation
    dateTotals[item.date] = (dateTotals[item.date] || 0) + qty;

    // Food Item aggregation for Top 5 leaderboard
    if (!foodItemTotals[item.foodName]) {
      foodItemTotals[item.foodName] = {
        name: item.foodName,
        category: item.category,
        quantity: 0,
        cost: 0
      };
    }
    foodItemTotals[item.foodName].quantity += qty;
    foodItemTotals[item.foodName].cost += cost;
  }

  totalKg = Math.round(totalKg * 10) / 10;

  // 2. Determine Most Wasted Category
  let topCategory = "None";
  let topCategoryKg = 0;
  for (const cat in categoryTotals) {
    if (categoryTotals[cat] > topCategoryKg) {
      topCategoryKg = categoryTotals[cat];
      topCategory = cat;
    }
  }

  // 3. Determine Highest Waste Department
  let topDept = "None";
  let topDeptKg = 0;
  for (const dept in deptTotals) {
    if (deptTotals[dept] > topDeptKg) {
      topDeptKg = deptTotals[dept];
      topDept = dept;
    }
  }

  // 4. Update Dashboard KPI Summary Cards
  const totalKgEl = document.getElementById("dash-total-kg");
  const totalRecordsEl = document.getElementById("dash-total-records");
  const topCategoryEl = document.getElementById("dash-top-category");
  const topCategoryKgEl = document.getElementById("dash-top-category-kg");
  const topDeptEl = document.getElementById("dash-top-dept");
  const topDeptKgEl = document.getElementById("dash-top-dept-kg");
  const totalCostEl = document.getElementById("dash-total-cost");

  if (totalKgEl) totalKgEl.textContent = totalKg.toFixed(1);
  if (totalRecordsEl) totalRecordsEl.textContent = totalCount;
  if (topCategoryEl) topCategoryEl.textContent = topCategory;
  if (topCategoryKgEl) topCategoryKgEl.textContent = `${topCategoryKg.toFixed(1)} KG wasted`;
  if (topDeptEl) topDeptEl.textContent = topDept;
  if (topDeptKgEl) topDeptKgEl.textContent = `${topDeptKg.toFixed(1)} KG wasted`;
  if (totalCostEl) totalCostEl.textContent = `₹${totalCost.toLocaleString("en-IN")}`;

  // Update navigation badge count
  const navBadge = document.getElementById("nav-badge-count");
  if (navBadge) navBadge.textContent = totalCount;

  // 5. Update Quick Recommendation Banner
  updateQuickRecommendationBanner(topCategory, topDept);

  // 6. Render Dashboard Visualizations
  renderDashboardCharts(categoryTotals, deptTotals, reasonTotals, dateTotals);

  // 7. Render Top 5 Wasted Food Items
  renderTopWastedItems(foodItemTotals);

  // 8. Render Recent Waste Records Table
  renderRecentRecordsTable();
}

/**
 * Updates the quick operational recommendation banner text on the dashboard.
 */
function updateQuickRecommendationBanner(topCategory, topDept) {
  const banner = document.getElementById("dash-quick-recommendation");
  if (!banner) return;

  if (topCategory === "Vegetables") {
    banner.textContent = "High vegetable wastage detected. Shift supplier orders to 2-day delivery cycles and verify walk-in cooler humidity.";
  } else if (topCategory === "Dairy Products") {
    banner.textContent = "Dairy losses are significant. Mandate strict First-In, First-Out (FIFO) stock rotation and date labeling.";
  } else if (topCategory === "Meat") {
    banner.textContent = "High financial loss in meat cuts. Verify cook station temperatures and introduce portion scales during prep.";
  } else if (topDept === "Kitchen") {
    banner.textContent = "Kitchen generates the majority of waste. Conduct daily prep audits and check recipe batch portioning.";
  } else {
    banner.textContent = "Monitor weekly customer footfall to adjust meal batch sizes and minimize unsold leftovers.";
  }
}

/**
 * Helper to safely destroy and re-instantiate a Chart.js canvas.
 */
function createSafeChart(chartId, config) {
  if (typeof Chart === "undefined") {
    return null; // Gracefully handle offline or missing CDN
  }

  const canvas = document.getElementById(chartId);
  if (!canvas) return null;

  if (chartInstances[chartId]) {
    chartInstances[chartId].destroy();
  }

  try {
    const ctx = canvas.getContext("2d");
    chartInstances[chartId] = new Chart(ctx, config);
    return chartInstances[chartId];
  } catch (e) {
    console.warn(`Chart rendering skipped for ${chartId}:`, e);
    return null;
  }
}

/**
 * Renders all 4 Dashboard visualisations.
 */
function renderDashboardCharts(categoryTotals, deptTotals, reasonTotals, dateTotals) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

  const palette = [
    "#2d6a4f", "#52b788", "#f4a261", "#e76f51", "#457b9d", "#7209b7", "#3f37c9"
  ];

  // --- Chart 1: Food Waste by Category (Doughnut) ---
  const catLabels = Object.keys(categoryTotals);
  const catValues = catLabels.map(k => Math.round(categoryTotals[k] * 10) / 10);

  createSafeChart("chart-dash-category", {
    type: "doughnut",
    data: {
      labels: catLabels,
      datasets: [{
        data: catValues,
        backgroundColor: palette.slice(0, catLabels.length),
        borderWidth: 2,
        borderColor: isDark ? "#1e293b" : "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { color: textColor, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} KG`
          }
        }
      }
    }
  });

  // Render CSS progress bar fallback/detail below the chart
  renderSimpleCssBars("dash-category-list", categoryTotals, "KG");

  // --- Chart 2: Food Waste by Department (Bar) ---
  const deptLabels = Object.keys(deptTotals);
  const deptValues = deptLabels.map(k => Math.round(deptTotals[k] * 10) / 10);

  createSafeChart("chart-dash-department", {
    type: "bar",
    data: {
      labels: deptLabels,
      datasets: [{
        label: "Waste (KG)",
        data: deptValues,
        backgroundColor: "#40916c",
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });
  renderSimpleCssBars("dash-dept-list", deptTotals, "KG");

  // --- Chart 3: Food Waste by Reason (Polar/Pie) ---
  const reasonLabels = Object.keys(reasonTotals);
  const reasonValues = reasonLabels.map(k => Math.round(reasonTotals[k] * 10) / 10);

  createSafeChart("chart-dash-reason", {
    type: "pie",
    data: {
      labels: reasonLabels,
      datasets: [{
        data: reasonValues,
        backgroundColor: ["#e63946", "#f4a261", "#2a9d8f", "#e76f51", "#457b9d", "#a8dadc", "#6d597a"],
        borderWidth: 2,
        borderColor: isDark ? "#1e293b" : "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { color: textColor, font: { size: 10 } } }
      }
    }
  });
  renderSimpleCssBars("dash-reason-list", reasonTotals, "KG");

  // --- Chart 4: Weekly Waste Trends (Timeline Line/Bar) ---
  const sortedDates = Object.keys(dateTotals).sort();
  const dateValues = sortedDates.map(d => Math.round(dateTotals[d] * 10) / 10);

  createSafeChart("chart-dash-trends", {
    type: "line",
    data: {
      labels: sortedDates,
      datasets: [{
        label: "Daily Waste (KG)",
        data: dateValues,
        borderColor: "#2d6a4f",
        backgroundColor: "rgba(45, 106, 79, 0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#2d6a4f"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });
  renderSimpleCssBars("dash-trend-list", dateTotals, "KG", true);
}

/**
 * Renders pure CSS progress bars as a companion or fallback to Chart.js.
 */
function renderSimpleCssBars(containerId, dataMap, unit, isDate = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const keys = Object.keys(dataMap);
  if (keys.length === 0) {
    container.innerHTML = "<p class='stat-desc'>No data recorded yet.</p>";
    return;
  }

  if (isDate) {
    keys.sort();
  } else {
    keys.sort((a, b) => dataMap[b] - dataMap[a]);
  }

  let maxVal = 0;
  for (let i = 0; i < keys.length; i++) {
    if (dataMap[keys[i]] > maxVal) maxVal = dataMap[keys[i]];
  }

  let html = "";
  // Show at most 4 key entries in mini breakdown to avoid clutter
  const displayKeys = keys.slice(0, 4);

  for (let i = 0; i < displayKeys.length; i++) {
    const label = displayKeys[i];
    const val = dataMap[label];
    const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;

    html += `
      <div class="bar-row">
        <div class="bar-meta">
          <span class="bar-label">${label}</span>
          <span class="bar-val">${val.toFixed(1)} ${unit}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill fill-color-${(i % 7) + 1}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Displays the Top 5 Wasted Food Items Leaderboard on the dashboard.
 */
function renderTopWastedItems(foodItemTotals) {
  const container = document.getElementById("dash-top-items-list");
  if (!container) return;

  const items = Object.values(foodItemTotals);
  if (items.length === 0) {
    container.innerHTML = "<p class='stat-desc'>No food item waste recorded yet.</p>";
    return;
  }

  // Sort descending by weight
  items.sort((a, b) => b.quantity - a.quantity);
  const top5 = items.slice(0, 5);

  let html = "";
  for (let i = 0; i < top5.length; i++) {
    const item = top5[i];
    const rankClass = i === 0 ? "rank-1" : (i === 1 ? "rank-2" : (i === 2 ? "rank-3" : ""));

    html += `
      <div class="top-item-card">
        <div class="top-item-left">
          <span class="top-item-rank ${rankClass}">#${i + 1}</span>
          <div class="top-item-info">
            <h4>${item.name}</h4>
            <p>${item.category}</p>
          </div>
        </div>
        <div class="top-item-right">
          <div class="top-item-weight">${item.quantity.toFixed(1)} KG</div>
          <div class="top-item-cost">₹${item.cost.toLocaleString("en-IN")}</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Displays the 5 most recent records in the dashboard table preview.
 */
function renderRecentRecordsTable() {
  const tbody = document.getElementById("dash-recent-tbody");
  if (!tbody) return;

  if (wasteRecords.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No records yet.</td></tr>`;
    return;
  }

  // Get last 5 records (reverse chronological order)
  const recent = [...wasteRecords].reverse().slice(0, 5);

  let html = "";
  for (let i = 0; i < recent.length; i++) {
    const item = recent[i];
    html += `
      <tr>
        <td>${item.date}</td>
        <td><strong>${item.foodName}</strong></td>
        <td><span class="tag-badge ${getCategoryBadgeClass(item.category)}">${item.category}</span></td>
        <td>${Number(item.quantity).toFixed(1)} KG</td>
        <td><strong class="text-danger">₹${(Number(item.estimatedCost) || 0).toLocaleString("en-IN")}</strong></td>
        <td><span class="dept-pill">${item.department}</span></td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

// ----------------------------------------------------------------------------
// 7. MODULE 2: FOOD WASTE ENTRY (ADD & EDIT)
// ----------------------------------------------------------------------------

/**
 * Handles form submission to Add or Update a waste record.
 * @param {Event} event - The HTML form submission event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const editId = document.getElementById("edit-id").value;
  const foodName = document.getElementById("input-food-name").value.trim();
  const category = document.getElementById("input-category").value;
  const quantity = parseFloat(document.getElementById("input-quantity").value);
  const estimatedCost = parseFloat(document.getElementById("input-cost").value);
  const reason = document.getElementById("input-reason").value;
  const department = document.getElementById("input-department").value;
  const date = document.getElementById("input-date").value;
  const notes = document.getElementById("input-notes").value.trim();

  // Basic Validation
  if (!foodName || !category || isNaN(quantity) || isNaN(estimatedCost) || !reason || !department || !date) {
    showToast("Please fill in all mandatory fields marked with *", "danger");
    return;
  }

  if (quantity <= 0) {
    showToast("Quantity wasted must be greater than 0 KG", "danger");
    return;
  }

  if (estimatedCost < 0) {
    showToast("Estimated cost cannot be negative", "danger");
    return;
  }

  if (editId) {
    // EDIT MODE: Update existing record
    let foundIndex = -1;
    for (let i = 0; i < wasteRecords.length; i++) {
      if (wasteRecords[i].id === editId) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1) {
      wasteRecords[foundIndex].foodName = foodName;
      wasteRecords[foundIndex].category = category;
      wasteRecords[foundIndex].quantity = quantity;
      wasteRecords[foundIndex].estimatedCost = estimatedCost;
      wasteRecords[foundIndex].reason = reason;
      wasteRecords[foundIndex].department = department;
      wasteRecords[foundIndex].date = date;
      wasteRecords[foundIndex].notes = notes;

      saveRecords();
      showToast(`Record for "${foodName}" updated successfully!`, "success");
      cancelEditMode();
      showSection("records-section");
    }
  } else {
    // ADD MODE: Create new record
    const newRecord = {
      id: Date.now().toString().slice(-6), // Compact unique ID
      foodName: foodName,
      category: category,
      quantity: quantity,
      estimatedCost: estimatedCost,
      reason: reason,
      department: department,
      date: date,
      notes: notes
    };

    wasteRecords.push(newRecord);
    saveRecords();

    showToast(`Logged "${foodName}" (${quantity} KG - ₹${estimatedCost})`, "success");
    resetWasteForm();
    showSection("dashboard-section");
  }

  // Refresh application views
  updateDashboard();
  applyFilters();
}

/**
 * Resets the entry form and sets date back to today.
 */
function resetWasteForm() {
  document.getElementById("waste-form").reset();
  document.getElementById("edit-id").value = "";
  initDate();
}

/**
 * Cancels editing mode and restores default Add Record form states.
 */
function cancelEditMode() {
  resetWasteForm();
  document.getElementById("form-heading").textContent = "Record Food Wastage";
  document.getElementById("btn-submit-form").innerHTML = "<span>💾</span> Save Waste Record";
  document.getElementById("btn-cancel-edit").classList.add("hidden");
}

/**
 * Populates form with existing record data for editing.
 * @param {string} id - Record ID to edit
 */
function editRecord(id) {
  let target = null;
  for (let i = 0; i < wasteRecords.length; i++) {
    if (wasteRecords[i].id === id) {
      target = wasteRecords[i];
      break;
    }
  }

  if (!target) return;

  document.getElementById("edit-id").value = target.id;
  document.getElementById("input-food-name").value = target.foodName;
  document.getElementById("input-category").value = target.category;
  document.getElementById("input-quantity").value = target.quantity;
  document.getElementById("input-cost").value = target.estimatedCost;
  document.getElementById("input-reason").value = target.reason;
  document.getElementById("input-department").value = target.department;
  document.getElementById("input-date").value = target.date;
  document.getElementById("input-notes").value = target.notes || "";

  document.getElementById("form-heading").textContent = `Edit Record: ${target.foodName}`;
  document.getElementById("btn-submit-form").innerHTML = "<span>🔄</span> Update Record";
  document.getElementById("btn-cancel-edit").classList.remove("hidden");

  showSection("add-section");
}

/**
 * Deletes a record by ID after user confirms.
 * @param {string} id - Record ID to delete
 */
function deleteRecord(id) {
  const target = wasteRecords.find(item => item.id === id);
  const name = target ? target.foodName : "this item";

  openConfirmModal(
    "Delete Waste Record",
    `Are you sure you want to permanently delete the waste record for "${name}"?`,
    () => {
      wasteRecords = wasteRecords.filter(item => item.id !== id);
      saveRecords();
      showToast("Waste record deleted successfully.", "danger");
      updateDashboard();
      applyFilters();
    }
  );
}

// ----------------------------------------------------------------------------
// 8. MODULE 3: WASTE RECORD MANAGEMENT (TABLE, FILTERS, SEARCH, SORT)
// ----------------------------------------------------------------------------

/**
 * Filters and sorts waste records based on toolbar inputs.
 */
function applyFilters() {
  const searchVal = (document.getElementById("search-input").value || "").toLowerCase().trim();
  const catVal = document.getElementById("filter-category").value;
  const deptVal = document.getElementById("filter-dept").value;
  const dateVal = document.getElementById("filter-date").value;
  const sortVal = document.getElementById("sort-records").value;

  // 1. Filter records
  let result = wasteRecords.filter(item => {
    const matchesSearch = !searchVal ||
      item.foodName.toLowerCase().includes(searchVal) ||
      item.reason.toLowerCase().includes(searchVal) ||
      (item.notes && item.notes.toLowerCase().includes(searchVal));

    const matchesCat = !catVal || item.category === catVal;
    const matchesDept = !deptVal || item.department === deptVal;
    const matchesDate = !dateVal || item.date === dateVal;

    return matchesSearch && matchesCat && matchesDept && matchesDate;
  });

  // 2. Sort records
  result.sort((a, b) => {
    if (sortVal === "date-desc") {
      return b.date.localeCompare(a.date);
    } else if (sortVal === "date-asc") {
      return a.date.localeCompare(b.date);
    } else if (sortVal === "qty-desc") {
      return Number(b.quantity) - Number(a.quantity);
    } else if (sortVal === "qty-asc") {
      return Number(a.quantity) - Number(b.quantity);
    } else if (sortVal === "cost-desc") {
      return Number(b.estimatedCost) - Number(a.estimatedCost);
    } else if (sortVal === "cost-asc") {
      return Number(a.estimatedCost) - Number(b.estimatedCost);
    }
    return 0;
  });

  renderRecordsTable(result);
}

/**
 * Renders filtered and sorted records inside the records table.
 * @param {Array} displayRecords - Array of filtered records
 */
function renderRecordsTable(displayRecords) {
  const tbody = document.getElementById("records-tbody");
  const emptyBox = document.getElementById("table-empty-box");
  const counterLabel = document.getElementById("records-count-label");
  const summaryPill = document.getElementById("records-weight-cost-summary");

  if (!tbody) return;

  // Calculate totals for active filtered set
  let totalKg = 0;
  let totalCost = 0;
  for (let i = 0; i < displayRecords.length; i++) {
    totalKg += Number(displayRecords[i].quantity) || 0;
    totalCost += Number(displayRecords[i].estimatedCost) || 0;
  }

  if (counterLabel) {
    counterLabel.textContent = `Showing ${displayRecords.length} of ${wasteRecords.length} records`;
  }

  if (summaryPill) {
    summaryPill.textContent = `${totalKg.toFixed(1)} KG • ₹${totalCost.toLocaleString("en-IN")} Total`;
  }

  if (displayRecords.length === 0) {
    tbody.innerHTML = "";
    if (emptyBox) emptyBox.classList.remove("hidden");
    return;
  }

  if (emptyBox) emptyBox.classList.add("hidden");

  let html = "";
  for (let i = 0; i < displayRecords.length; i++) {
    const item = displayRecords[i];
    const cost = Number(item.estimatedCost) || 0;
    const notesText = item.notes ? item.notes : "—";

    html += `
      <tr>
        <td><code>#${item.id}</code></td>
        <td>${item.date}</td>
        <td><strong>${item.foodName}</strong></td>
        <td><span class="tag-badge ${getCategoryBadgeClass(item.category)}">${item.category}</span></td>
        <td><strong>${Number(item.quantity).toFixed(1)} KG</strong></td>
        <td><strong class="text-danger">₹${cost.toLocaleString("en-IN")}</strong></td>
        <td><span class="dept-pill">${item.department}</span></td>
        <td>${item.reason}</td>
        <td class="notes-cell" title="${escapeHtml(notesText)}">${escapeHtml(notesText)}</td>
        <td>
          <div class="action-btn-group">
            <button class="action-btn btn-edit" onclick="editRecord('${item.id}')">Edit</button>
            <button class="action-btn btn-delete" onclick="deleteRecord('${item.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

/**
 * Clears search and filter controls back to default.
 */
function clearFilters() {
  document.getElementById("search-input").value = "";
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-dept").value = "";
  document.getElementById("filter-date").value = "";
  document.getElementById("sort-records").value = "date-desc";
  applyFilters();
}

/**
 * Returns CSS category badge class.
 */
function getCategoryBadgeClass(category) {
  switch (category) {
    case "Vegetables": return "tag-vegetables";
    case "Fruits": return "tag-fruits";
    case "Dairy Products": return "tag-dairy";
    case "Meat": return "tag-meat";
    case "Grains": return "tag-grains";
    case "Prepared Food": return "tag-prepared";
    default: return "tag-others";
  }
}

/**
 * Helper to escape HTML and prevent basic XSS in injected strings.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ----------------------------------------------------------------------------
// 9. MODULE 4: ANALYTICS AND REPORTS
// ----------------------------------------------------------------------------

/**
 * Renders comprehensive reports and charts in the Analytics module.
 */
function renderAnalytics() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

  if (wasteRecords.length === 0) {
    document.getElementById("analytics-total-kg").textContent = "0.0 KG";
    document.getElementById("analytics-total-loss").textContent = "₹0";
    document.getElementById("analytics-avg-cost").textContent = "₹0 / KG";
    return;
  }

  let totalKg = 0;
  let totalCost = 0;
  const categoryKg = {};
  const categoryCost = {};
  const deptKg = {};
  const reasonKg = {};
  const dateKg = {};

  for (let i = 0; i < wasteRecords.length; i++) {
    const item = wasteRecords[i];
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.estimatedCost) || 0;

    totalKg += qty;
    totalCost += cost;

    categoryKg[item.category] = (categoryKg[item.category] || 0) + qty;
    categoryCost[item.category] = (categoryCost[item.category] || 0) + cost;

    deptKg[item.department] = (deptKg[item.department] || 0) + qty;
    reasonKg[item.reason] = (reasonKg[item.reason] || 0) + qty;
    dateKg[item.date] = (dateKg[item.date] || 0) + qty;
  }

  // Update Summary Strip
  const avgCostPerKg = totalKg > 0 ? Math.round(totalCost / totalKg) : 0;
  document.getElementById("analytics-total-kg").textContent = `${totalKg.toFixed(1)} KG`;
  document.getElementById("analytics-total-loss").textContent = `₹${totalCost.toLocaleString("en-IN")}`;
  document.getElementById("analytics-avg-cost").textContent = `₹${avgCostPerKg} / KG`;
  document.getElementById("analytics-time-span").textContent = `${Object.keys(dateKg).length} Active Dates`;

  const palette = ["#2d6a4f", "#52b788", "#f4a261", "#e76f51", "#457b9d", "#7209b7", "#3f37c9"];

  // Chart 1: Category Analysis (Bar with KG and Cost)
  const catKeys = Object.keys(categoryKg);
  createSafeChart("chart-analytics-category", {
    type: "bar",
    data: {
      labels: catKeys,
      datasets: [
        {
          label: "Waste (KG)",
          data: catKeys.map(k => Math.round(categoryKg[k] * 10) / 10),
          backgroundColor: "#2d6a4f",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });
  renderGenericBarChart("analytics-category-bars", categoryKg, "KG");

  // Chart 2: Department-wise Waste Analysis
  const deptKeys = Object.keys(deptKg);
  createSafeChart("chart-analytics-dept", {
    type: "bar",
    data: {
      labels: deptKeys,
      datasets: [{
        label: "Department Waste (KG)",
        data: deptKeys.map(k => Math.round(deptKg[k] * 10) / 10),
        backgroundColor: "#52b788",
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });
  renderGenericBarChart("analytics-dept-bars", deptKg, "KG");

  // Chart 3: Reason-wise Waste Analysis (Doughnut)
  const reasonKeys = Object.keys(reasonKg);
  createSafeChart("chart-analytics-reason", {
    type: "doughnut",
    data: {
      labels: reasonKeys,
      datasets: [{
        data: reasonKeys.map(k => Math.round(reasonKg[k] * 10) / 10),
        backgroundColor: palette.slice(0, reasonKeys.length),
        borderWidth: 2,
        borderColor: isDark ? "#1e293b" : "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { color: textColor, font: { size: 10 } } } }
    }
  });
  renderGenericBarChart("analytics-reason-bars", reasonKg, "KG");

  // Chart 4: Timeline Daily/Weekly Comparison
  const dateKeys = Object.keys(dateKg).sort();
  createSafeChart("chart-analytics-trend", {
    type: "line",
    data: {
      labels: dateKeys,
      datasets: [{
        label: "Waste (KG)",
        data: dateKeys.map(d => Math.round(dateKg[d] * 10) / 10),
        borderColor: "#f4a261",
        backgroundColor: "rgba(244, 162, 97, 0.2)",
        fill: true,
        tension: 0.35,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });
  renderGenericBarChart("analytics-trend-bars", dateKg, "KG", true);
}

/**
 * Reusable helper generating pure HTML/CSS horizontal bars.
 */
function renderGenericBarChart(containerId, dataMap, unit, isDate = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const keys = Object.keys(dataMap);
  if (keys.length === 0) {
    container.innerHTML = "<p class='stat-desc'>No data available.</p>";
    return;
  }

  if (isDate) {
    keys.sort();
  } else {
    keys.sort((a, b) => dataMap[b] - dataMap[a]);
  }

  let maxVal = 0;
  for (let i = 0; i < keys.length; i++) {
    if (dataMap[keys[i]] > maxVal) maxVal = dataMap[keys[i]];
  }

  let html = "";
  for (let i = 0; i < keys.length; i++) {
    const label = keys[i];
    const val = dataMap[label];
    const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;

    html += `
      <div class="chart-bar-item">
        <div class="chart-bar-info">
          <span class="chart-bar-name">${label}</span>
          <span class="chart-bar-stat">${val.toFixed(1)} ${unit} (${pct}%)</span>
        </div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill fill-color-${(i % 7) + 1}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ----------------------------------------------------------------------------
// 10. MODULE 5: RULE-BASED WASTE REDUCTION RECOMMENDATIONS
// ----------------------------------------------------------------------------

/**
 * Analyzes waste records using rule-based JavaScript logic
 * and dynamically outputs actionable recommendations.
 */
function renderSuggestions() {
  const container = document.getElementById("suggestions-container");
  if (!container) return;

  if (wasteRecords.length === 0) {
    container.innerHTML = `
      <div class="card p-20 col-span-2">
        <p>No records found. Please add waste records to view targeted reduction recommendations.</p>
      </div>
    `;
    return;
  }

  // Calculate aggregates
  let totalKg = 0;
  let totalCost = 0;
  const catTotals = {};
  const reasonTotals = {};
  const deptTotals = {};

  for (let i = 0; i < wasteRecords.length; i++) {
    const item = wasteRecords[i];
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.estimatedCost) || 0;

    totalKg += qty;
    totalCost += cost;

    catTotals[item.category] = (catTotals[item.category] || 0) + qty;
    reasonTotals[item.reason] = (reasonTotals[item.reason] || 0) + qty;
    deptTotals[item.department] = (deptTotals[item.department] || 0) + qty;
  }

  const recommendations = [];

  // RULE 1: Highest Waste Category Recommendation
  let maxCat = "";
  let maxCatKg = 0;
  for (const cat in catTotals) {
    if (catTotals[cat] > maxCatKg) {
      maxCatKg = catTotals[cat];
      maxCat = cat;
    }
  }

  const catShare = totalKg > 0 ? Math.round((maxCatKg / totalKg) * 100) : 0;

  if (maxCat === "Vegetables") {
    recommendations.push({
      priority: "high",
      tag: "Category Focus: Vegetables",
      stat: `Vegetables generate ${maxCatKg.toFixed(1)} KG (${catShare}% of all waste)`,
      title: "Improve Purchasing Frequency & Walk-in Storage Management",
      action: "Avoid buying perishable vegetables in bulk weekly orders. Transition to 2-day deliveries. Maintain walk-in cooler humidity at 85%–90% and temperature between 2°C and 4°C to double vegetable shelf life.",
      savings: "~₹2,800/mo estimated saving"
    });
  } else if (maxCat === "Dairy Products") {
    recommendations.push({
      priority: "high",
      tag: "Category Focus: Dairy Products",
      stat: `Dairy items account for ${maxCatKg.toFixed(1)} KG (${catShare}% of waste)`,
      title: "Enforce Strict FIFO (First-In, First-Out) & Expiry Color Stickers",
      action: "Dairy represents high value per kilogram. Label all cream, milk, and paneer deliveries with day-dot colored expiry stickers. Mandate that prep cooks use oldest opened batches first.",
      savings: "~₹3,500/mo estimated saving"
    });
  } else if (maxCat === "Meat") {
    recommendations.push({
      priority: "high",
      tag: "Category Focus: Meat & Poultry",
      stat: `Meat accounts for ${maxCatKg.toFixed(1)} KG (${catShare}% of waste)`,
      title: "Standardize Butchery Yields & Vacuum-Sealed Freezer Storage",
      action: "Proteins contribute heavily to overall restaurant food cost. Implement exact portion scales at butcher stations and seal cut steaks and fillets in vacuum packs before freezing.",
      savings: "~₹4,500/mo estimated saving"
    });
  } else if (maxCat === "Prepared Food") {
    recommendations.push({
      priority: "high",
      tag: "Category Focus: Prepared Food",
      stat: `Prepared Food accounts for ${maxCatKg.toFixed(1)} KG (${catShare}% of waste)`,
      title: "Optimize Cooking Batch Sizes & Use Shallow Buffet Inserts",
      action: "Replace large 5-litre deep pans with shallow 2-litre pans during off-peak hours. Cook sauces and side dishes on-demand rather than pre-making massive evening batches.",
      savings: "~₹3,200/mo estimated saving"
    });
  }

  // RULE 2: Most Frequent Waste Reason Recommendation
  let maxReason = "";
  let maxReasonKg = 0;
  for (const r in reasonTotals) {
    if (reasonTotals[r] > maxReasonKg) {
      maxReasonKg = reasonTotals[r];
      maxReason = r;
    }
  }

  if (maxReason === "Overproduction") {
    recommendations.push({
      priority: "high",
      tag: "Root Cause: Overproduction",
      stat: `Overproduction causes ${maxReasonKg.toFixed(1)} KG of discarded food`,
      title: "Implement Daily Customer Footfall & Demand Forecasting",
      action: "Cross-reference kitchen prep levels against billing receipts from the past two weeks. Adjust baseline batches of gravies, soups, and rice for weekdays versus weekend rushes.",
      savings: "~₹3,800/mo estimated saving"
    });
  } else if (maxReason === "Spoilage") {
    recommendations.push({
      priority: "high",
      tag: "Root Cause: Spoilage",
      stat: `Spoilage causes ${maxReasonKg.toFixed(1)} KG of lost inventory`,
      title: "Audit Cold-Chain Temperature Logs & Supplier Delivery Quality",
      action: "Log walk-in refrigerator and freezer temperatures twice daily. Reject any perishable deliveries arriving above 5°C from vendors.",
      savings: "~₹2,500/mo estimated saving"
    });
  } else if (maxReason === "Incorrect Preparation") {
    recommendations.push({
      priority: "med",
      tag: "Root Cause: Kitchen Prep Errors",
      stat: `Preparation mistakes caused ${maxReasonKg.toFixed(1)} KG of food loss`,
      title: "Mount Standardized Recipe & Cooking Station Checklists",
      action: "Display laminated recipe cheat-sheets at cook stations specifying exact weights, cooking times, and seasoning proportions to prevent burnt or mis-seasoned dishes.",
      savings: "~₹2,100/mo estimated saving"
    });
  } else if (maxReason === "Unsold Food") {
    recommendations.push({
      priority: "med",
      tag: "Root Cause: Unsold Food",
      stat: `Unsold food accounts for ${maxReasonKg.toFixed(1)} KG of waste`,
      title: "Launch End-of-Day 'Happy Hour' or Community Food Rescue",
      action: "Offer a 40% discount on fresh bakery goods during the final hour of operation, or partner with local food relief NGOs to safely donate wholesome surplus meals.",
      savings: "~₹1,800/mo estimated saving"
    });
  } else if (maxReason === "Customer Leftovers") {
    recommendations.push({
      priority: "med",
      tag: "Root Cause: Plate Waste",
      stat: `Customer leftovers account for ${maxReasonKg.toFixed(1)} KG`,
      title: "Audit Side Dish Portions & Offer Flexible Serving Sizes",
      action: "If customers consistently leave carbohydrate sides (fries, bread, rice), reduce standard side portions by 15% and offer complimentary refills upon request.",
      savings: "~₹2,200/mo estimated saving"
    });
  }

  // RULE 3: Highest Waste Department Recommendation
  let maxDept = "";
  let maxDeptKg = 0;
  for (const dept in deptTotals) {
    if (deptTotals[dept] > maxDeptKg) {
      maxDeptKg = deptTotals[dept];
      maxDept = dept;
    }
  }

  if (maxDept === "Kitchen") {
    recommendations.push({
      priority: "med",
      tag: "Station Focus: Main Kitchen",
      stat: `Kitchen generates ${maxDeptKg.toFixed(1)} KG (${Math.round((maxDeptKg/totalKg)*100)}% of waste)`,
      title: "Institute Transparent End-of-Shift Waste Bin Audits",
      action: "Keep a transparent bin at prep counters. Before emptying, the Head Chef inspects trimmings to coach junior line cooks on root-to-stem vegetable peeling.",
      savings: "~₹2,000/mo estimated saving"
    });
  } else if (maxDept === "Bakery") {
    recommendations.push({
      priority: "low",
      tag: "Station Focus: Bakery Section",
      stat: `Bakery accounts for ${maxDeptKg.toFixed(1)} KG of food loss`,
      title: "Calibrate Morning Baking Batch Sizes Against Historical Sales",
      action: "Limit specialty loaf and croissant morning bake quantities to 85% of projected demand; supplement with quick-bake frozen par-baked stock if demand spikes.",
      savings: "~₹1,500/mo estimated saving"
    });
  } else if (maxDept === "Storage") {
    recommendations.push({
      priority: "med",
      tag: "Station Focus: Storage & Cold Rooms",
      stat: `Storage accounts for ${maxDeptKg.toFixed(1)} KG of waste`,
      title: "Implement Color-Coded Storage Bins and Minimum Stock Alerts",
      action: "Group perishables in clear labeled bins with maximum restock thresholds to avoid purchasing new stock while existing inventory remains unused.",
      savings: "~₹2,400/mo estimated saving"
    });
  }

  // Render suggestion cards
  let html = "";
  for (let i = 0; i < recommendations.length; i++) {
    const r = recommendations[i];
    const priorityClass = r.priority === "high" ? "tag-high" : (r.priority === "med" ? "tag-med" : "tag-low");

    html += `
      <div class="suggestion-card">
        <div class="suggestion-header">
          <span class="suggestion-tag ${priorityClass}">${r.priority} Priority</span>
          <span class="stat-desc">${r.tag}</span>
        </div>
        <h4 class="suggestion-title">${r.title}</h4>
        <div class="suggestion-meta-row">
          <div class="suggestion-stat">${r.stat}</div>
          <div class="suggestion-savings">${r.savings}</div>
        </div>
        <p class="suggestion-action">${r.action}</p>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ----------------------------------------------------------------------------
// 11. MODULE 6: FINANCIAL COST ANALYSIS
// ----------------------------------------------------------------------------

/**
 * Calculates and displays financial loss metrics, category/department breakdowns,
 * and cost savings simulation scenarios.
 */
function renderCostAnalysis() {
  let totalCost = 0;
  let totalKg = 0;
  const categoryCost = {};
  const categoryKg = {};
  const deptCost = {};
  const deptKg = {};
  const dates = new Set();

  for (let i = 0; i < wasteRecords.length; i++) {
    const item = wasteRecords[i];
    const cost = Number(item.estimatedCost) || 0;
    const qty = Number(item.quantity) || 0;

    totalCost += cost;
    totalKg += qty;

    categoryCost[item.category] = (categoryCost[item.category] || 0) + cost;
    categoryKg[item.category] = (categoryKg[item.category] || 0) + qty;

    deptCost[item.department] = (deptCost[item.department] || 0) + cost;
    deptKg[item.department] = (deptKg[item.department] || 0) + qty;

    if (item.date) dates.add(item.date);
  }

  // Highest loss category
  let topCostCat = "None";
  let topCatCostAmount = 0;
  for (const cat in categoryCost) {
    if (categoryCost[cat] > topCatCostAmount) {
      topCatCostAmount = categoryCost[cat];
      topCostCat = cat;
    }
  }

  // Highest loss department
  let topCostDept = "None";
  let topDeptCostAmount = 0;
  for (const dept in deptCost) {
    if (deptCost[dept] > topDeptCostAmount) {
      topDeptCostAmount = deptCost[dept];
      topCostDept = dept;
    }
  }

  // Monthly Run-rate projection based on unique dates logged
  const distinctDays = Math.max(dates.size, 1);
  const costPerDay = totalCost / distinctDays;
  const projectedMonthly = Math.round(costPerDay * 30);
  const projectedAnnual = projectedMonthly * 12;

  // Update KPI values in DOM
  document.getElementById("cost-total-amount").textContent = `₹${totalCost.toLocaleString("en-IN")}`;
  document.getElementById("cost-top-category-name").textContent = topCostCat;
  document.getElementById("cost-top-category-amount").textContent = `₹${topCatCostAmount.toLocaleString("en-IN")} loss`;
  document.getElementById("cost-top-dept-name").textContent = topCostDept;
  document.getElementById("cost-top-dept-amount").textContent = `₹${topDeptCostAmount.toLocaleString("en-IN")} loss`;
  document.getElementById("cost-monthly-runrate").textContent = `₹${projectedMonthly.toLocaleString("en-IN")} / mo`;

  // Render Category Cost Breakdown Table
  const catTbody = document.getElementById("cost-category-tbody");
  if (catTbody) {
    const sortedCats = Object.keys(categoryCost).sort((a, b) => categoryCost[b] - categoryCost[a]);
    let catHtml = "";

    for (let i = 0; i < sortedCats.length; i++) {
      const cat = sortedCats[i];
      const cost = categoryCost[cat];
      const kg = categoryKg[cat] || 0;
      const pct = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0;

      catHtml += `
        <tr>
          <td><span class="tag-badge ${getCategoryBadgeClass(cat)}">${cat}</span></td>
          <td>${kg.toFixed(1)} KG</td>
          <td><strong class="text-danger">₹${cost.toLocaleString("en-IN")}</strong></td>
          <td>${pct}%</td>
        </tr>
      `;
    }
    catTbody.innerHTML = catHtml || `<tr><td colspan="4" style="text-align:center;">No data available</td></tr>`;
  }

  // Render Department Cost Breakdown Table
  const deptTbody = document.getElementById("cost-dept-tbody");
  if (deptTbody) {
    const sortedDepts = Object.keys(deptCost).sort((a, b) => deptCost[b] - deptCost[a]);
    let deptHtml = "";

    for (let i = 0; i < sortedDepts.length; i++) {
      const dept = sortedDepts[i];
      const cost = deptCost[dept];
      const kg = deptKg[dept] || 0;
      const pct = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0;

      deptHtml += `
        <tr>
          <td><span class="dept-pill">${dept}</span></td>
          <td>${kg.toFixed(1)} KG</td>
          <td><strong class="text-danger">₹${cost.toLocaleString("en-IN")}</strong></td>
          <td>${pct}%</td>
        </tr>
      `;
    }
    deptTbody.innerHTML = deptHtml || `<tr><td colspan="4" style="text-align:center;">No data available</td></tr>`;
  }

  // Savings simulation scenarios (Annual projections)
  const savings15 = Math.round(projectedAnnual * 0.15);
  const savings25 = Math.round(projectedAnnual * 0.25);
  const savings40 = Math.round(projectedAnnual * 0.40);

  document.getElementById("savings-15").textContent = `₹${savings15.toLocaleString("en-IN")} / year`;
  document.getElementById("savings-25").textContent = `₹${savings25.toLocaleString("en-IN")} / year`;
  document.getElementById("savings-40").textContent = `₹${savings40.toLocaleString("en-IN")} / year`;
}

// ----------------------------------------------------------------------------
// 12. CSV EXPORT & DEMO DATA RESET
// ----------------------------------------------------------------------------

/**
 * Exports current waste records to a standard CSV file using Vanilla JavaScript.
 */
function exportRecordsToCSV() {
  if (wasteRecords.length === 0) {
    showToast("No records available to export.", "info");
    return;
  }

  // CSV Headers
  const headers = [
    "Record ID",
    "Date",
    "Food Item Name",
    "Category",
    "Quantity (KG)",
    "Estimated Cost (INR)",
    "Department",
    "Waste Reason",
    "Additional Notes"
  ];

  const csvRows = [];
  csvRows.push(headers.join(","));

  for (let i = 0; i < wasteRecords.length; i++) {
    const r = wasteRecords[i];
    const row = [
      `"${r.id}"`,
      `"${r.date}"`,
      `"${(r.foodName || "").replace(/"/g, '""')}"`,
      `"${r.category}"`,
      r.quantity,
      r.estimatedCost,
      `"${r.department}"`,
      `"${r.reason}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(","));
  }

  const csvContent = "\uFEFF" + csvRows.join("\n"); // Add UTF-8 BOM
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `restaurant_food_waste_records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast("CSV file downloaded successfully!", "success");
}

/**
 * Prompts user confirmation to reset data back to initial 12 sample records.
 */
function confirmResetDemoData() {
  openConfirmModal(
    "Reset Demo Data",
    "Are you sure you want to restore the original 12 sample records? Any custom entries will be replaced.",
    () => {
      wasteRecords = [...SAMPLE_RECORDS];
      saveRecords();
      showToast("Demo data successfully restored!", "success");

      // Refresh views
      updateDashboard();
      applyFilters();
      renderAnalytics();
      renderCostAnalysis();
      renderSuggestions();
    }
  );
}

// ----------------------------------------------------------------------------
// 13. TOAST NOTIFICATIONS & MODAL CONTROLS
// ----------------------------------------------------------------------------

/**
 * Displays a lightweight toast notification in the top right corner.
 * @param {string} message - Text to show
 * @param {string} type - "success" | "danger" | "info"
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "danger") icon = "⚠️";

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  // Auto-remove after 3.5 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

/**
 * Opens the styled confirmation modal dialog.
 * @param {string} title - Modal heading
 * @param {string} message - Explanatory message
 * @param {Function} onConfirm - Callback if user clicks Confirm
 */
function openConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById("confirm-modal");
  const titleEl = document.getElementById("modal-title");
  const msgEl = document.getElementById("modal-message");
  const confirmBtn = document.getElementById("modal-confirm-btn");

  if (!modal) {
    if (confirm(message)) onConfirm();
    return;
  }

  titleEl.textContent = title;
  msgEl.textContent = message;
  modalConfirmCallback = onConfirm;

  confirmBtn.onclick = function() {
    closeModal();
    if (modalConfirmCallback) modalConfirmCallback();
  };

  modal.classList.remove("hidden");
}

/**
 * Closes the confirmation modal.
 */
function closeModal() {
  const modal = document.getElementById("confirm-modal");
  if (modal) modal.classList.add("hidden");
  modalConfirmCallback = null;
}

// ----------------------------------------------------------------------------
// 14. INITIALIZATION ON WINDOW LOAD
// ----------------------------------------------------------------------------
window.onload = function() {
  // 1. Initialize light/dark theme
  initTheme();

  // 2. Set current date
  initDate();

  // 3. Load records from LocalStorage or seed defaults
  loadRecords();

  // 4. Populate dashboard metrics, KPI cards and charts
  updateDashboard();

  // 5. Populate records table
  applyFilters();
};
