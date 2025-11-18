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

    // Validate input
    if (!order_id || !gross_amount || !customer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Midtrans Server Key (set this in Vercel environment variables)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    if (!serverKey) {
      return res.status(500).json({ error: 'Midtrans server key not configured' });
    }

    // Create Midtrans transaction
    const params = {
      transaction_details: {
        order_id: order_id,
        gross_amount: parseInt(gross_amount)
      },
      customer_details: {
        first_name: customer.first_name,
        email: customer.email,
        phone: customer.phone,
        billing_address: {
          address: customer.address
        }
      }
    };

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

    if (!midtransResponse.ok) {
      console.error('Midtrans error:', midtransData);
      return res.status(500).json({ 
        error: 'Midtrans API error', 
        details: midtransData 
      });
    }

    // Save transaction to Supabase
    const { data: transactionData, error: dbError } = await supabase
      .from('transaksi')
      .insert({
        id_user: customer.id_user,
        id_produk: customer.id_produk,
        jumlah_dp: gross_amount,
        kode_pembayaran: order_id,
        status: 'pending',
        metode_pembayaran: 'midtrans',
        sisa_pembayaran: 0, // or calculate remaining payment
        tanggal: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request, just log it
    }

    // Return Snap token
    return res.status(200).json({
      token: midtransData.token,
      redirect_url: midtransData.redirect_url,
      transaction_id: transactionData?.id_transaksi
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}