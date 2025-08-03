import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertCartSchema, insertWishlistSchema, insertViewedProductSchema } from "@shared/schema";
import bcrypt from "bcryptjs";

// Extend express-session to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const PgSession = ConnectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    store: new PgSession({
      pool: pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const category = req.query.category as string;

      let products;
      if (search) {
        products = await storage.searchProducts(search, limit, offset, category);
      } else {
        products = await storage.getProducts(limit, offset, category);
      }

      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get demographic-based products for new users
  app.get("/api/products/demographic", async (req, res) => {
    try {
      const age = parseInt(req.query.age as string);
      const gender = req.query.gender as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!age || !gender) {
        return res.status(400).json({ message: "Age and gender are required" });
      }

      const products = await storage.getRecommendedProducts(age, gender, limit);
      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/recommendations", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const products = await storage.getRecommendedProducts(user.age, user.gender, limit);

      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json({ categories });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Track viewed product if user is logged in
      if (req.session.userId) {
        await storage.addViewedProduct({
          userId: req.session.userId,
          productId: product.id,
        });
      }

      res.json({ product });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cart routes
  app.get("/api/cart", requireAuth, async (req, res) => {
    try {
      const cartItems = await storage.getCartByUserId(req.session.userId);
      res.json({ cartItems });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cart", requireAuth, async (req, res) => {
    try {
      const cartData = insertCartSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const cartItem = await storage.addToCart(cartData);
      res.json({ cartItem });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:productId", requireAuth, async (req, res) => {
    try {
      await storage.removeFromCart(req.session.userId, req.params.productId);
      res.json({ message: "Item removed from cart" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/cart/:productId", requireAuth, async (req, res) => {
    try {
      const { quantity } = req.body;
      await storage.updateCartQuantity(req.session.userId, req.params.productId, quantity);
      res.json({ message: "Cart updated" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Wishlist routes
  app.get("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const wishlistItems = await storage.getWishlistByUserId(req.session.userId);
      res.json({ wishlistItems });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const wishlistData = insertWishlistSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const wishlistItem = await storage.addToWishlist(wishlistData);
      res.json({ wishlistItem });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/wishlist/:productId", requireAuth, async (req, res) => {
    try {
      await storage.removeFromWishlist(req.session.userId, req.params.productId);
      res.json({ message: "Item removed from wishlist" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Viewed products
  app.get("/api/viewed", requireAuth, async (req, res) => {
    try {
      const viewedProducts = await storage.getViewedProductsByUserId(req.session.userId);
      res.json({ viewedProducts });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
