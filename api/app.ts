import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Increase payload limit for Base64 image uploads (<1.5MB requested, 10MB limit is safe)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Configuration
const uri = process.env.MONGODB_URI || process.env.Mongodb_URI || process.env.MongoDB_URI;
let mongoClient: MongoClient | null = null;
let db: any = null;
let mode: "database" | "memory" = "memory";
let connected = false;
let dbError: string | null = null;
let dbName = "memory";

// In-Memory Database Fallback with rich default enterprise business cards
let memoryContacts: any[] = [
  {
    _id: "60c72b2f9b1d8b2a1c8f4e2c",
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah.jenkins@cardnet.io",
    phone: "+1 (555) 019-2834",
    title: "Chief Design Officer",
    organization: "CardNet Inc.",
    website: "https://cardnet.io",
    address: "100 Pine Street, San Francisco, CA 94111",
    avatar: "", // Will render beautiful fallback initials
    socials: {
      linkedin: "sarah-jenkins-design",
      twitter: "sarah_j_design",
      github: "sarahj-dev",
      instagram: "sarah_creates",
      facebook: ""
    },
    createdAt: new Date("2026-05-18T08:30:00Z").toISOString()
  },
  {
    _id: "60c72b2f9b1d8b2a1c8f4e2d",
    firstName: "Alex",
    lastName: "Chen",
    email: "alex.chen@techcorp.com",
    phone: "+1 (555) 048-1920",
    title: "Principal Solutions Engineer",
    organization: "TechCorp Systems",
    website: "https://techcorp.com",
    address: "456 Silicon Blvd, San Jose, CA 95134",
    avatar: "",
    socials: {
      linkedin: "alexchen-tech",
      twitter: "alexchen_dev",
      github: "alexchen-git",
      instagram: "",
      facebook: ""
    },
    createdAt: new Date("2026-05-19T10:15:00Z").toISOString()
  }
];

// Global caching for MongoDB connection in Serverless environments (Vercel)
let cachedClient: MongoClient | null = (global as any)._mongoClient || null;
let cachedDb: any = (global as any)._mongoDb || null;

let lastConnectionAttempt = 0;
const RECONNECT_INTERVAL_MS = 45000; // Rate limit reconnection to once per 45 seconds to prevent request stalls

// Asymmetric MongoDB Client Initializer
async function initializeDatabase() {
  if (!uri) {
    console.log("[CARDNET] No database configuration found (checked MONGODB_URI, Mongodb_URI, and MongoDB_URI). Running in MEMORY mode (Demo mode).");
    mode = "memory";
    dbError = "MONGODB_URI environment variable is missing. Please add/verify it in settings.";
    return;
  }

  // Rate-limit connection attempts to prevent clogging the event loop with failing connections
  const now = Date.now();
  if (!connected && now - lastConnectionAttempt < RECONNECT_INTERVAL_MS) {
    console.log("[CARDNET] Rate-limiting MongoDB connection attempt. Reusing current connection status.");
    return;
  }
  lastConnectionAttempt = now;

  try {
    const cleanUri = uri.trim();

    if (cachedClient && cachedDb) {
      mongoClient = cachedClient;
      db = cachedDb;
      dbName = db.databaseName || "cardnet";
      mode = "database";
      connected = true;
      dbError = null;
      console.log(`[CARDNET] Reused cached MongoDB connection to db: "${dbName}"`);
      return;
    }

    console.log("[CARDNET] Connecting to MongoDB: ", cleanUri.substring(0, Math.min(cleanUri.length, 25)) + "...");
    
    // Set standard connection and selection timeouts
    mongoClient = new MongoClient(cleanUri, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000 
    });
    
    await mongoClient.connect();
    db = mongoClient.db();
    dbName = db.databaseName || "cardnet";
    
    // Cache the connection
    cachedClient = mongoClient;
    cachedDb = db;
    (global as any)._mongoClient = mongoClient;
    (global as any)._mongoDb = db;

    mode = "database";
    connected = true;
    dbError = null;
    console.log(`[CARDNET] Connected successfully to MongoDB db: "${dbName}"`);
  } catch (err: any) {
    let message = err.message || "Failed to establish a connection to Server";
    if (message.includes("alert number 80") || message.includes("alert internal error") || message.includes("ssl3_read_bytes")) {
      message += " - SUGGESTION: This is a TLS handshake failure (Alert 80), usually because MongoDB Atlas blocked the connection. Please whitelist IP address '0.0.0.0/0' (Allow access from anywhere) in Atlas Database/Network security settings.";
    }
    console.error("[CARDNET] Database connection failed! Safely falling back to MEMORY mode.", message);
    mode = "memory";
    connected = false;
    dbError = message;
  }
}

// Spark Database Connection asynchronously immediately
initializeDatabase().catch(err => {
  console.error("[CARDNET] Critical setup error:", err);
});

// GET /api/config: Returns the system status
app.get("/api/config", (req, res) => {
  res.json({
    configured: !!uri,
    mode: mode,
    connected: connected,
    dbName: mode === "database" ? dbName : "cardnet_in_memory",
    error: dbError
  });
});

