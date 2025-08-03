
import { db } from "../server/db";
import { products } from "../shared/schema";
import { count } from "drizzle-orm";

async function countProducts() {
  try {
    console.log("Counting products in database...");
    
    const result = await db
      .select({ count: count() })
      .from(products);
    
    const productCount = result[0].count;
    console.log(`Total products in database: ${productCount}`);
    
    return productCount;
  } catch (error) {
    console.error("Error counting products:", error);
  }
}

countProducts().then(() => {
  console.log("Count completed");
  process.exit(0);
}).catch((error) => {
  console.error("Count failed:", error);
  process.exit(1);
});
