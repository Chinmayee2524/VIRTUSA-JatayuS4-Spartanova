import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/product-card";
import SearchBar from "@/components/search-bar";
import UserProfile from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf } from "lucide-react";
import type { User, Product, Cart, Wishlist } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ecoScoreFilter, setEcoScoreFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  const { data: authData, isLoading: authLoading } = useQuery<{user: User}>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = authData?.user;

  const searchTerm = searchQuery;

  // Get products (search or recommendations)
  const { data: productsData, isLoading: productsLoading } = useQuery<{products: Product[]}>({
    queryKey: ["products", searchTerm, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
      params.set("limit", "20");

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: true,
  });

  // Get personalized recommendations for logged-in users
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery<{products: Product[]}>({
    queryKey: [`/api/products/recommendations?limit=20`],
    enabled: !!user && !searchQuery,
  });

  // Get cart and wishlist for user
  const { data: cartData } = useQuery<{cartItems: (Cart & {product: Product})[]}>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const { data: wishlistData } = useQuery<{wishlistItems: (Wishlist & {product: Product})[]}>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("POST", "/api/cart", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart!", description: "Product has been added to your cart." });
    },
    onError: (error: any) => {
      if (error.message.includes("401")) {
        navigate("/auth");
      } else {
        toast({ title: "Error", description: "Failed to add to cart", variant: "destructive" });
      }
    },
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("POST", "/api/wishlist", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: "Added to wishlist!", description: "Product has been added to your wishlist." });
    },
    onError: (error: any) => {
      if (error.message.includes("401")) {
        navigate("/auth");
      } else {
        toast({ title: "Error", description: "Failed to add to wishlist", variant: "destructive" });
      }
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("DELETE", `/api/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: "Removed from wishlist", description: "Product has been removed from your wishlist." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove from wishlist", variant: "destructive" });
    },
  });

  // For new users, show general products with demographic suggestions
  const products = user && !searchQuery
    ? recommendationsData?.products || []  // Personalized for logged-in users
    : productsData?.products || [];        // General products for new users or search results

  const cartItems = cartData?.cartItems || [];
  const wishlistItems = wishlistData?.wishlistItems || [];
  const cartCount = cartItems.length;
  const wishlistCount = wishlistItems.length;

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item: any) => item.product.id === productId);
  };

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate(productId);
  };

  const handleToggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Leaf className="text-primary-600 text-2xl mr-2" />
              <h1 className="text-xl font-bold text-gray-900">EcoChoice</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <SearchBar onSearch={setSearchQuery} />
            </div>

            {/* User Profile */}
            <UserProfile 
              user={user} 
              cartCount={cartCount} 
              wishlistCount={wishlistCount}
              onLoginRequired={() => navigate("/auth")}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        {user && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary-600 to-sage-500 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
              <p className="text-primary-100">Discover eco-friendly products tailored just for you. Your choices make a difference! 🌱</p>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Home & Garden">Home & Garden</SelectItem>
              <SelectItem value="Personal Care">Personal Care</SelectItem>
              <SelectItem value="Clothing">Clothing</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ecoScoreFilter} onValueChange={setEcoScoreFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Eco Score: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Eco Score: All</SelectItem>
              <SelectItem value="high">Eco Score: High (8.0+)</SelectItem>
              <SelectItem value="medium">Eco Score: Medium (6.0-7.9)</SelectItem>
              <SelectItem value="low">Eco Score: Low (Below 6.0)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recommendation Notice */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Leaf className="text-primary-600 mr-2" size={16} />
            <span className="text-primary-800 text-sm">
              {user && !searchQuery 
                ? "Personalized recommendations based on your profile and activity"
                : searchQuery 
                ? `Search results for "${searchQuery}"`
                : "Browse our eco-friendly product collection"
              }
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading || recommendationsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-16 bg-gray-300 rounded mb-3"></div>
                  <div className="flex justify-between">
                    <div className="h-6 w-16 bg-gray-300 rounded"></div>
                    <div className="h-8 w-24 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isInWishlist={isInWishlist(product.id)}
                  onAddToCart={() => handleAddToCart(product.id)}
                  onToggleWishlist={() => handleToggleWishlist(product.id)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {products.length >= 20 && (
              <div className="text-center mt-8">
                <Button 
                  onClick={loadMore}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Load More Products
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Leaf className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? "Try adjusting your search terms or filters."
                : "Check back later for new eco-friendly products."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}