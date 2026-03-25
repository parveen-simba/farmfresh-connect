import { Product, Order, User, Review } from "./types";

const PRODUCTS_KEY = "agrilink_products";
const ORDERS_KEY = "agrilink_orders";
const USERS_KEY = "agrilink_users";
const REVIEWS_KEY = "agrilink_reviews";
const CURRENT_USER_KEY = "agrilink_current_user";

// Seed data
const seedProducts: Product[] = [
  {
    id: "p1",
    farmerId: "farmer1",
    farmerName: "Rajesh Kumar",
    name: "Tomatoes",
    nameHi: "टमाटर",
    price: 20,
    quantity: 50,
    unit: "kg",
    image: "",
    harvestDate: "2026-03-23",
    location: { lat: 28.6139, lng: 77.209, address: "Najafgarh, Delhi" },
    category: "vegetables",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    farmerId: "farmer1",
    farmerName: "Rajesh Kumar",
    name: "Potatoes",
    nameHi: "आलू",
    price: 15,
    quantity: 100,
    unit: "kg",
    image: "",
    harvestDate: "2026-03-20",
    location: { lat: 28.6139, lng: 77.209, address: "Najafgarh, Delhi" },
    category: "vegetables",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p3",
    farmerId: "farmer2",
    farmerName: "Sunita Devi",
    name: "Fresh Milk",
    nameHi: "ताज़ा दूध",
    price: 60,
    quantity: 30,
    unit: "litre",
    image: "",
    harvestDate: "2026-03-25",
    location: { lat: 28.5355, lng: 77.391, address: "Noida, UP" },
    category: "dairy",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p4",
    farmerId: "farmer2",
    farmerName: "Sunita Devi",
    name: "Wheat",
    nameHi: "गेहूँ",
    price: 30,
    quantity: 200,
    unit: "kg",
    image: "",
    harvestDate: "2026-03-18",
    location: { lat: 28.5355, lng: 77.391, address: "Noida, UP" },
    category: "grains",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p5",
    farmerId: "farmer3",
    farmerName: "Harpreet Singh",
    name: "Basmati Rice",
    nameHi: "बासमती चावल",
    price: 80,
    quantity: 150,
    unit: "kg",
    image: "",
    harvestDate: "2026-03-15",
    location: { lat: 30.7333, lng: 76.7794, address: "Chandigarh, Punjab" },
    category: "grains",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p6",
    farmerId: "farmer3",
    farmerName: "Harpreet Singh",
    name: "Mangoes",
    nameHi: "आम",
    price: 100,
    quantity: 40,
    unit: "kg",
    image: "",
    harvestDate: "2026-03-22",
    location: { lat: 30.7333, lng: 76.7794, address: "Chandigarh, Punjab" },
    category: "fruits",
    createdAt: new Date().toISOString(),
  },
];

const seedUsers: User[] = [
  { id: "farmer1", name: "Rajesh Kumar", role: "farmer", phone: "9876543210", location: { lat: 28.6139, lng: 77.209, address: "Najafgarh, Delhi" } },
  { id: "farmer2", name: "Sunita Devi", role: "farmer", phone: "9876543211", location: { lat: 28.5355, lng: 77.391, address: "Noida, UP" } },
  { id: "farmer3", name: "Harpreet Singh", role: "farmer", phone: "9876543212", location: { lat: 30.7333, lng: 76.7794, address: "Chandigarh, Punjab" } },
];

function getOrSeed<T>(key: string, seed: T[]): T[] {
  const data = localStorage.getItem(key);
  if (data) return JSON.parse(data);
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Products
export function getProducts(): Product[] {
  return getOrSeed(PRODUCTS_KEY, seedProducts);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function getProductsByFarmer(farmerId: string): Product[] {
  return getProducts().filter((p) => p.farmerId === farmerId);
}

export function addProduct(product: Omit<Product, "id" | "createdAt">): Product {
  const products = getProducts();
  const newProduct: Product = { ...product, id: `p${Date.now()}`, createdAt: new Date().toISOString() };
  products.push(newProduct);
  save(PRODUCTS_KEY, products);
  return newProduct;
}

export function deleteProduct(id: string) {
  save(PRODUCTS_KEY, getProducts().filter((p) => p.id !== id));
}

// Orders
export function getOrders(): Order[] {
  return getOrSeed(ORDERS_KEY, []);
}

export function getOrdersByBuyer(buyerId: string): Order[] {
  return getOrders().filter((o) => o.buyerId === buyerId);
}

export function getOrdersByFarmer(farmerId: string): Order[] {
  return getOrders().filter((o) => o.farmerId === farmerId);
}

export function createOrder(order: Omit<Order, "id" | "createdAt" | "status">): Order {
  const orders = getOrders();
  const newOrder: Order = { ...order, id: `o${Date.now()}`, status: "pending", createdAt: new Date().toISOString() };
  orders.push(newOrder);
  save(ORDERS_KEY, orders);
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: Order["status"]) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = status;
    save(ORDERS_KEY, orders);
  }
}

// Users
export function getUsers(): User[] {
  return getOrSeed(USERS_KEY, seedUsers);
}

export function registerUser(user: Omit<User, "id">): User {
  const users = getUsers();
  const newUser: User = { ...user, id: `u${Date.now()}` };
  users.push(newUser);
  save(USERS_KEY, users);
  return newUser;
}

export function loginUser(phone: string, role: User["role"]): User | null {
  const user = getUsers().find((u) => u.phone === phone && u.role === role);
  if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user || null;
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: User) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Reviews
export function getReviews(): Review[] {
  return getOrSeed(REVIEWS_KEY, []);
}

export function getReviewsForFarmer(farmerId: string): Review[] {
  return getReviews().filter((r) => r.farmerId === farmerId);
}

export function addReview(review: Omit<Review, "id" | "createdAt">): Review {
  const reviews = getReviews();
  const newReview: Review = { ...review, id: `r${Date.now()}`, createdAt: new Date().toISOString() };
  reviews.push(newReview);
  save(REVIEWS_KEY, reviews);
  return newReview;
}

export function getAverageRating(farmerId: string): number {
  const reviews = getReviewsForFarmer(farmerId);
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
