import Stripe from "stripe";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("🔑 Checking Stripe key...");

  // Check if Stripe key exists
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY is missing!");
    return res.status(500).json({
      error:
        "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.",
    });
  }

  console.log("✅ Stripe key found");

  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log("✅ Stripe initialized");

    const { amount, itemId, userId } = req.body;

    console.log("📦 Request data:", { amount, itemId, userId });

    // Validate request data
    if (!amount || !itemId || !userId) {
      console.error("❌ Missing required fields");
      return res.status(400).json({
        error: "Missing required fields: amount, itemId, or userId",
      });
    }

    console.log("🔄 Creating payment intent...");

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        itemId,
        userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log("✅ Payment intent created:", paymentIntent.id);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("❌ Stripe error:", error);
    return res.status(500).json({
      error: error.message || "Failed to create payment intent",
      details: error.toString(),
    });
  }
}
