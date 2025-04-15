import { 
  users, type User, type InsertUser,
  contentItems, type ContentItem, type InsertContentItem,
  faqCategories, type FaqCategory, type InsertFaqCategory,
  faqItems, type FaqItem, type InsertFaqItem,
  partnerPromotions, type PartnerPromotion, type InsertPartnerPromotion,
  appSettings, type AppSetting, type InsertAppSetting
} from "@shared/schema";
import { eq, and, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from '@neondatabase/serverless';

// Create a connection to the database
let db: any = null;

try {
  if (process.env.DATABASE_URL) {
    // Create a SQL connection pool
    const sql = neon(process.env.DATABASE_URL);
    
    // Initialize drizzle with the connection
    db = drizzle(sql);
    console.log("Database connection established");
  } else {
    console.log("No DATABASE_URL provided, using in-memory storage");
  }
} catch (error) {
  console.error("Failed to connect to the database:", error);
}

// Export the Drizzle instance
export { db };

// Force using in-memory storage for demonstration
const USE_MEMORY_STORAGE = true;

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods (from the original implementation)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Admin wallet methods have been removed
  
  // Content item methods
  getContentItems(language?: string, network?: string): Promise<ContentItem[]>;
  getContentItem(id: number): Promise<ContentItem | undefined>;
  getContentItemByKey(key: string, language?: string, network?: string): Promise<ContentItem | undefined>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  updateContentItem(id: number, item: Partial<InsertContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: number): Promise<boolean>;
  
  // FAQ methods
  getFaqCategories(language?: string, network?: string): Promise<FaqCategory[]>;
  getFaqCategory(id: number): Promise<FaqCategory | undefined>;
  createFaqCategory(category: InsertFaqCategory): Promise<FaqCategory>;
  updateFaqCategory(id: number, category: Partial<InsertFaqCategory>): Promise<FaqCategory | undefined>;
  deleteFaqCategory(id: number): Promise<boolean>;
  
  getFaqItems(categoryId?: number, language?: string, network?: string): Promise<FaqItem[]>;
  getFaqItem(id: number): Promise<FaqItem | undefined>;
  createFaqItem(item: InsertFaqItem): Promise<FaqItem>;
  updateFaqItem(id: number, item: Partial<InsertFaqItem>): Promise<FaqItem | undefined>;
  deleteFaqItem(id: number): Promise<boolean>;
  
  // Partner promotion methods
  getPartnerPromotions(language?: string, network?: string, activeOnly?: boolean): Promise<PartnerPromotion[]>;
  getPartnerPromotion(id: number): Promise<PartnerPromotion | undefined>;
  createPartnerPromotion(promotion: InsertPartnerPromotion): Promise<PartnerPromotion>;
  updatePartnerPromotion(id: number, promotion: Partial<InsertPartnerPromotion>): Promise<PartnerPromotion | undefined>;
  deletePartnerPromotion(id: number): Promise<boolean>;
  
  // App settings methods
  getAppSettings(): Promise<AppSetting[]>;
  getAppSetting(key: string): Promise<AppSetting | undefined>;
  createOrUpdateAppSetting(setting: InsertAppSetting): Promise<AppSetting>;
  deleteAppSetting(key: string): Promise<boolean>;
}

