import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for serverless environment
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY // Use SERVICE_KEY for backend, not ANON_KEY
);
export default async function handler(req, res) {
  console.log("MIDTRANS SERVER KEY LOADED:", process.env.MIDTRANS_SERVER_KEY);
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
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

        // 🔥 Save transaction to database
    let transactionId = null;
    if (customer?.id_user && customer?.id_produk) {
      try {
        console.log('Saving to database...', {
          id_user: customer.id_user,
          id_produk: customer.id_produk,
          jumlah_dp: Number(gross_amount),
          kode_pembayaran: order_id
        });

        const { data: dbData, error: dbError } = await supabase
          .from('transaksi')
          .insert({
            id_user: customer.id_user,
            id_produk: customer.id_produk,
            jumlah_dp: Number(gross_amount),
            kode_pembayaran: order_id,
            status: 'pending',
            metode_pembayaran: null,
            sisa_pembayaran: 0, // Adjust this based on your calculation
            tanggal: new Date().toISOString(),
            catatan: customer.catatan || null
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          // Don't fail the whole request, just log it
        } else {
          console.log('Transaction saved successfully:', dbData);
          transactionId = dbData.id_transaksi;
        }
      } catch (dbErr) {
        console.error('Database exception:', dbErr);
      }
    } else {
      console.warn('Missing id_user or id_produk, skipping database save');
    }

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