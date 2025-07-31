import pandas as pd
import pymongo
from pymongo import MongoClient
import logging
from typing import Dict, Any
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProductsDBLoader:
    def __init__(self, mongo_uri: str, database_name: str = "products_db"):
        """
        Initialize the MongoDB connection and database
        
        Args:
            mongo_uri: MongoDB connection URI
            database_name: Name of the database to use
        """
        self.mongo_uri = mongo_uri
        self.database_name = database_name
        self.client = None
        self.db = None
        self.collection = None
        
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(self.mongo_uri)
            # Test the connection
            self.client.admin.command('ping')
            self.db = self.client[self.database_name]
            self.collection = self.db.products
            logger.info(f"Successfully connected to MongoDB database: {self.database_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
    
    def create_indexes(self):
        """Create indexes for better query performance"""
        try:
            # Create indexes on commonly queried fields
            self.collection.create_index("id", unique=True)
            self.collection.create_index("category")
            self.collection.create_index("brand")
            self.collection.create_index("department")
            self.collection.create_index("sku")
            logger.info("Created database indexes successfully")
        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")
    
    def clean_and_convert_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and convert data types for MongoDB insertion
        
        Args:
            df: Raw pandas DataFrame from CSV
            
        Returns:
            Cleaned DataFrame with proper data types
        """
        # Create a copy to avoid modifying original
        cleaned_df = df.copy()
        
        # Convert numeric columns
        numeric_columns = ['id', 'cost', 'retail_price', 'distribution_center_id']
        for col in numeric_columns:
            if col in cleaned_df.columns:
                cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce')
        
        # Handle string columns - strip whitespace and handle nulls
        string_columns = ['category', 'name', 'brand', 'department', 'sku']
        for col in string_columns:
            if col in cleaned_df.columns:
                cleaned_df[col] = cleaned_df[col].astype(str).str.strip()
                cleaned_df[col] = cleaned_df[col].replace('nan', None)
        
        # Drop rows with null IDs as they're required
        initial_count = len(cleaned_df)
        cleaned_df = cleaned_df.dropna(subset=['id'])
        final_count = len(cleaned_df)
        
        if initial_count != final_count:
            logger.warning(f"Dropped {initial_count - final_count} rows with null IDs")
        
        logger.info(f"Data cleaning completed. Final dataset: {final_count} rows")
        return cleaned_df
    
    def load_csv_data(self, csv_path: str, chunk_size: int = 1000):
        """
        Load CSV data into MongoDB collection
        
        Args:
            csv_path: Path to the CSV file
            chunk_size: Number of records to insert in each batch
        """
        try:
            logger.info(f"Starting to read CSV file: {csv_path}")
            
            # Read CSV file
            df = pd.read_csv(csv_path)
            logger.info(f"Loaded CSV with {len(df)} rows and {len(df.columns)} columns")
            logger.info(f"Columns: {list(df.columns)}")
            
            # Clean and convert data
            df_cleaned = self.clean_and_convert_data(df)
            
            # Clear existing data
            logger.info("Clearing existing products collection...")
            self.collection.delete_many({})
            
            # Insert data in chunks
            total_inserted = 0
            for i in range(0, len(df_cleaned), chunk_size):
                chunk = df_cleaned.iloc[i:i + chunk_size]
                records = chunk.to_dict('records')
                
                try:
                    result = self.collection.insert_many(records, ordered=False)
                    total_inserted += len(result.inserted_ids)
                    logger.info(f"Inserted batch {i//chunk_size + 1}: {len(result.inserted_ids)} records")
                except pymongo.errors.BulkWriteError as e:
                    # Handle duplicate key errors and continue
                    successful_inserts = e.details['nInserted']
                    total_inserted += successful_inserts
                    logger.warning(f"Batch {i//chunk_size + 1}: {successful_inserts} successful, {len(e.details['writeErrors'])} errors")
            
            logger.info(f"Data loading completed! Total records inserted: {total_inserted}")
            return total_inserted
            
        except Exception as e:
            logger.error(f"Failed to load CSV data: {e}")
            return 0
    
    def verify_data(self):
        """Verify that data was loaded correctly"""
        try:
            # Get basic statistics
            total_count = self.collection.count_documents({})
            logger.info(f"Total documents in collection: {total_count}")
            
            # Sample some documents
            logger.info("Sample documents:")
            for doc in self.collection.find().limit(3):
                logger.info(f"  ID: {doc.get('id')}, Name: {doc.get('name')}, Category: {doc.get('category')}")
            
            # Get unique categories
            categories = self.collection.distinct("category")
            logger.info(f"Unique categories ({len(categories)}): {categories[:10]}...")  # Show first 10
            
            # Get unique brands
            brands = self.collection.distinct("brand")
            logger.info(f"Unique brands ({len(brands)}): {brands[:10]}...")  # Show first 10
            
            # Get price statistics
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "avg_cost": {"$avg": "$cost"},
                        "min_cost": {"$min": "$cost"},
                        "max_cost": {"$max": "$cost"},
                        "avg_retail": {"$avg": "$retail_price"},
                        "min_retail": {"$min": "$retail_price"},
                        "max_retail": {"$max": "$retail_price"}
                    }
                }
            ]
            
            stats = list(self.collection.aggregate(pipeline))
            if stats:
                stat = stats[0]
                logger.info("Price Statistics:")
                logger.info(f"  Cost - Min: ${stat['min_cost']:.2f}, Max: ${stat['max_cost']:.2f}, Avg: ${stat['avg_cost']:.2f}")
                logger.info(f"  Retail - Min: ${stat['min_retail']:.2f}, Max: ${stat['max_retail']:.2f}, Avg: ${stat['avg_retail']:.2f}")
            
            # Test some queries
            logger.info("Testing sample queries:")
            
            # Query by category
            accessories_count = self.collection.count_documents({"category": "Accessories"})
            logger.info(f"  Products in 'Accessories' category: {accessories_count}")
            
            # Query by price range
            expensive_count = self.collection.count_documents({"retail_price": {"$gt": 50}})
            logger.info(f"  Products with retail price > $50: {expensive_count}")
            
            # Query by brand
            mg_products = self.collection.count_documents({"brand": "MG"})
            logger.info(f"  Products from 'MG' brand: {mg_products}")
            
            logger.info("Data verification completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Data verification failed: {e}")
            return False
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

def main():
    # MongoDB connection URI
    MONGO_URI = "mongodb+srv://ashwani2749:12345@cluster0.rkbeh5k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    CSV_PATH = "archive/products.csv"
    
    # Initialize the loader
    loader = ProductsDBLoader(MONGO_URI)
    
    try:
        # Connect to MongoDB
        if not loader.connect():
            sys.exit(1)
        
        # Create indexes
        loader.create_indexes()
        
        # Load CSV data
        records_loaded = loader.load_csv_data(CSV_PATH)
        
        if records_loaded > 0:
            # Verify the data
            loader.verify_data()
            logger.info("✅ Database setup and data loading completed successfully!")
        else:
            logger.error("❌ No data was loaded into the database")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)
    finally:
        loader.close_connection()

if __name__ == "__main__":
    main() 