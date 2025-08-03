import { 
  users, 
  products, 
  cart, 
  wishlist, 
  viewedProducts,
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type Cart,
  type InsertCart,
  type Wishlist,
  type InsertWishlist,
  type ViewedProduct,
  type InsertViewedProduct
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product methods
  getProducts(limit?: number, offset?: number, category?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getCategories(): Promise<string[]>;
  searchProducts(query: string, limit?: number, offset?: number, category?: string): Promise<Product[]>;
  getRecommendedProducts(age: number, gender: string, limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Cart methods
  getCartByUserId(userId: string): Promise<(Cart & { product: Product })[]>;
  addToCart(cartItem: InsertCart): Promise<Cart>;
  removeFromCart(userId: string, productId: string): Promise<void>;
  updateCartQuantity(userId: string, productId: string, quantity: number): Promise<void>;

  // Wishlist methods
  getWishlistByUserId(userId: string): Promise<(Wishlist & { product: Product })[]>;
  addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;

  // Viewed products methods
  getViewedProductsByUserId(userId: string): Promise<(ViewedProduct & { product: Product })[]>;
  addViewedProduct(viewedProduct: InsertViewedProduct): Promise<ViewedProduct>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProducts(limit = 20, offset = 0, category?: string): Promise<Product[]> {
    let query = db
      .select()
      .from(products);

    if (category && category !== "all") {
      query = query.where(eq(products.category, category));
    }

    return await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(products.ecoScore));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getCategories(): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .where(sql`${products.category} IS NOT NULL AND ${products.category} != ''`)
      .orderBy(products.category);
    
    return result.map(row => row.category);
  }

  async searchProducts(query: string, limit = 20, offset = 0, category?: string): Promise<Product[]> {
    let dbQuery = db
      .select()
      .from(products);

    const conditions = [
      or(
        ilike(products.title, `%${query}%`),
        ilike(products.text, `%${query}%`)
      )
    ];

    if (category && category !== "all") {
      conditions.push(eq(products.category, category));
    }

    dbQuery = dbQuery.where(and(...conditions));

    return await dbQuery
      .limit(limit)
      .offset(offset)
      .orderBy(desc(products.ecoScore));
  }

  async getRecommendedProducts(age: number, gender: string, limit = 20): Promise<Product[]> {
    // Age range matching logic
    const ageGroup = age < 25 ? "18-24" : age < 35 ? "25-34" : age < 45 ? "35-44" : age < 55 ? "45-54" : "55+";

    return await db
      .select()
      .from(products)
      .where(
        and(
          or(
            eq(products.ageTarget, ageGroup),
            ilike(products.ageTarget, `%${ageGroup}%`),
            sql`${products.ageTarget} IS NULL`
          ),
          or(
            eq(products.genderTarget, gender),
            ilike(products.genderTarget, `%${gender}%`),
            sql`${products.genderTarget} IS NULL`
          )
        )
      )
      .limit(limit)
      .orderBy(desc(products.ecoScore));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async getCartByUserId(userId: string): Promise<(Cart & { product: Product })[]> {
    return await db
      .select()
      .from(cart)
      .innerJoin(products, eq(cart.productId, products.id))
      .where(eq(cart.userId, userId))
      .then(rows => rows.map(row => ({ ...row.cart, product: row.products })));
  }

  async addToCart(cartItem: InsertCart): Promise<Cart> {
    // Check if item already exists in cart
    const existing = await db
      .select()
      .from(cart)
      .where(and(eq(cart.userId, cartItem.userId), eq(cart.productId, cartItem.productId)));

    if (existing.length > 0) {
      // Update quantity
      const [updated] = await db
        .update(cart)
        .set({ quantity: existing[0].quantity + (cartItem.quantity || 1) })
        .where(and(eq(cart.userId, cartItem.userId), eq(cart.productId, cartItem.productId)))
        .returning();
      return updated;
    } else {
      // Insert new item
      const [newItem] = await db
        .insert(cart)
        .values(cartItem)
        .returning();
      return newItem;
    }
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    await db
      .delete(cart)
      .where(and(eq(cart.userId, userId), eq(cart.productId, productId)));
  }

  async updateCartQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
    } else {
      await db
        .update(cart)
        .set({ quantity })
        .where(and(eq(cart.userId, userId), eq(cart.productId, productId)));
    }
  }

  async getWishlistByUserId(userId: string): Promise<(Wishlist & { product: Product })[]> {
    return await db
      .select()
      .from(wishlist)
      .innerJoin(products, eq(wishlist.productId, products.id))
      .where(eq(wishlist.userId, userId))
      .then(rows => rows.map(row => ({ ...row.wishlist, product: row.products })));
  }

  async addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist> {
    // Check if item already exists
    const existing = await db
      .select()
      .from(wishlist)
      .where(and(eq(wishlist.userId, wishlistItem.userId), eq(wishlist.productId, wishlistItem.productId)));

    if (existing.length > 0) {
      return existing[0];
    }

    const [newItem] = await db
      .insert(wishlist)
      .values(wishlistItem)
      .returning();
    return newItem;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db
      .delete(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
  }

  async getViewedProductsByUserId(userId: string): Promise<(ViewedProduct & { product: Product })[]> {
    return await db
      .select()
      .from(viewedProducts)
      .innerJoin(products, eq(viewedProducts.productId, products.id))
      .where(eq(viewedProducts.userId, userId))
      .orderBy(desc(viewedProducts.viewedAt))
      .then(rows => rows.map(row => ({ ...row.viewed_products, product: row.products })));
  }

  async addViewedProduct(viewedProduct: InsertViewedProduct): Promise<ViewedProduct> {
    // Remove existing entry for same user/product to avoid duplicates
    await db
      .delete(viewedProducts)
      .where(and(eq(viewedProducts.userId, viewedProduct.userId), eq(viewedProducts.productId, viewedProduct.productId)));

    const [newItem] = await db
      .insert(viewedProducts)
      .values(viewedProduct)
      .returning();
    return newItem;
  }
}

export const storage = new DatabaseStorage();