from flask import Flask, request, jsonify
from flask_cors import CORS   # ✅ Tambahkan
import pickle
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5175"}})  # ✅ Izinkan request dari React

# Load model
model_membership = pickle.load(open('model_membership.pkl', 'rb'))
model_loyal = pickle.load(open('model_loyal.pkl', 'rb'))
model_penjualan = pickle.load(open('model_penjualan.pkl', 'rb'))

@app.route('/')
def home():
    return "API is running"

@app.route('/predict/membership', methods=['POST'])
def predict_membership():
    data = request.json
    fitur = np.array([
        data['Usia'],
        data['Gender'],
        data['Kanal_Pembelian'],
        data['Frekuensi_Bulan'],
        data['Total_Transaksi'],
        data['Produk_Favorit']
    ]).reshape(1, -1)

    pred = model_membership.predict(fitur)[0]
    return jsonify({'membership_level': int(pred)})

@app.route('/predict/loyal', methods=['POST'])
def predict_loyal():
    data = request.json
    fitur = np.array([
        data['Usia'],
        data['Gender'],
        data['Kanal_Pembelian'],
        data['Frekuensi_Bulan'],
        data['Produk_Favorit']
    ]).reshape(1, -1)

    pred = model_loyal.predict(fitur)[0]
    return jsonify({'loyal': int(pred)})

@app.route('/predict/sales', methods=['POST'])
def predict_sales():
    data = request.json
    fitur = np.array([
        data['Usia'],
        data['Gender'],
        data['Kanal_Pembelian'],
        data['Frekuensi_Bulan'],
        data['Produk_Favorit']
    ]).reshape(1, -1)

    pred = model_penjualan.predict(fitur)[0]
    return jsonify({'predicted_sales': float(pred)})

if __name__ == '__main__':
    app.run(debug=True)