// Fallback in-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contentItems: Map<number, ContentItem>;
  private faqCategories: Map<number, FaqCategory>;
  private faqItems: Map<number, FaqItem>;
  private partnerPromotions: Map<number, PartnerPromotion>;
  private appSettings: Map<string, AppSetting>;
  
  currentId: {
    users: number;
    contentItems: number;
    faqCategories: number;
    faqItems: number;
    partnerPromotions: number;
    appSettings: number;
  };

  constructor() {
    this.users = new Map();
    this.contentItems = new Map();
    this.faqCategories = new Map();
    this.faqItems = new Map();
    this.partnerPromotions = new Map();
    this.appSettings = new Map();
    
    this.currentId = {
      users: 1,
      contentItems: 1,
      faqCategories: 1,
      faqItems: 1,
      partnerPromotions: 1,
      appSettings: 1
    };
    
    // Add sample partner promotions
    this.createPartnerPromotion({
      name: "JoyID Wallet",
      description: "Connect your SiTa Minter to JoyID for a secure token creation experience",
      short_description: "Secure your SiTa experience",
      logo_text: "JoyID",
      logo_background: "#7f58d3",
      logo_color: "#ffffff",
      link_url: "https://joy.id",
      link_text: "Visit JoyID",
      order: 1,
      language: "en",
      network: "testnet",
      active: true
    });
    
    this.createPartnerPromotion({
      name: "UTXO Global",
      description: "Manage BTC and CKB assets in one secure wallet",
      short_description: "Your universal wallet",
      logo_text: "UTXO",
      logo_background: "#ff6b00",
      logo_color: "#ffffff",
      link_url: "https://utxo.global",
      link_text: "Get UTXO Global",
      order: 2,
      language: "en",
      network: "testnet",
      active: true
    });
    
    // Add sample app settings
    this.createOrUpdateAppSetting({
      key: "welcomeMessage",
      value: "Welcome to SiTa Minter - your gateway to token creation on Nervos Network!"
    });
    
    this.createOrUpdateAppSetting({
      key: "maintenanceMode",
      value: false
    });
    
    this.createOrUpdateAppSetting({
      key: "tokenFee",
      value: 100
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Admin wallet methods have been removed
  async isAdminWallet(): Promise<boolean> {
    return false;
  }
  
  async getAdminWallets(): Promise<any[]> {
    return [];
  }
  
  async getAdminWallet(): Promise<undefined> {
    return undefined;
  }
  
  async getAdminWalletByAddress(): Promise<undefined> {
    return undefined;
  }
  
  async createAdminWallet(): Promise<any> {
    console.log("Admin functionality has been removed");
    return {};
  }
  
  async deleteAdminWallet(): Promise<boolean> {
    return true;
  }
  
  // Content item methods
  async getContentItems(language?: string, network?: string): Promise<ContentItem[]> {
    let items = Array.from(this.contentItems.values());
    
    if (language) {
      items = items.filter(item => item.language === language);
    }
    
    if (network) {
      items = items.filter(item => item.network === network);
    }
    
    return items;
  }
  
  async getContentItem(id: number): Promise<ContentItem | undefined> {
    return this.contentItems.get(id);
  }
  
  async getContentItemByKey(key: string, language = 'en', network = 'testnet'): Promise<ContentItem | undefined> {
    return Array.from(this.contentItems.values()).find(
      (item) => item.key === key && item.language === language && item.network === network,
    );
  }
  
  async createContentItem(item: InsertContentItem): Promise<ContentItem> {
    const id = this.currentId.contentItems++;
    const updated_at = new Date();
    const newItem: ContentItem = { ...item, id, updated_at };
    this.contentItems.set(id, newItem);
    return newItem;
  }
  
  async updateContentItem(id: number, item: Partial<InsertContentItem>): Promise<ContentItem | undefined> {
    const existingItem = this.contentItems.get(id);
    if (!existingItem) return undefined;
    
    const updated = { 
      ...existingItem, 
      ...item, 
      updated_at: new Date() 
    };
    
    this.contentItems.set(id, updated);
    return updated;
  }
  
  async deleteContentItem(id: number): Promise<boolean> {
    return this.contentItems.delete(id);
  }
  
  // FAQ methods
  async getFaqCategories(language?: string, network?: string): Promise<FaqCategory[]> {
    let categories = Array.from(this.faqCategories.values());
    
    if (language) {
      categories = categories.filter(cat => cat.language === language);
    }
    
    if (network) {
      categories = categories.filter(cat => cat.network === network);
    }
    
    return categories.sort((a, b) => a.order - b.order);
  }
  
  async getFaqCategory(id: number): Promise<FaqCategory | undefined> {
    return this.faqCategories.get(id);
  }
  
  async createFaqCategory(category: InsertFaqCategory): Promise<FaqCategory> {
    const id = this.currentId.faqCategories++;
    const newCategory: FaqCategory = { ...category, id };
    this.faqCategories.set(id, newCategory);
    return newCategory;
  }
  
  async updateFaqCategory(id: number, category: Partial<InsertFaqCategory>): Promise<FaqCategory | undefined> {
    const existingCategory = this.faqCategories.get(id);
    if (!existingCategory) return undefined;
    
    const updated = { ...existingCategory, ...category };
    this.faqCategories.set(id, updated);
    return updated;
  }
  
  async deleteFaqCategory(id: number): Promise<boolean> {
    // Also delete all items in this category
    const itemsToDelete = Array.from(this.faqItems.values())
      .filter(item => item.category_id === id)
      .map(item => item.id);
      
    itemsToDelete.forEach(itemId => this.faqItems.delete(itemId));
    
    return this.faqCategories.delete(id);
  }
  
  async getFaqItems(categoryId?: number, language?: string, network?: string): Promise<FaqItem[]> {
    let items = Array.from(this.faqItems.values());
    
    if (categoryId !== undefined) {
      items = items.filter(item => item.category_id === categoryId);
    }
    
    if (language) {
      items = items.filter(item => item.language === language);
    }
    
    if (network) {
      items = items.filter(item => item.network === network);
    }
    
    return items.sort((a, b) => a.order - b.order);
  }
  
  async getFaqItem(id: number): Promise<FaqItem | undefined> {
    return this.faqItems.get(id);
  }
  
  async createFaqItem(item: InsertFaqItem): Promise<FaqItem> {
    const id = this.currentId.faqItems++;
    const newItem: FaqItem = { ...item, id };
    this.faqItems.set(id, newItem);
    return newItem;
  }
  
  async updateFaqItem(id: number, item: Partial<InsertFaqItem>): Promise<FaqItem | undefined> {
    const existingItem = this.faqItems.get(id);
    if (!existingItem) return undefined;
    
    const updated = { ...existingItem, ...item };
    this.faqItems.set(id, updated);
    return updated;
  }
  
  async deleteFaqItem(id: number): Promise<boolean> {
    return this.faqItems.delete(id);
  }
  
  // Partner promotion methods
  async getPartnerPromotions(language?: string, network?: string, activeOnly = true): Promise<PartnerPromotion[]> {
    let promotions = Array.from(this.partnerPromotions.values());
    
    if (activeOnly) {
      promotions = promotions.filter(promo => promo.active);
    }
    
    if (language) {
      promotions = promotions.filter(promo => promo.language === language);
    }
    
    if (network) {
      promotions = promotions.filter(promo => promo.network === network);
    }
    
    return promotions.sort((a, b) => a.order - b.order);
  }
  
  async getPartnerPromotion(id: number): Promise<PartnerPromotion | undefined> {
    return this.partnerPromotions.get(id);
  }
  
  async createPartnerPromotion(promotion: InsertPartnerPromotion): Promise<PartnerPromotion> {
    const id = this.currentId.partnerPromotions++;
    const newPromotion: PartnerPromotion = { ...promotion, id };
    this.partnerPromotions.set(id, newPromotion);
    return newPromotion;
  }
  
  async updatePartnerPromotion(id: number, promotion: Partial<InsertPartnerPromotion>): Promise<PartnerPromotion | undefined> {
    const existingPromotion = this.partnerPromotions.get(id);
    if (!existingPromotion) return undefined;
    
    const updated = { ...existingPromotion, ...promotion };
    this.partnerPromotions.set(id, updated);
    return updated;
  }
  
  async deletePartnerPromotion(id: number): Promise<boolean> {
    return this.partnerPromotions.delete(id);
  }
  
  // App settings methods
  async getAppSettings(): Promise<AppSetting[]> {
    return Array.from(this.appSettings.values());
  }
  
  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    return Array.from(this.appSettings.values()).find(setting => setting.key === key);
  }
  
  async createOrUpdateAppSetting(setting: InsertAppSetting): Promise<AppSetting> {
    const existingSetting = await this.getAppSetting(setting.key);
    const updated_at = new Date();
    
    if (existingSetting) {
      const updated = { 
        ...existingSetting, 
        value: setting.value,
        updated_at 
      };
      this.appSettings.set(updated.key, updated);
      return updated;
    } else {
      const id = this.currentId.appSettings++;
      const newSetting: AppSetting = { ...setting, id, updated_at };
      this.appSettings.set(setting.key, newSetting);
      return newSetting;
    }
  }
  
  async deleteAppSetting(key: string): Promise<boolean> {
    const setting = await this.getAppSetting(key);
    if (!setting) return false;
    return this.appSettings.delete(key);
  }
}

// PgStorage implementation if database is available
export class PgStorage implements IStorage {
  constructor() {
    // Initialize sample data
    this.initializeSampleData();
  }
  
  private async initializeSampleData() {
    try {
      if (!db) return;

      // Add sample partner promotions
      const existingPromotions = await db.select().from(partnerPromotions);
      if (existingPromotions.length === 0) {
        await db.insert(partnerPromotions).values([
          {
            name: "JoyID Wallet",
            description: "Connect your SiTa Minter to JoyID for a secure token creation experience",
            short_description: "Secure your SiTa experience",
            logo_text: "JoyID",
            logo_background: "#7f58d3",
            logo_color: "#ffffff",
            link_url: "https://joy.id",
            link_text: "Visit JoyID",
            order: 1,
            language: "en",
            network: "testnet",
            active: true
          },
          {
            name: "UTXO Global",
            description: "Manage BTC and CKB assets in one secure wallet",
            short_description: "Your universal wallet",
            logo_text: "UTXO",
            logo_background: "#ff6b00",
            logo_color: "#ffffff",
            link_url: "https://utxo.global",
            link_text: "Get UTXO Global",
            order: 2,
            language: "en",
            network: "testnet",
            active: true
          }
        ]);
        console.log("Sample partner promotions created");
      }
      
      // Add sample app settings
      const existingSettings = await db.select().from(appSettings);
      if (existingSettings.length === 0) {
        await db.insert(appSettings).values([
          {
            key: "welcomeMessage",
            value: "Welcome to SiTa Minter - your gateway to token creation on Nervos Network!",
            updated_at: new Date()
          },
          {
            key: "maintenanceMode",
            value: false,
            updated_at: new Date()
          },
          {
            key: "tokenFee",
            value: 100,
            updated_at: new Date()
          }
        ]);
        console.log("Sample app settings created");
      }
    } catch (error) {
      console.error("Failed to initialize sample data:", error);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not connected");
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // Admin wallet methods have been removed
  async isAdminWallet(): Promise<boolean> {
    return false;
  }
  
  async getAdminWallets(): Promise<any[]> {
    return [];
  }
  
  async getAdminWallet(): Promise<undefined> {
    return undefined;
  }
  
  async getAdminWalletByAddress(): Promise<undefined> {
    return undefined;
  }
  
  async createAdminWallet(): Promise<any> {
    console.log("Admin functionality has been removed");
    return {};
  }
  
  async deleteAdminWallet(): Promise<boolean> {
    return true;
  }
  
  // Content item methods
  async getContentItems(language?: string, network?: string): Promise<ContentItem[]> {
    if (!db) throw new Error("Database not connected");
    
    let query = db.select().from(contentItems);
    
    if (language) {
      query = query.where(eq(contentItems.language, language));
    }
    
    if (network) {
      query = query.where(eq(contentItems.network, network));
    }
    
    return await query;
  }
  
  async getContentItem(id: number): Promise<ContentItem | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return result[0];
  }
  
  async getContentItemByKey(key: string, language = 'en', network = 'testnet'): Promise<ContentItem | undefined> {
    if (!db) throw new Error("Database not connected");
    
    const result = await db.select().from(contentItems).where(
      and(
        eq(contentItems.key, key),
        eq(contentItems.language, language),
        eq(contentItems.network, network)
      )
    );
    
    return result[0];
  }
  
  async createContentItem(item: InsertContentItem): Promise<ContentItem> {
    if (!db) throw new Error("Database not connected");
    const result = await db.insert(contentItems).values({
      ...item,
      updated_at: new Date()
    }).returning();
    return result[0];
  }
  
  async updateContentItem(id: number, item: Partial<InsertContentItem>): Promise<ContentItem | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.update(contentItems)
      .set({
        ...item,
        updated_at: new Date()
      })
      .where(eq(contentItems.id, id))
      .returning();
    return result[0];
  }
  
  async deleteContentItem(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not connected");
    const result = await db.delete(contentItems).where(eq(contentItems.id, id)).returning();
    return result.length > 0;
  }
  
  // FAQ methods
  async getFaqCategories(language?: string, network?: string): Promise<FaqCategory[]> {
    if (!db) throw new Error("Database not connected");
    
    let query = db.select().from(faqCategories);
    
    if (language) {
      query = query.where(eq(faqCategories.language, language));
    }
    
    if (network) {
      query = query.where(eq(faqCategories.network, network));
    }
    
    return await query.orderBy(asc(faqCategories.order));
  }
  
  async getFaqCategory(id: number): Promise<FaqCategory | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(faqCategories).where(eq(faqCategories.id, id));
    return result[0];
  }
  
  async createFaqCategory(category: InsertFaqCategory): Promise<FaqCategory> {
    if (!db) throw new Error("Database not connected");
    const result = await db.insert(faqCategories).values(category).returning();
    return result[0];
  }
  
  async updateFaqCategory(id: number, category: Partial<InsertFaqCategory>): Promise<FaqCategory | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.update(faqCategories)
      .set(category)
      .where(eq(faqCategories.id, id))
      .returning();
    return result[0];
  }
  
  async deleteFaqCategory(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not connected");
    // Items will be automatically deleted due to CASCADE constraint
    const result = await db.delete(faqCategories).where(eq(faqCategories.id, id)).returning();
    return result.length > 0;
  }
  
  async getFaqItems(categoryId?: number, language?: string, network?: string): Promise<FaqItem[]> {
    if (!db) throw new Error("Database not connected");
    
    let query = db.select().from(faqItems);
    
    if (categoryId !== undefined) {
      query = query.where(eq(faqItems.category_id, categoryId));
    }
    
    if (language) {
      query = query.where(eq(faqItems.language, language));
    }
    
    if (network) {
      query = query.where(eq(faqItems.network, network));
    }
    
    return await query.orderBy(asc(faqItems.order));
  }
  
  async getFaqItem(id: number): Promise<FaqItem | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(faqItems).where(eq(faqItems.id, id));
    return result[0];
  }
  
  async createFaqItem(item: InsertFaqItem): Promise<FaqItem> {
    if (!db) throw new Error("Database not connected");
    const result = await db.insert(faqItems).values(item).returning();
    return result[0];
  }
  
  async updateFaqItem(id: number, item: Partial<InsertFaqItem>): Promise<FaqItem | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.update(faqItems)
      .set(item)
      .where(eq(faqItems.id, id))
      .returning();
    return result[0];
  }
  
  async deleteFaqItem(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not connected");
    const result = await db.delete(faqItems).where(eq(faqItems.id, id)).returning();
    return result.length > 0;
  }
  
  // Partner promotion methods
  async getPartnerPromotions(language?: string, network?: string, activeOnly = true): Promise<PartnerPromotion[]> {
    if (!db) throw new Error("Database not connected");
    
    let query = db.select().from(partnerPromotions);
    
    if (activeOnly) {
      query = query.where(eq(partnerPromotions.active, true));
    }
    
    if (language) {
      query = query.where(eq(partnerPromotions.language, language));
    }
    
    if (network) {
      query = query.where(eq(partnerPromotions.network, network));
    }
    
    return await query.orderBy(asc(partnerPromotions.order));
  }
  
  async getPartnerPromotion(id: number): Promise<PartnerPromotion | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(partnerPromotions).where(eq(partnerPromotions.id, id));
    return result[0];
  }
  
  async createPartnerPromotion(promotion: InsertPartnerPromotion): Promise<PartnerPromotion> {
    if (!db) throw new Error("Database not connected");
    const result = await db.insert(partnerPromotions).values(promotion).returning();
    return result[0];
  }
  
  async updatePartnerPromotion(id: number, promotion: Partial<InsertPartnerPromotion>): Promise<PartnerPromotion | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.update(partnerPromotions)
      .set(promotion)
      .where(eq(partnerPromotions.id, id))
      .returning();
    return result[0];
  }
  
  async deletePartnerPromotion(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not connected");
    const result = await db.delete(partnerPromotions).where(eq(partnerPromotions.id, id)).returning();
    return result.length > 0;
  }
  
  // App settings methods
  async getAppSettings(): Promise<AppSetting[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(appSettings);
  }
  
  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    if (!db) throw new Error("Database not connected");
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return result[0];
  }
  
  async createOrUpdateAppSetting(setting: InsertAppSetting): Promise<AppSetting> {
    if (!db) throw new Error("Database not connected");
    
    const existingSetting = await this.getAppSetting(setting.key);
    
    if (existingSetting) {
      const result = await db.update(appSettings)
        .set({
          value: setting.value,
          updated_at: new Date()
        })
        .where(eq(appSettings.key, setting.key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(appSettings)
        .values({
          ...setting,
          updated_at: new Date()
        })
        .returning();
      return result[0];
    }
  }
  
  async deleteAppSetting(key: string): Promise<boolean> {
    if (!db) throw new Error("Database not connected");
    const result = await db.delete(appSettings).where(eq(appSettings.key, key)).returning();
    return result.length > 0;
  }
}

// Determine which storage implementation to use
// Force the use of in-memory storage for demonstration purposes
// This can be removed once database connectivity issues are resolved
// export const storage = db ? new PgStorage() : new MemStorage();
export const storage = new MemStorage();
