// api/createTransaction.js
import supabase from "../supabase.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order_id, gross_amount, customer } = req.body;

    // Log for debugging
    console.log('Received request:', { order_id, gross_amount, customer });

    // Validate input
    if (!order_id || !gross_amount || !customer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get Midtrans Server Key from environment
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    if (!serverKey) {
      console.error('Midtrans server key not found in environment');
      return res.status(500).json({ error: 'Midtrans configuration missing' });
    }

    // Prepare Midtrans request
    const params = {
      transaction_details: {
        order_id: order_id,
        gross_amount: parseInt(gross_amount)
      },
      customer_details: {
        first_name: customer.first_name || 'Customer',
        email: customer.email,
        phone: customer.phone,
        billing_address: {
          address: customer.address || ''
        }
      }
    };

    console.log('Calling Midtrans API...');

    // Call Midtrans Snap API
    const midtransResponse = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(serverKey + ':').toString('base64')
      },
      body: JSON.stringify(params)
    });

    const midtransData = await midtransResponse.json();
    console.log('Midtrans response:', midtransData);

    if (!midtransResponse.ok) {
      console.error('Midtrans error:', midtransData);
      return res.status(500).json({ 
        error: 'Midtrans API error', 
        details: midtransData 
      });
    }

    // Save to Supabase (optional, add later)
    // For now, just return the token

    return res.status(200).json({
      token: midtransData.token,
      redirect_url: midtransData.redirect_url
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
}