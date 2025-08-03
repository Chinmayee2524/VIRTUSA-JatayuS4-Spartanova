import { db } from "../server/db";
import { products } from "../shared/schema";
import fs from "fs";
import { parse } from "csv-parse/sync";

async function importProducts() {
  try {
    console.log("Reading CSV file...");
    
    // Read and decompress the CSV file
    const { execSync } = await import('child_process');
    
    // Use gunzip to decompress
    execSync("gunzip -c attached_assets/products_with_final_eco_scores_20250726_172344.csv_1753682562858.gz > temp_products.csv");
    const decompressedData = fs.readFileSync("temp_products.csv", "utf-8");
    
    console.log("Parsing CSV...");
    const records = parse(decompressedData, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} products to import`);

    // Process in batches of 100
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const productData = batch.map((record: any) => {
        // Extract first image URL if available
        let imageUrl = null;
        try {
          const images = JSON.parse(record.images?.replace(/'/g, '"') || '[]');
          if (images.length > 0 && images[0].large) {
            imageUrl = images[0].large;
          }
        } catch (e) {
          // Use fixed_image as fallback
          imageUrl = record.fixed_image || null;
        }

        // Extract price (convert cents to dollars)
        let price: string | null = null;
        if (record.price && !isNaN(parseFloat(record.price))) {
          price = (parseFloat(record.price) / 100).toFixed(2);
        }

        // Map age groups
        let ageTarget: string | null = null;
        const age = parseInt(record.age);
        if (!isNaN(age)) {
          if (age < 25) ageTarget = "18-24";
          else if (age < 35) ageTarget = "25-34";
          else if (age < 45) ageTarget = "35-44";
          else if (age < 55) ageTarget = "45-54";
          else ageTarget = "55+";
        }

        return {
          productId: record.asin || record.parent_asin,
          title: record.title?.slice(0, 500) || "Untitled Product",
          text: record.text?.slice(0, 1000) || null,
          ecoScore: record["eco-score"] ? parseFloat(record["eco-score"]).toFixed(2) : null,
          ageTarget,
          genderTarget: record.gender || null,
          category: record.main_category || null,
          price,
          imageUrl,
        };
      }).filter(p => p.title && p.productId); // Filter out invalid records

      if (productData.length > 0) {
        await db.insert(products).values(productData).onConflictDoNothing();
        imported += productData.length;
        console.log(`Imported ${imported}/${records.length} products`);
      }
    }

    // Clean up temp file
    fs.unlinkSync("temp_products.csv");
    
    console.log(`Successfully imported ${imported} products!`);
  } catch (error) {
    console.error("Error importing products:", error);
  }
}

importProducts().then(() => {
  console.log("Import completed");
  process.exit(0);
}).catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});