import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, ShoppingCart, Heart, LogOut, ChevronDown } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface UserProfileProps {
  user?: UserType;
  cartCount: number;
  wishlistCount: number;
  onLoginRequired: () => void;
}

export default function UserProfile({ 
  user, 
  cartCount, 
  wishlistCount, 
  onLoginRequired 
}: UserProfileProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      toast({ title: "Logged out", description: "You have been logged out successfully." });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log out", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline"
          onClick={onLoginRequired}
        >
          Sign In
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Cart and Wishlist for mobile/desktop */}
      <div className="hidden md:flex items-center space-x-6 text-sm">
        <button className="text-gray-600 hover:text-primary-600 transition flex items-center">
          <ShoppingCart className="h-4 w-4 mr-1" />
          <span>{cartCount}</span>
        </button>
        <button className="text-gray-600 hover:text-primary-600 transition flex items-center">
          <Heart className="h-4 w-4 mr-1" />
          <span>{wishlistCount}</span>
        </button>
      </div>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary-100 text-primary-600 text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block font-medium">{user.name}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="p-4 border-b border-gray-100">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex space-x-4 mt-2 text-xs text-gray-600">
              <span>Age: {user.age}</span>
              <span>Gender: {user.gender}</span>
            </div>
          </DropdownMenuLabel>

          <div className="p-2">
            <DropdownMenuItem className="flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2" />
              My Cart ({cartCount})
            </DropdownMenuItem>
            
            <DropdownMenuItem className="flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              My Wishlist ({wishlistCount})
            </DropdownMenuItem>
            
            <DropdownMenuItem className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="flex items-center text-red-600 focus:text-red-600"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
