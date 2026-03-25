export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  name: string;
  nameHi?: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
  harvestDate: string;
  location: Location;
  category: "vegetables" | "fruits" | "grains" | "dairy" | "spices" | "other";
  createdAt: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
  totalPrice: number;
  status: "pending" | "accepted" | "rejected" | "delivered";
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: "farmer" | "buyer";
  phone: string;
  location?: Location;
}

export interface Review {
  id: string;
  farmerId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
