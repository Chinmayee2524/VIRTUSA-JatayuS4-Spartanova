import { Heart, ShoppingCart, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  isInWishlist: boolean;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
}

export default function ProductCard({ 
  product, 
  isInWishlist, 
  onAddToCart, 
  onToggleWishlist 
}: ProductCardProps) {
  const getEcoScoreBadge = (score: number) => {
    if (score >= 8.0) {
      return { variant: "default" as const, className: "bg-green-100 text-green-800" };
    } else if (score >= 6.0) {
      return { variant: "secondary" as const, className: "bg-amber-100 text-amber-800" };
    } else {
      return { variant: "outline" as const, className: "bg-orange-100 text-orange-800" };
    }
  };

  const ecoScore = parseFloat(product.ecoScore || "0");
  const badgeProps = getEcoScoreBadge(ecoScore);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Product Image */}
      <div className="w-full h-48 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <Leaf className="h-16 w-16 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Eco Product</p>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
          <Badge {...badgeProps} className={`text-xs font-bold ${badgeProps.className}`}>
            <Leaf className="w-3 h-3 mr-1" />
            {ecoScore.toFixed(1)}
          </Badge>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
          {product.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
          {product.text || "Eco-friendly product with sustainable features."}
        </p>

        <div className="flex items-center justify-between">
          {product.price ? (
            <span className="text-lg font-bold text-gray-900">
              ${parseFloat(product.price).toFixed(2)}
            </span>
          ) : (
            <span className="text-sm text-gray-500">Price on request</span>
          )}

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={`p-2 ${isInWishlist ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'} transition`}
              onClick={onToggleWishlist}
            >
              <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </Button>

            <Button
              size="sm"
              className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition"
              onClick={onAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
