import { fetchProducts, addProduct, deleteProduct } from "./api.js";

let products = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 6;

const productGrid = document.getElementById("productGrid");
const spinner = document.getElementById("spinner");
const errorMsg = document.getElementById("error-msg");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

const cartCount = document.getElementById("cartCount");

// ---------------- CART SYSTEM ----------------
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  cartCount.textContent = cart.length;
}

function addToCart(product) {
  const cart = getCart();
  cart.push(product);
  saveCart(cart);
}

// ---------------- UI STATES ----------------
function showSpinner(show) {
  spinner.classList.toggle("hidden", !show);
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.classList.add("hidden");
}

// ---------------- RENDER PRODUCTS ----------------
function renderProducts(list) {
  productGrid.innerHTML = "";

  if (list.length === 0) {
    productGrid.innerHTML = "<h2>No products found.</h2>";
    return;
  }

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  const pageItems = list.slice(start, end);

  pageItems.forEach((product) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p><b>₹${product.price}</b></p>
      <p>${product.category}</p>
      <button class="addCartBtn">Add to Cart</button>
      <button class="deleteBtn">Delete</button>
    `;

    card.querySelector(".addCartBtn").addEventListener("click", () => {
      addToCart(product);
    });

    card.querySelector(".deleteBtn").addEventListener("click", async () => {
      await handleDelete(product.id);
    });

    productGrid.appendChild(card);
  });

  pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(list.length / itemsPerPage)}`;
}

// ---------------- FILTER + SORT ----------------
function applyFilters() {
  const searchText = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const sortValue = sortSelect.value;

  filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchText);
    const matchesCategory = category === "all" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  if (sortValue === "priceLow") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortValue === "priceHigh") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortValue === "titleAZ") {
    filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortValue === "titleZA") {
    filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
  }

  currentPage = 1;
  renderProducts(filteredProducts);
}

// ---------------- LOAD PRODUCTS (GET) ----------------
async function loadProducts() {
  showSpinner(true);
  hideError();

  try {
    products = await fetchProducts();
    filteredProducts = [...products];

    loadCategories(products);

    renderProducts(filteredProducts);
  } catch (err) {
    console.error(err);
    showError("Unable to load products. Please try again later.");
  } finally {
    showSpinner(false);
  }
}

// ---------------- LOAD CATEGORY DROPDOWN ----------------
function loadCategories(productsList) {
  const categories = ["all", ...new Set(productsList.map((p) => p.category))];

  categoryFilter.innerHTML = "";
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.toUpperCase();
    categoryFilter.appendChild(option);
  });
}

// ---------------- DELETE PRODUCT ----------------
async function handleDelete(id) {
  const confirmDelete = confirm("Remove this product?");
  if (!confirmDelete) return;

  try {
    await deleteProduct(id);

    products = products.filter((p) => p.id !== id);
    applyFilters();
  } catch (err) {
    console.error(err);
    alert("Delete failed. Please try again.");
  }
}

// ---------------- ADD PRODUCT (POST) ----------------
document.getElementById("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newProduct = {
    title: document.getElementById("title").value,
    price: parseFloat(document.getElementById("price").value),
    category: document.getElementById("category").value,
    image: "https://via.placeholder.com/150",
    description: "New Product Added",
  };

  try {
    const created = await addProduct(newProduct);

    products.unshift(created);
    applyFilters();

    e.target.reset();
    alert("Product Added Successfully!");
  } catch (err) {
    console.error(err);
    alert("Could not add product. Check your connection.");
  }
});

// ---------------- PAGINATION ----------------
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderProducts(filteredProducts);
  }
});

nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderProducts(filteredProducts);
  }
});

// ---------------- EVENT LISTENERS ----------------
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

// ---------------- START ----------------
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  loadProducts();
});