// Middleware helper to ensure connection state or perform retry if database was failed
app.use((req, res, next) => {
  // If we should be on database but disconnected, or if mongoClient isn't connected but URI is set,
  // we can attempt a lazy reconnection trigger in the background to avoid blocking the HTTP request
  if (uri && !connected) {
    initializeDatabase().catch((err) => {
      console.error("[CARDNET] Non-blocking background lazy reconnection failed:", err);
    });
  }
  next();
});

// GET /api/contacts - Retrieve all contact cards
app.get("/api/contacts", async (req, res) => {
  try {
    if (mode === "database" && db) {
      const contacts = await db
        .collection("contacts")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      return res.json(contacts);
    } else {
      // Memory Mode - return copy sorted by descending date
      const sortedMemory = [...memoryContacts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return res.json(sortedMemory);
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve contacts", details: err.message });
  }
});

// GET /api/contacts/:id - Retrieve a public card details
app.get("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;

  // Validate ID format using ObjectId.isValid()
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format. Must be a 24-char hex string." });
  }

  try {
    if (mode === "database" && db) {
      const contact = await db.collection("contacts").findOne({ _id: new ObjectId(id) });
      if (!contact) {
        return res.status(404).json({ error: "Contact card not found" });
      }
      return res.json(contact);
    } else {
      const contact = memoryContacts.find(c => c._id === id);
      if (!contact) {
        return res.status(404).json({ error: "Contact card not found" });
      }
      return res.json(contact);
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Error retrieving contact", details: err.message });
  }
});

// POST /api/contacts - Create a new contact card
app.post("/api/contacts", async (req, res) => {
  try {
    const contactData = { ...req.body };
    const newId = new ObjectId(); // Pre-generate standard 24-character ObjectId
    const createdAt = new Date().toISOString();

    const newContactDoc = {
      _id: mode === "database" ? newId : newId.toString(),
      firstName: contactData.firstName || "",
      lastName: contactData.lastName || "",
      email: contactData.email || "",
      phone: contactData.phone || "",
      title: contactData.title || "",
      organization: contactData.organization || "",
      website: contactData.website || "",
      address: contactData.address || "",
      avatar: contactData.avatar || "",
      socials: {
        linkedin: (contactData.socials && contactData.socials.linkedin) || "",
        twitter: (contactData.socials && contactData.socials.twitter) || "",
        github: (contactData.socials && contactData.socials.github) || "",
        instagram: (contactData.socials && contactData.socials.instagram) || "",
        facebook: (contactData.socials && contactData.socials.facebook) || ""
      },
      createdAt
    };

    if (mode === "database" && db) {
      await db.collection("contacts").insertOne({
        ...newContactDoc,
        _id: newId // Use actual ObjectId in mongo
      });
      return res.status(201).json({ ...newContactDoc, _id: newId.toString() });
    } else {
      memoryContacts.unshift(newContactDoc);
      return res.status(201).json(newContactDoc);
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create contact card", details: err.message });
  }
});

// PUT /api/contacts/:id - Update an existing contact card
app.put("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;

  // Validate ID format using ObjectId.isValid()
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format. Must be a 24-char hex string." });
  }

  try {
    const { _id, createdAt, ...updateData } = req.body;

    // Sanitize subfields to prevent nested structure issues
    const sanitizedData = {
      firstName: updateData.firstName ?? "",
      lastName: updateData.lastName ?? "",
      email: updateData.email ?? "",
      phone: updateData.phone ?? "",
      title: updateData.title ?? "",
      organization: updateData.organization ?? "",
      website: updateData.website ?? "",
      address: updateData.address ?? "",
      avatar: updateData.avatar ?? "",
      socials: {
        linkedin: (updateData.socials && updateData.socials.linkedin) ?? "",
        twitter: (updateData.socials && updateData.socials.twitter) ?? "",
        github: (updateData.socials && updateData.socials.github) ?? "",
        instagram: (updateData.socials && updateData.socials.instagram) ?? "",
        facebook: (updateData.socials && updateData.socials.facebook) ?? ""
      }
    };

    if (mode === "database" && db) {
      const result = await db.collection("contacts").updateOne(
        { _id: new ObjectId(id) },
        { $set: sanitizedData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Contact card not found" });
      }

      const updatedDoc = await db.collection("contacts").findOne({ _id: new ObjectId(id) });
      return res.json(updatedDoc);
    } else {
      const index = memoryContacts.findIndex(c => c._id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Contact card not found" });
      }

      const updatedDoc = {
        ...memoryContacts[index],
        ...sanitizedData,
        socials: {
          ...memoryContacts[index].socials,
          ...sanitizedData.socials
        }
      };

      memoryContacts[index] = updatedDoc;
      return res.json(updatedDoc);
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update contact card", details: err.message });
  }
});

// DELETE /api/contacts/:id - Delete a contact card
app.delete("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;

  // Validate ID format using ObjectId.isValid()
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format. Must be a 24-char hex string." });
  }

  try {
    if (mode === "database" && db) {
      const result = await db.collection("contacts").deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Contact card not found" });
      }
      return res.json({ success: true, message: "Contact card deleted from database" });
    } else {
      const index = memoryContacts.findIndex(c => c._id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Contact card not found" });
      }
      memoryContacts.splice(index, 1);
      return res.json({ success: true, message: "Contact card deleted from memory" });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete contact card", details: err.message });
  }
});

export default app;
