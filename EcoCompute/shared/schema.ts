import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: text("product_id"),
  title: text("title").notNull(),
  text: text("text"), // review text
  ecoScore: decimal("eco_score", { precision: 8, scale: 2 }),
  ageTarget: text("age_target"),
  genderTarget: text("gender_target"),
  category: text("category"),
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
});

export const cart = pgTable("cart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

export const wishlist = pgTable("wishlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
});

export const viewedProducts = pgTable("viewed_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cart: many(cart),
  wishlist: many(wishlist),
  viewedProducts: many(viewedProducts),
}));

export const productsRelations = relations(products, ({ many }) => ({
  cart: many(cart),
  wishlist: many(wishlist),
  viewedProducts: many(viewedProducts),
}));

export const cartRelations = relations(cart, ({ one }) => ({
  user: one(users, { fields: [cart.userId], references: [users.id] }),
  product: one(products, { fields: [cart.productId], references: [products.id] }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, { fields: [wishlist.userId], references: [users.id] }),
  product: one(products, { fields: [wishlist.productId], references: [products.id] }),
}));

export const viewedProductsRelations = relations(viewedProducts, ({ one }) => ({
  user: one(users, { fields: [viewedProducts.userId], references: [users.id] }),
  product: one(products, { fields: [viewedProducts.productId], references: [products.id] }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertCartSchema = createInsertSchema(cart).omit({
  id: true,
  addedAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlist).omit({
  id: true,
  addedAt: true,
});

export const insertViewedProductSchema = createInsertSchema(viewedProducts).omit({
  id: true,
  viewedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Cart = typeof cart.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type Wishlist = typeof wishlist.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type ViewedProduct = typeof viewedProducts.$inferSelect;
export type InsertViewedProduct = z.infer<typeof insertViewedProductSchema>;
