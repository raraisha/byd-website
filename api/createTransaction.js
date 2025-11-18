// api/createTransaction.js
import supabase from "../supabase.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse request body
    const body = req.body;
    
    if (!body) {
      return res.status(400).json({ error: 'No body provided' });
    }

    const { order_id, gross_amount, customer } = body;

    // Basic validation
    if (!order_id || !gross_amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { order_id, gross_amount }
      });
    }

    // Check for Midtrans key
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    if (!serverKey) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'MIDTRANS_SERVER_KEY not set'
      });
    }

    // Prepare Midtrans request
    const params = {
      transaction_details: {
        order_id: String(order_id),
        gross_amount: Number(gross_amount)
      },
      customer_details: {
        first_name: customer?.first_name || 'Customer',
        email: customer?.email || 'customer@example.com',
        phone: customer?.phone || '08123456789'
      }
    };

    // Create authorization header
    const auth = Buffer.from(serverKey + ':').toString('base64');

    // Call Midtrans
    const response = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Midtrans error',
        details: data
      });
    }

    // Return success
    return res.status(200).json({
      token: data.token,
      redirect_url: data.redirect_url
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}